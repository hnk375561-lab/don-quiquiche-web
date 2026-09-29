// Sin dependencias. `node scripts/build.mjs` valida data/site.js y sincroniza index.html, sitemap.xml y robots.txt.
import fs from 'node:fs'; import vm from 'node:vm';
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync('data/site.js', 'utf8'), ctx); const S = ctx.window.SITE;
const err = []; const ok = (c, m) => c || err.push(m);
ok(/^\+\d{10,15}$/.test(S.phone), 'phone inválido'); ok(/^\d{11,15}$/.test(S.whatsapp), 'whatsapp inválido (solo dígitos, ej. 549…)');
[S.instagram, S.mapsUrl, S.facebook, S.menu.url].filter(Boolean).forEach(u => { try { new URL(u); } catch { err.push('URL inválida ' + u); } });
if (S.siteUrl) ok(/^https:\/\/[^/]+$/.test(S.siteUrl), 'siteUrl debe ser https://dominio sin barra final');
S.hours.forEach(h => ok(Array.isArray(h) && h.length === 2, 'hours mal formado'));
S.events.forEach(e => { ok(/^\d{4}-\d{2}-\d{2}$/.test(e.date) && !isNaN(Date.parse(e.date)), 'evento con fecha inválida'); ok(['confirmed', 'historical', 'pending'].includes(e.status), 'status de evento inválido'); });
[...S.gallery, ...(S.hero.image ? [S.hero.image] : [])].forEach(i => { ok(['authorized', 'pending'].includes(i.status), 'status de imagen inválido'); ok(i.alt !== undefined && i.w && i.h, 'imagen sin alt/w/h: ' + i.src); ok(fs.existsSync(i.src), 'imagen inexistente: ' + i.src); });
if (S.ogImage) ok(fs.existsSync(S.ogImage), 'ogImage inexistente');
if (err.length) { console.error('ERRORES:\n- ' + err.join('\n- ')); process.exit(1); }
// JSON-LD generado desde la misma fuente (sin horarios/rating/precios: no confirmados)
const [street, city, region] = S.address.split(',').map(x => x.trim());
const ld = { '@context': 'https://schema.org', '@type': 'Restaurant', name: S.name, alternateName: S.fullName, telephone: S.phone,
  address: { '@type': 'PostalAddress', streetAddress: street, addressLocality: city, addressRegion: region, addressCountry: 'AR' },
  sameAs: [S.instagram, S.facebook].filter(Boolean), hasMap: S.mapsUrl };
if (S.siteUrl) ld.url = S.siteUrl; if (S.siteUrl && S.ogImage) ld.image = `${S.siteUrl}/${S.ogImage}`;
const seo = S.siteUrl ? [`<link rel="canonical" href="${S.siteUrl}/">`, `<meta property="og:url" content="${S.siteUrl}/">`,
  ...(S.ogImage ? [`<meta property="og:image" content="${S.siteUrl}/${S.ogImage}">`, '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">', `<meta property="og:image:alt" content="${S.name}">`, `<meta name="twitter:image" content="${S.siteUrl}/${S.ogImage}">`] : [])].join('\n')
  : '<!-- PENDIENTE: definir siteUrl en data/site.js y correr node scripts/build.mjs -->';
let h = fs.readFileSync('index.html', 'utf8');
h = h.replace(/<!--LD-->[\s\S]*?<!--\/LD-->/, `<!--LD--><script type="application/ld+json">${JSON.stringify(ld)}</script><!--/LD-->`)
     .replace(/<!--SEO-->[\s\S]*?<!--\/SEO-->/, `<!--SEO-->\n${seo}\n<!--/SEO-->`)
     .replace(/<meta name="twitter:card" content="[^"]*">/, `<meta name="twitter:card" content="${S.siteUrl && S.ogImage ? 'summary_large_image' : 'summary'}">`);

// --- HTML estático (funciona sin JS): hrefs, horarios, dirección, categorías, año
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const wa = k => `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(S.waMessages[k] || S.waMessages.general)}`;
const hrefFor = (kind, val) => ({ wa: wa(val || 'general'), map: S.mapsUrl, ig: S.instagram, fb: S.facebook, tel: 'tel:' + S.phone, menu: S.menu.url || wa('carta') })[kind];
h = h.replace(/<a([^>]*?)\sdata-(wa|map|ig|fb|tel|menu)(?:="([^"]*)")?([^>]*)>/g, (m, pre, kind, val, post) => {
  const url = hrefFor(kind, val); if (!url) return m;
  const strip = x => x.replace(/\s(?:href|target|rel)="[^"]*"/g, '');
  const ext = kind === 'tel' ? '' : ' target="_blank" rel="noopener"';
  return `<a${strip(pre)} data-${kind}${val !== undefined ? `="${val}"` : ''}${strip(post)} href="${esc(url)}"${ext}>`;
});
h = h.replace(/(<a[^>]*data-tel[^>]*>)(\s*)(<\/a>)/g, `$1${S.phoneLabel}$3`);
const rows = S.hours.map(([d, x]) => `<div><dt>${esc(d)}</dt><dd>${esc(x)}</dd></div>`).join('');
h = h.replace(/(<dl[^>]*data-hours[^>]*>)[\s\S]*?(<\/dl>)/g, `$1${rows}$2`);
h = h.replace(/(<(\w+)[^>]*data-address[^>]*>)[^<]*(<\/\2>)/g, `$1${esc(S.address)}$3`);
h = h.replace(/(<ul class="cats" id="cats">)[\s\S]*?(<\/ul>)/, `$1${S.categories.map(c => `<li>${esc(c)}</li>`).join('')}$2`);
h = h.replace(/(<span id="year">)[^<]*(<\/span>)/, `$1${new Date().getFullYear()}$2`);
fs.writeFileSync('index.html', h);
if (S.siteUrl) { fs.writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${S.siteUrl}/</loc></url></urlset>\n`); fs.writeFileSync('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${S.siteUrl}/sitemap.xml\n`); }
console.log('OK: datos válidos; JSON-LD y SEO sincronizados' + (S.siteUrl ? '; sitemap/robots generados' : ' (sin siteUrl: sitemap pendiente)'));
