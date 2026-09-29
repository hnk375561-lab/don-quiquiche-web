// Utilidades compartidas por build.mjs y check.mjs. Sin dependencias.
import fs from 'node:fs'; import vm from 'node:vm';

export function loadSite(file = 'data/site.js') {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), ctx, { timeout: 1000 });
  return ctx.window.SITE;
}

// ---------- Validadores de valores ----------
export const isTelNumber = v => typeof v === 'string' && /^\+[1-9]\d{9,14}$/.test(v);
export const isWhatsAppNumber = v => typeof v === 'string' && /^[1-9]\d{10,14}$/.test(v);

/** Solo https:, sin credenciales, con host con punto. `hosts` (opcional) restringe el dominio (o subdominios). */
export function isHttpsUrl(u, hosts) {
  if (typeof u !== 'string') return false;
  let x; try { x = new URL(u); } catch { return false; }
  if (x.protocol !== 'https:' || x.username || x.password || !x.hostname.includes('.')) return false;
  return !hosts || hosts.some(h => x.hostname === h || x.hostname.endsWith('.' + h));
}

/** Ruta relativa dentro de assets/, sin "..", sin esquema (javascript:, data:, file:, etc.). */
export function isRelativeAssetPath(p) {
  return typeof p === 'string'
    && /^assets\/[A-Za-z0-9_\-./]+\.(?:avif|webp|jpe?g|png|svg)$/i.test(p)
    && !p.split('/').some(s => s === '' || s === '.' || s === '..');
}

const isRealDate = s => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number), t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
};

const MAPS_HOSTS = ['google.com', 'google.com.ar', 'maps.app.goo.gl', 'goo.gl'];
const IMAGE_STATUS = ['authorized', 'pending'];
const EVENT_STATUS = ['confirmed', 'historical', 'pending'];
const VERIFY_STATUS = ['unverified', 'public-source', 'confirmed-by-business'];

