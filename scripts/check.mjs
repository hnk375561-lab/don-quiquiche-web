// Verificaciones estáticas sin dependencias. Sale con código 1 si algo falla.
import fs from 'node:fs';
import { loadSite, validateSite, isHttpsUrl, isTelNumber } from './lib.mjs';
import { render, markerErrors } from './render.mjs';
const r = f => fs.readFileSync(f, 'utf8'), html = r('index.html'), js = r('main.js'), err = [];
const no = (c, m) => c && err.push(m);
const S = loadSite();
const unesc = t => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const text = t => t.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// 0. Datos: mismo validador que el build
const v = validateSite(S); v.errors.forEach(e => err.push('data/site.js → ' + e));

// 0b. Markers BUILD y sincronía total: index.html debe ser exactamente lo que produce el build
markerErrors(html).forEach(e => err.push(e));
if (!v.errors.length) { try { no(render(html, S) !== html, 'index.html desincronizado de data/site.js (correr npm run build)'); } catch (e) { err.push('render: ' + e.message); } }
no(/<a\b[^>]*\sdata-(wa|map|ig|fb|tel|menu)\b/.test(html.replace(/<!--BUILD:STATIC_LINK\b[\s\S]*?<!--\/BUILD:STATIC_LINK-->/g, '')), 'enlace crítico (data-wa/map/ig/fb/tel/menu) fuera de un marker BUILD:STATIC_LINK: el build no lo mantiene');

