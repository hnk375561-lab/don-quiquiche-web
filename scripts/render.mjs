// Render puro: (index.html, S) -> index.html sincronizado. Solo toca lo que está entre markers <!--BUILD:X--> ... <!--/BUILD:X-->.
// Lo usan build.mjs (escribe) y check.mjs (verifica que index.html ya está sincronizado).
export const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
export const REL = 'noopener noreferrer';
export const MARKERS = ['SEO', 'LD', 'STATIC_LINK', 'STATIC_HOURS', 'STATIC_ADDRESS', 'STATIC_CATEGORIES', 'STATIC_YEAR', 'STATIC_PRACTICAL', 'STATIC_PRACTICAL_NAV', 'STATIC_HERO', 'STATIC_GALLERY', 'STATIC_GALLERY_NAV'];

/** Reemplaza el contenido de cada par de markers `name`. fn(params) recibe los atributos key="value" del marker de apertura. */
function fillAll(html, name, fn, { required = true } = {}) {
  const re = new RegExp(`<!--BUILD:${name}((?:\\s+[\\w-]+="[^"]*")*)\\s*-->[\\s\\S]*?<!--/BUILD:${name}-->`, 'g');
  let n = 0;
  const out = html.replace(re, (m, attrs) => {
    n++;
    const params = Object.fromEntries([...attrs.matchAll(/([\w-]+)="([^"]*)"/g)].map(x => [x[1], x[2]]));
    return `<!--BUILD:${name}${attrs}-->${fn(params)}<!--/BUILD:${name}-->`;
  });
  if (required && !n) throw new Error(`Falta el marker <!--BUILD:${name}--> ... <!--/BUILD:${name}--> en index.html`);
  return out;
}

export function render(html, S, { year = new Date().getFullYear(), partial = false } = {}) {
  // partial: páginas auxiliares (404) que solo llevan algunos markers
  const fill = (h, name, fn) => fillAll(h, name, fn, { required: !partial });
  const [street, city, region] = S.address.split(',').map(x => x.trim());
  const wa = k => `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(S.waMessages[k] || S.waMessages.general)}`;

  // --- SEO (title, description, og:*, twitter:*, canonical) ---
  const hasImg = !!(S.siteUrl && S.ogImage), img = hasImg ? `${S.siteUrl}/${S.ogImage}` : null;
  const seo = [
    `<title>${esc(S.title)}</title>`,
    `<meta name="description" content="${esc(S.description)}">`,
    `<meta property="og:type" content="${esc(S.ogType)}"><meta property="og:locale" content="${esc(S.locale)}">`,
    `<meta property="og:title" content="${esc(S.title)}">`,
    `<meta property="og:description" content="${esc(S.socialDescription)}">`,
    `<meta name="twitter:card" content="${hasImg ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${esc(S.title)}">`,
    `<meta name="twitter:description" content="${esc(S.socialDescription)}">`,
    ...(S.siteUrl ? [`<link rel="canonical" href="${esc(S.siteUrl)}/">`, `<meta property="og:url" content="${esc(S.siteUrl)}/">`] : ['<!-- PENDIENTE: definir siteUrl en data/site.js y correr node scripts/build.mjs -->']),
    ...(hasImg ? [`<meta property="og:image" content="${esc(img)}">`, '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">', `<meta property="og:image:alt" content="${esc(S.name)}">`, `<meta name="twitter:image" content="${esc(img)}">`] : [])
  ].filter(Boolean).join('\n');

  // --- JSON-LD (sin horarios/rating/precios: no confirmados) ---
  const ld = { '@context': 'https://schema.org', '@type': 'Restaurant', name: S.name, alternateName: S.fullName, telephone: S.phone,
    address: { '@type': 'PostalAddress', streetAddress: street, addressLocality: city, addressRegion: region, addressCountry: 'AR' },
    sameAs: [S.instagram, S.facebook].filter(Boolean), hasMap: S.mapsUrl };
  if (S.siteUrl) ld.url = S.siteUrl;
  if (hasImg) ld.image = img;

  // --- Enlaces críticos: el <a> completo se genera desde los params del marker ---
  const link = p => {
    const kind = p.kind, val = p.val || 'general';
    const url = { home: () => S.siteUrl ? S.siteUrl + '/' : '/', wa: () => wa(val), map: () => S.mapsUrl, ig: () => S.instagram, fb: () => S.facebook, tel: () => 'tel:' + S.phone, menu: () => S.menu.url || wa('carta') }[kind];
    if (!url) throw new Error(`STATIC_LINK: kind inválido "${kind}"`);
    const href = url(); if (!href) return ''; // p.ej. facebook = null: el enlace (y su <li>) desaparece
    const noMenu = kind === 'menu' && !S.menu.url;
    const text = kind === 'menu' ? (noMenu ? p.alt : p.label) : kind === 'tel' ? (p.label || S.phoneLabel) : p.label;
    if (!text) throw new Error(`STATIC_LINK kind="${kind}": falta label${kind === 'menu' ? '/alt' : ''}`);
    const attrs = [p.class && `class="${esc(p.class)}"`, kind === 'wa' ? `data-wa="${esc(val)}"` : `data-${kind}`, kind === 'menu' && `data-label="${esc(p.label)}"`, kind === 'menu' && `data-alt="${esc(p.alt)}"`,
      noMenu && 'aria-label="Consultar la carta por WhatsApp"', `href="${esc(href)}"`, !['tel', 'home'].includes(kind) && `target="_blank" rel="${REL}"`].filter(Boolean).join(' ');
    const a = `<a ${attrs}>${esc(text)}</a>`;
    return p.wrap === 'li' ? `<li>${a}</li>` : a;
  };

  // --- "Antes de venir": SOLO datos confirmados por el negocio (status confirmed-by-business). Sin datos confirmados, no hay sección ---
  const prac = (S.practical || []).filter(x => x && x.status === 'confirmed-by-business');
  const practicalSection = prac.length ? `<section id="antes"><div class="wrap split"><div class="rv"><p class="eyebrow">Antes de venir</p><h2>Datos útiles</h2></div><dl class="h rv">${prac.map(x => `<div><dt>${esc(x.label)}</dt><dd>${esc(x.text)}</dd></div>`).join('')}</dl></div></section>` : '';

  // --- Hero y galería: HTML estático (funciona sin JS y el navegador descubre la imagen del LCP sin esperar scripts). Solo material autorizado ---
  const ok = i => i && i.status === 'authorized';
  const hi = S.hero.image;
  const heroHtml = ok(hi)
    ? `<picture class="hero-pic">${hi.portrait ? `<source media="(orientation: portrait)" srcset="${esc(hi.portrait.src)}" width="${hi.portrait.w}" height="${hi.portrait.h}" type="image/webp">` : ''}<img class="hero-img" src="${esc(hi.src)}" width="${hi.w}" height="${hi.h}" alt="${esc(hi.alt || '')}" fetchpriority="high" decoding="async"></picture><div class="veil"></div>`
    : '';
  const gal = (S.gallery || []).filter(ok);
  const galleryHtml = gal.length
    ? `<section class="archivo" id="galeria"><div class="archivo-head"><h2>Lo que queda<br>en la memoria.</h2><p>Una selección de momentos reales del local y de la mesa.</p></div><div id="gallery">${gal.map((i, idx) => { const cls = 'g' + (idx + 1); const cap = [i.caption, i.credit].filter(Boolean).join(' · '); return `<figure class="${cls}"><img src="${esc(i.src)}" width="${i.w}" height="${i.h}" alt="${esc(i.alt)}" loading="lazy" decoding="async">${cap ? `<figcaption>${esc(cap)}</figcaption>` : ''}</figure>`; }).join('')}</div></section>`
    : '';

  let h = html;
  h = fill(h, 'SEO', () => `\n${seo}\n`);
  h = fill(h, 'LD', () => `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`);
  h = fill(h, 'STATIC_LINK', link);
  h = fill(h, 'STATIC_HOURS', () => S.hours.map(([d, x]) => `<div><dt>${esc(d)}</dt><dd>${esc(x)}</dd></div>`).join(''));
  h = fill(h, 'STATIC_ADDRESS', () => esc(S.address));
  h = fill(h, 'STATIC_CATEGORIES', () => S.categories.map(c => `<li>${esc(c)}</li>`).join(''));
  h = fill(h, 'STATIC_YEAR', () => String(year));
  h = fill(h, 'STATIC_PRACTICAL', () => practicalSection);
  h = fill(h, 'STATIC_HERO', () => heroHtml);
  h = fill(h, 'STATIC_GALLERY', () => galleryHtml);
  h = fill(h, 'STATIC_GALLERY_NAV', () => gal.length ? '<a href="#galeria">Fotos</a>' : '');
  h = fill(h, 'STATIC_PRACTICAL_NAV', () => prac.length ? '<a href="#antes">Antes de venir</a>' : '');
  return h.replace(/<html lang="[^"]*">/, `<html lang="${S.locale.replace('_', '-')}">`);
}

/** Estructura de markers: cada apertura con su cierre, sin nombres desconocidos. Devuelve lista de errores. */
export function markerErrors(html) {
  const errs = [];
  for (const name of new Set([...html.matchAll(/<!--\/?BUILD:(\w+)/g)].map(m => m[1]))) {
    if (!MARKERS.includes(name)) errs.push(`marker desconocido BUILD:${name}`);
    const o = (html.match(new RegExp(`<!--BUILD:${name}[\\s-]`, 'g')) || []).length, c = (html.match(new RegExp(`<!--/BUILD:${name}-->`, 'g')) || []).length;
    if (o !== c) errs.push(`markers BUILD:${name} desbalanceados (${o} aperturas / ${c} cierres)`);
  }
  return errs;
}