// ---------- Schema de data/site.js: errores con la ruta del campo ----------
export function validateSite(S, { exists = f => fs.existsSync(f) } = {}) {
  const errors = [], warnings = [];
  const bad = (p, m) => errors.push(`${p}: ${m}`);
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const str = (p, v) => (typeof v === 'string' && v.trim()) ? true : (bad(p, 'required non-empty string'), false);
  const httpsOrNull = (p, v, hosts) => { if (v !== null && !isHttpsUrl(v, hosts)) bad(p, `debe ser null o URL https://${hosts ? ' de ' + hosts[0] : ''} (recibido: ${JSON.stringify(v)})`); };
  const asset = (p, v) => { if (!isRelativeAssetPath(v)) return bad(p, `ruta relativa dentro de assets/ (sin "..", sin esquema); recibido: ${JSON.stringify(v)}`); if (!exists(v)) bad(p, 'archivo inexistente: ' + v); };

  if (!isObj(S)) return { errors: ['S: window.SITE no existe o no es un objeto'], warnings };

  // Identidad y metadatos SEO
  ['name', 'fullName', 'title', 'description', 'socialDescription'].forEach(k => str(k, S[k]));
  if (!(typeof S.locale === 'string' && /^[a-z]{2}_[A-Z]{2}$/.test(S.locale))) bad('locale', 'formato xx_YY (ej. es_AR)');
  if (!['website', 'article', 'profile'].includes(S.ogType)) bad('ogType', 'website | article | profile');

  // Dirección (el build la parte en calle, ciudad, provincia)
  if (str('address', S.address) && S.address.split(',').filter(x => x.trim()).length < 3) bad('address', 'formato "Calle, Ciudad, Provincia"');

  // Contacto
  if (!isTelNumber(S.phone)) bad('phone', 'formato +<código><número> solo dígitos (ej. +543442581870)');
  str('phoneLabel', S.phoneLabel);
  if (!isWhatsAppNumber(S.whatsapp)) bad('whatsapp', 'solo dígitos, con código de país (ej. 5493442581870)');
  if (isObj(S.waMessages)) ['general', 'reserva', 'carta', 'eventos'].forEach(k => str(`waMessages.${k}`, S.waMessages[k]));
  else bad('waMessages', 'required object');

  // Redes y mapa: solo https
  if (!isHttpsUrl(S.instagram, ['instagram.com'])) bad('instagram', 'URL https de instagram.com');
  if (!(typeof S.instagramHandle === 'string' && /^@[A-Za-z0-9._]{1,30}$/.test(S.instagramHandle))) bad('instagramHandle', 'formato @usuario');
  httpsOrNull('facebook', S.facebook, ['facebook.com']);
  if (!isHttpsUrl(S.mapsUrl, MAPS_HOSTS)) bad('mapsUrl', 'URL https de Google Maps');

  // Dominio e imagen social
  if (S.siteUrl !== null) {
    let okUrl = isHttpsUrl(S.siteUrl);
    if (okUrl) { try { okUrl = new URL(S.siteUrl).origin === S.siteUrl; } catch { okUrl = false; } }
    if (!okUrl) bad('siteUrl', 'null o https://dominio.tld sin barra final ni ruta');
  }
  if (S.ogImage !== null) {
    asset('ogImage', S.ogImage);
    if (isRelativeAssetPath(S.ogImage) && /\.svg$/i.test(S.ogImage)) bad('ogImage', 'usar jpg/png/webp (SVG no sirve para previews sociales)');
    if (S.siteUrl === null) warnings.push('ogImage: definido pero sin siteUrl no se emite og:image (requiere URL absoluta)');
  }

  // Horarios
  S.hoursStatus !== undefined && str('hoursStatus', S.hoursStatus);
  if (Array.isArray(S.hours) && S.hours.length) S.hours.forEach((h, i) => { if (!(Array.isArray(h) && h.length === 2 && str(`hours[${i}][0]`, h[0]) && str(`hours[${i}][1]`, h[1]))) bad(`hours[${i}]`, 'formato ["Día", "Horario"]'); });
  else bad('hours', 'array no vacío');

  // Estado abierto/cerrado: { sun..sat: [["HH:MM","HH:MM" | "24:00"], ...] }
  if (S.schedule !== undefined) {
    const t = v => typeof v === 'string' && /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/.test(v);
    if (!isObj(S.schedule)) bad('schedule', 'objeto');
    else ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].forEach(d => {
      const v = S.schedule[d];
      if (!Array.isArray(v)) return bad(`schedule.${d}`, 'array de [apertura, cierre]');
      v.forEach((x, i) => { if (!(Array.isArray(x) && x.length === 2 && t(x[0]) && t(x[1]) && x[0] < x[1])) bad(`schedule.${d}[${i}]`, 'formato ["HH:MM","HH:MM"] con apertura < cierre (usar "24:00" para medianoche)'); });
    });
  }

  // Categorías (sin duplicados)
  if (Array.isArray(S.categories) && S.categories.length) {
    const seen = new Set();
    S.categories.forEach((c, i) => { if (!str(`categories[${i}]`, c)) return; const k = c.trim().toLowerCase(); if (seen.has(k)) bad(`categories[${i}]`, 'duplicada: ' + c); seen.add(k); });
  } else bad('categories', 'array no vacío');

  // Carta
  if (isObj(S.menu)) {
    httpsOrNull('menu.url', S.menu.url);
    if (!Array.isArray(S.menu.items)) bad('menu.items', 'required array');
    else S.menu.items.forEach((it, i) => { if (!isObj(it)) return bad(`menu.items[${i}]`, 'objeto'); str(`menu.items[${i}].name`, it.name); if (it.price != null && !(typeof it.price === 'number' && it.price >= 0)) bad(`menu.items[${i}].price`, 'null o número >= 0'); });
  } else bad('menu', 'required object {url, items}');

  // Eventos
  if (Array.isArray(S.events)) S.events.forEach((e, i) => {
    if (!isObj(e)) return bad(`events[${i}]`, 'objeto');
    if (!isRealDate(e.date)) bad(`events[${i}].date`, 'fecha real YYYY-MM-DD');
    if (e.time !== undefined && !(typeof e.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(e.time))) bad(`events[${i}].time`, 'formato HH:MM');
    str(`events[${i}].artist`, e.artist);
    if (!EVENT_STATUS.includes(e.status)) bad(`events[${i}].status`, EVENT_STATUS.join(' | '));
    // Campos opcionales (DQ-033)
    ['title', 'type', 'price', 'reservation'].forEach(k => { if (e[k] !== undefined && !(typeof e[k] === 'string' && e[k].trim())) bad(`events[${i}].${k}`, 'string no vacío'); });
    if (e.endTime !== undefined && !(typeof e.endTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(e.endTime))) bad(`events[${i}].endTime`, 'formato HH:MM');
    if (e.url !== undefined) httpsOrNull(`events[${i}].url`, e.url);
  }); else bad('events', 'required array');

  // Imágenes (galería + hero)
  const image = (p, i, { altRequired }) => {
    if (!isObj(i)) return bad(p, 'objeto {src,w,h,alt,status}');
    asset(`${p}.src`, i.src);
    if (altRequired) str(`${p}.alt`, i.alt); else if (typeof i.alt !== 'string') bad(`${p}.alt`, 'string (puede ser "" si es decorativa)');
    ['w', 'h'].forEach(k => { if (!(Number.isInteger(i[k]) && i[k] > 0)) bad(`${p}.${k}`, 'positive integer'); });
    if (!IMAGE_STATUS.includes(i.status)) bad(`${p}.status`, IMAGE_STATUS.join(' | '));
    ['credit', 'caption', 'authorizedBy'].forEach(k => { if (i[k] !== undefined && typeof i[k] !== 'string') bad(`${p}.${k}`, 'string'); });
    if (i.authorizedAt !== undefined && !isRealDate(i.authorizedAt)) bad(`${p}.authorizedAt`, 'fecha real YYYY-MM-DD');
    if (i.status === 'authorized' && !i.authorizedBy) warnings.push(`${p}: authorized sin authorizedBy (registrar quién autorizó)`);
  };
  if (Array.isArray(S.gallery)) S.gallery.forEach((g, n) => image(`gallery[${n}]`, g, { altRequired: true })); else bad('gallery', 'required array');
  if (isObj(S.hero)) { if (S.hero.image !== null && S.hero.image !== undefined) image('hero.image', S.hero.image, { altRequired: false }); } else bad('hero', 'required object {image}');

  // "Antes de venir": solo se publica lo confirmado por el negocio
  if (S.practical !== undefined) {
    if (!Array.isArray(S.practical)) bad('practical', 'array');
    else S.practical.forEach((x, i) => {
      if (!isObj(x)) return bad(`practical[${i}]`, 'objeto {label, text, status, verifiedBy, updatedAt}');
      str(`practical[${i}].label`, x.label); str(`practical[${i}].text`, x.text);
      if (!VERIFY_STATUS.includes(x.status)) bad(`practical[${i}].status`, VERIFY_STATUS.join(' | '));
      if (x.status === 'confirmed-by-business') { if (!x.verifiedBy) bad(`practical[${i}].verifiedBy`, 'requerido si status es confirmed-by-business'); if (!isRealDate(x.updatedAt)) bad(`practical[${i}].updatedAt`, 'fecha real YYYY-MM-DD'); }
      else warnings.push(`practical[${i}] (${x.label}): no se publica hasta que status sea confirmed-by-business`);
    });
  }

  // Trazabilidad opcional por dato (DQ-031)
  if (S.verification !== undefined) {
    if (!isObj(S.verification)) bad('verification', 'objeto');
    else Object.entries(S.verification).forEach(([k, v]) => {
      if (!isObj(v)) return bad(`verification.${k}`, 'objeto {status, source, updatedAt, verifiedBy}');
      if (!VERIFY_STATUS.includes(v.status)) bad(`verification.${k}.status`, VERIFY_STATUS.join(' | '));
      if (v.updatedAt !== null && !isRealDate(v.updatedAt)) bad(`verification.${k}.updatedAt`, 'fecha real YYYY-MM-DD');
      if (v.status === 'confirmed-by-business' && !v.verifiedBy) bad(`verification.${k}.verifiedBy`, 'requerido si status es confirmed-by-business');
    });
  }

  return { errors, warnings };
}