// 0c. 404.html: sincronizada, no indexable, un H1, sin rutas relativas (funciona en cualquier URL)
{
  const nf = fs.existsSync('404.html') ? r('404.html') : null;
  if (nf === null) err.push('falta 404.html');
  else {
    markerErrors(nf).forEach(e => err.push('404.html → ' + e));
    if (!v.errors.length) { try { no(render(nf, S, { partial: true }) !== nf, '404.html desincronizada (correr npm run build)'); } catch (e) { err.push('404.html render: ' + e.message); } }
    no(!/<meta name="robots" content="noindex/.test(nf), '404.html sin meta robots noindex');
    no((nf.match(/<h1[\s>]/g) || []).length !== 1, '404.html: debe haber un único H1');
    [...nf.matchAll(/(?:src|href)="((?!https?:|tel:|mailto:|\/)[^"]+)"/g)].forEach(m => err.push('404.html: ruta relativa que se rompe en URLs anidadas: ' + m[1]));
    no(/<a\b[^>]*\sdata-(wa|tel|home)\b/.test(nf.replace(/<!--BUILD:STATIC_LINK\b[\s\S]*?<!--\/BUILD:STATIC_LINK-->/g, '')), '404.html: enlace crítico fuera de marker');
  }
}

// 1. Reglas previas
no(/innerHTML|outerHTML|insertAdjacentHTML/.test(js), 'main.js inyecta HTML');
no(/style="/.test(html), 'index.html tiene estilos inline');
no(/toISOString\(\)\.slice/.test(js), 'fecha UTC en main.js');
no(/id="rep"|reputation/.test(html + js + r('data/site.js')), 'restos de reputación');
no(/<dominio>|tu-dominio|example\.com|ejemplo\.test|lorem/i.test(html + r('robots.txt') + r('README.md')), 'placeholder de dominio/texto');
const idList = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]), ids = new Set(idList);
[...html.matchAll(/href="#([^"]+)"/g)].forEach(m => no(!ids.has(m[1]), 'ancla rota #' + m[1]));
[...html.matchAll(/(?:src|href)="((?!https?:|#|tel:|mailto:)[^"]+)"/g)].forEach(m => no(!fs.existsSync(m[1]), 'archivo inexistente: ' + m[1]));
no((html.match(/<h1[\s>]/g) || []).length !== 1, 'debe haber un único H1');
no(![...html.matchAll(/<a[^>]*data-(wa|map|ig|tel|menu)[^>]*>/g)].every(m => /href="[^"]+"/.test(m[0])), 'enlace crítico sin href estático');

// 1b. Recursos: srcset/CSS/fuentes existen; nada de terceros que no sean enlaces de salida; CSP y meta robots presentes
[...html.matchAll(/\ssrcset="([^"]+)"/g)].forEach(m => m[1].split(',').map(x => x.trim().split(/\s+/)[0]).forEach(u => no(!fs.existsSync(u), 'srcset apunta a archivo inexistente: ' + u)));
{
  const css = r('styles.css');
  [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].forEach(m => { no(/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(m[1]) && !m[1].startsWith('data:'), 'styles.css carga un recurso externo: ' + m[1]); no(!/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(m[1]) && !fs.existsSync(m[1]), 'styles.css: archivo inexistente ' + m[1]); });
  no(/@import/.test(css), 'styles.css usa @import (bloqueante)');
  const ext = [...(html.replace(/<a\b[^>]*>/g, '').replace(/<link rel="canonical"[^>]*>/g, '') + '<!-- -->').matchAll(/<(?:link|script|img|source|iframe)\b[^>]*\s(?:src|href|srcset)="(https?:)?\/\/[^"]+"/g)]; no(ext.length, 'index.html carga recursos de terceros (link/script/img): ' + ext.map(x => x[0].slice(0, 70)).join(' | '));
  const csp = (/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html) || [, ''])[1];
  no(!csp, 'falta la meta Content-Security-Policy'); no(csp && /unsafe-inline|unsafe-eval|\*/.test(csp.replace(/style-src[^;]*;?/, '')), 'CSP demasiado permisiva'); no(csp && !/default-src 'none'/.test(csp) || (csp && !/base-uri 'none'/.test(csp)), "CSP sin default-src 'none' / base-uri 'none'");
  no(!/<meta name="robots" content="[^"]*\bindex\b[^"]*"/.test(html) || /noindex/.test((/<meta name="robots" content="([^"]*)"/.exec(html) || [, ''])[1]), 'meta robots ausente o con noindex en index.html');
  no(/hidden/.test((/<nav id="nav"[\s\S]*?<\/nav>/.exec(html) || [''])[0]), 'enlace oculto (hidden) en el menú: depende de JS para verse');
  [...html.matchAll(/<link rel="preload"[^>]*href="([^"]+)"/g)].forEach(m => no(!fs.existsSync(m[1]), 'preload de archivo inexistente: ' + m[1]));
  const localFonts = [...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map(m => m[1]); no(!localFonts.length, 'styles.css no declara tipografías locales');
  no(!(html.match(/<img class="hero-img"[^>]*fetchpriority="high"/)) && S.hero.image && S.hero.image.status === 'authorized', 'hero: falta <img> estática con fetchpriority="high"');
  no(fs.existsSync('don-quiquiche-landing-v4.html'), 'quedó el prototipo huérfano don-quiquiche-landing-v4.html (duplicado indexable)');
}

// 2. Protocolos y rel de enlaces externos
[...html.matchAll(/\s(?:href|src)="([^"]*)"/g)].forEach(([, u]) => { if (/^[a-z][a-z0-9+.-]*:/i.test(u) && !/^(https:|tel:|mailto:)/i.test(u)) err.push('protocolo no permitido en HTML: ' + u.slice(0, 40)); });
[...html.matchAll(/<a\b[^>]*>/g)].forEach(([a]) => { if (/target="_blank"/.test(a)) { const rel = (/rel="([^"]*)"/.exec(a) || [, ''])[1]; no(!(rel.includes('noopener') && rel.includes('noreferrer')), 'target=_blank sin rel="noopener noreferrer": ' + a.slice(0, 60)); } });
no(/rel\s*=\s*'noopener'/.test(js), "main.js usa rel='noopener' sin noreferrer");

// 3. IDs, categorías, encabezados
const dupIds = idList.filter((x, i) => idList.indexOf(x) !== i); no(dupIds.length, 'IDs duplicados: ' + [...new Set(dupIds)].join(', '));
const cats = [...(/<ul class="cats" id="cats">([\s\S]*?)<\/ul>/.exec(html) || [, ''])[1].matchAll(/<li>([^<]*)<\/li>/g)].map(m => m[1].toLowerCase()); no(cats.length !== new Set(cats).size, 'categorías duplicadas en el HTML');
const heads = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g)].map(m => text(m[2]).toLowerCase()); no(heads.length !== new Set(heads).size, 'encabezados duplicados');

// 4. Imágenes y nombres accesibles
[...html.matchAll(/<img\b[^>]*>/g)].forEach(([i]) => no(!/\salt="/.test(i), 'img sin alt: ' + i.slice(0, 60)));
[...html.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/g)].forEach(([, tag, attrs, inner]) => {
  const label = (/aria-label="([^"]+)"/.exec(attrs) || [])[1], vis = text(inner);
  if (!label && !/aria-labelledby="[^"]+"/.test(attrs) && !vis) err.push(`<${tag}> sin nombre accesible: ${attrs.trim().slice(0, 60)}`);
  if (label && vis && !label.toLowerCase().includes(vis.toLowerCase())) err.push(`aria-label no contiene el texto visible ("${vis}" / "${label}")`);
});

// 5. SEO: sincronía con site.js, largos, JSON-LD, canonical
const title = unesc((/<title>([^<]*)<\/title>/.exec(html) || [, ''])[1]);
const meta = (attr, name) => unesc((new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`).exec(html) || [, ''])[1]);
no(title !== S.title, 'title no coincide con data/site.js (correr build)');
no(meta('name', 'description') !== S.description, 'meta description no coincide con data/site.js (correr build)');
no(meta('property', 'og:title') !== S.title || meta('name', 'twitter:title') !== S.title, 'og/twitter:title desincronizados (correr build)');
no(meta('property', 'og:description') !== S.socialDescription || meta('name', 'twitter:description') !== S.socialDescription, 'og/twitter:description desincronizados (correr build)');
no(meta('property', 'og:type') !== S.ogType || meta('property', 'og:locale') !== S.locale, 'og:type/og:locale desincronizados (correr build)');
no(title.length < 20 || title.length > 70, `title de ${title.length} caracteres (ideal 20–70)`);
no(S.description.length < 70 || S.description.length > 160, `meta description de ${S.description.length} caracteres (ideal 70–160)`);
const canon = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map(m => m[1]);
if (S.siteUrl) {
  no(canon.length !== 1 || canon[0] !== S.siteUrl + '/', 'canonical no coincide con siteUrl');
  no(meta('property', 'og:url') !== S.siteUrl + '/', 'og:url no coincide con siteUrl');
  no(!fs.existsSync('sitemap.xml') || !r('sitemap.xml').includes(`<loc>${S.siteUrl}/</loc>`), 'sitemap.xml ausente o desincronizado');
  no(!r('robots.txt').includes(`Sitemap: ${S.siteUrl}/sitemap.xml`), 'robots.txt sin Sitemap');
} else {
  no(canon.length > 0 || /property="og:url"/.test(html), 'canonical/og:url presentes sin siteUrl');
  no(fs.existsSync('sitemap.xml'), 'sitemap.xml presente sin siteUrl');
}
const ldm = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
if (!ldm) err.push('falta JSON-LD'); else {
  try {
    const ld = JSON.parse(ldm[1]);
    no(ld['@type'] !== 'Restaurant' || ld.name !== S.name || ld.telephone !== S.phone, 'JSON-LD desincronizado de site.js (correr build)');
    no(S.siteUrl ? ld.url !== S.siteUrl : 'url' in ld, 'JSON-LD url inconsistente con siteUrl');
    no(['aggregateRating', 'review', 'priceRange', 'openingHours', 'openingHoursSpecification', 'geo', 'menu'].some(k => k in ld), 'JSON-LD con datos no confirmados');
    // Estructura del JSON-LD (Schema.org Restaurant): campos obligatorios, URLs https, sin valores vacíos
    no(ld['@context'] !== 'https://schema.org', 'JSON-LD: @context debe ser https://schema.org');
    no(!isTelNumber(ld.telephone), 'JSON-LD: telephone inválido');
    const ad = ld.address || {}; ['streetAddress', 'addressLocality', 'addressRegion', 'addressCountry'].forEach(k => no(!(typeof ad[k] === 'string' && ad[k].trim()), 'JSON-LD: address.' + k + ' vacío')); no(ad['@type'] !== 'PostalAddress' || ad.addressCountry !== 'AR', 'JSON-LD: address debe ser PostalAddress con addressCountry "AR"');
    no(!Array.isArray(ld.sameAs) || !ld.sameAs.length || !ld.sameAs.every(u => isHttpsUrl(u)), 'JSON-LD: sameAs debe ser una lista de URLs https'); no(!isHttpsUrl(ld.hasMap), 'JSON-LD: hasMap debe ser URL https');
    ['url', 'image'].forEach(k => no(k in ld && !isHttpsUrl(ld[k]), `JSON-LD: ${k} debe ser URL https absoluta`)); no(S.ogImage && S.siteUrl ? ld.image !== `${S.siteUrl}/${S.ogImage}` : 'image' in ld, 'JSON-LD: image inconsistente con siteUrl/ogImage');
    const blank = (o, pth = 'ld') => Object.entries(o).forEach(([k, x]) => { if (x && typeof x === 'object') blank(x, pth + '.' + k); else no(x === '' || x == null, `JSON-LD: valor vacío en ${pth}.${k}`); }); blank(ld);
  } catch (e) { err.push('JSON-LD no es JSON válido: ' + e.message); }
}

if (err.length) { console.error('FALLA:\n- ' + err.join('\n- ')); process.exit(1); }
console.log('check OK' + (v.warnings.length ? ' (' + v.warnings.length + ' aviso/s: ' + v.warnings.join('; ') + ')' : ''));
