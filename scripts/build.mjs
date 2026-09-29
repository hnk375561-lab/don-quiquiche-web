// Sin dependencias. `node scripts/build.mjs` valida data/site.js y sincroniza index.html, sitemap.xml y robots.txt.
import fs from 'node:fs';
import { loadSite, validateSite } from './lib.mjs';
import { render, esc } from './render.mjs';

const S = loadSite();
const { errors, warnings } = validateSite(S);
warnings.forEach(w => console.warn('AVISO: ' + w));
if (errors.length) { console.error('ERRORES en data/site.js:\n- ' + errors.join('\n- ')); process.exit(1); }

fs.writeFileSync('index.html', render(fs.readFileSync('index.html', 'utf8'), S));
fs.writeFileSync('404.html', render(fs.readFileSync('404.html', 'utf8'), S, { partial: true }));

if (!S.siteUrl) { fs.writeFileSync('robots.txt', 'User-agent: *\nAllow: /\n'); fs.rmSync('sitemap.xml', { force: true }); }
else {
  fs.writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${esc(S.siteUrl)}/</loc></url></urlset>\n`);
  fs.writeFileSync('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${S.siteUrl}/sitemap.xml\n`);
}
console.log('OK: datos válidos; index.html sincronizado por markers' + (S.siteUrl ? '; sitemap/robots generados' : ' (sin siteUrl: sitemap pendiente)'));
