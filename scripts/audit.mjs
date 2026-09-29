// Auditoría en navegador real (Chromium): responsive, WCAG 2.2 AA con axe-core, contraste medido por píxeles y teclado.
// Opcional: NO forma parte del sitio ni de `npm run check`. Requiere: npm i -D playwright axe-core && npx playwright install chromium
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path'; import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
let chromium, axeSrc;
try { ({ chromium } = await import('playwright')); axeSrc = fs.readFileSync(req.resolve('axe-core/axe.min.js'), 'utf8'); }
catch { console.error('Faltan dependencias de auditoría:\n  npm i -D playwright axe-core && npx playwright install chromium'); process.exit(2); }

// Servidor estático mínimo (sin dependencias)
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.txt': 'text/plain', '.xml': 'application/xml' };
const server = http.createServer((q, s) => { const f = path.join(process.cwd(), decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/\/$/, '/index.html')); if (!f.startsWith(process.cwd()) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404).end(); return; } s.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
await new Promise(r => server.listen(0, '127.0.0.1', r)); const URL_ = `http://127.0.0.1:${server.address().port}/index.html`;

const fails = [], warns = [], info = [];
const browser = await chromium.launch();
const reveal = p => p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } scrollTo(0, 0); }).then(() => p.waitForTimeout(500));
const settle = p => p.evaluate(() => new Promise(res => { let last = -1, n = 0; const f = () => { n = scrollY === last ? n + 1 : 0; last = scrollY; n >= 4 ? res() : requestAnimationFrame(f); }; f(); }));
const newPage = async (w, h, o = {}) => { const c = await browser.newContext({ viewport: { width: w, height: h }, ...o }); const p = await c.newPage(); p.__errs = []; p.on('pageerror', e => p.__errs.push(e.message)); p.on('console', m => ['error', 'warning'].includes(m.type()) && p.__errs.push(m.text())); await p.goto(URL_); return p; };

// Contraste real: oculta texto/bordes/pseudo-elementos, captura el fondo SOLO bajo el rectángulo del texto y calcula el peor par contra su color
const measure = async (p, sel) => {
  const loc = p.locator(sel).first(); await loc.evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'instant' })); await p.waitForTimeout(150); // centrado: que el header/sticky fijos no se cuelen en la captura
  const meta = await loc.evaluate(e => { const s = getComputedStyle(e), r = document.createRange(); r.selectNodeContents(e); const t = r.getBoundingClientRect(), b = e.getBoundingClientRect(); return { color: s.color, size: parseFloat(s.fontSize), weight: parseInt(s.fontWeight), text: e.textContent.trim().slice(0, 28), tr: [Math.max(0, t.left - b.left), Math.max(0, t.top - b.top), t.width, t.height] }; });
  await p.evaluate(() => document.documentElement.classList.add('__m')); const png = await loc.screenshot(); await p.evaluate(() => document.documentElement.classList.remove('__m'));
  const worst = await p.evaluate(async ([b64, color, tr]) => {
    const L = ([r, g, b]) => { const f = c => (c /= 255) <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const [tx, ty, tw, th] = tr, d = x.getImageData(Math.floor(tx), Math.floor(ty), Math.max(1, Math.min(c.width - Math.floor(tx), Math.ceil(tw))), Math.max(1, Math.min(c.height - Math.floor(ty), Math.ceil(th)))).data, t = color.match(/[\d.]+/g).map(Number), lt = L(t); let w = 99;
    for (let i = 0; i < d.length; i += 4) { const lb = L([d[i], d[i + 1], d[i + 2]]), r = (Math.max(lt, lb) + .05) / (Math.min(lt, lb) + .05); if (r < w) w = r; } return w;
  }, [png.toString('base64'), meta.color, meta.tr]);
  return { ...meta, worst, need: (meta.size >= 24 || (meta.size >= 18.66 && meta.weight >= 700)) ? 3 : 4.5 };
};

// ---------- 1) Responsive + 2) axe + 3) contraste ----------
for (const [w, h] of [[320, 568], [375, 667], [390, 844], [768, 1024], [1024, 768], [1440, 900]]) {
  const p = await newPage(w, h, { hasTouch: w < 800 }); await reveal(p); const vp = `${w}x${h}`;
  await p.addStyleTag({ content: '.__m *,.__m *::before,.__m *::after{color:transparent!important;text-shadow:none!important;border-color:transparent!important;-webkit-text-fill-color:transparent!important}' });
  const r = await p.evaluate(() => { const de = document.documentElement, vis = e => { const s = getComputedStyle(e), b = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && b.width > 0 && b.height > 0 && !e.hidden; };
    return { h: de.scrollWidth > de.clientWidth + 1, targets: [...document.querySelectorAll('a,button')].filter(vis).map(e => { const b = e.getBoundingClientRect(); return { t: (e.textContent.trim() || e.getAttribute('aria-label') || '').slice(0, 24), w: Math.round(b.width), h: Math.round(b.height), inline: getComputedStyle(e).display === 'inline' && !e.classList.contains('skip') }; }).filter(x => !x.inline && (x.w < 44 || x.h < 44)) }; });
  if (r.h) fails.push(`[${vp}] scroll horizontal`);
  r.targets.filter(t => w < 800 || Math.min(t.w, t.h) < 24).forEach(t => (t.w < 24 || t.h < 24 ? fails : warns).push(`[${vp}] objetivo táctil ${t.w}x${t.h} "${t.t}" (WCAG 2.5.8 mín 24; recomendado 44)`));
  if (p.__errs.length) fails.push(`[${vp}] errores de consola: ${p.__errs.join(' | ').slice(0, 200)}`);
  await p.addScriptTag({ content: axeSrc });
  const ax = await p.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } }).then(x => ({ v: x.violations.map(v => `${v.id} (${v.impact}) ×${v.nodes.length}: ${v.nodes[0].target.join(' ')}`), inc: x.incomplete.filter(v => v.id === 'color-contrast').flatMap(v => v.nodes.map(n => n.target.join(' '))) })));
  ax.v.forEach(v => fails.push(`[${vp}] axe ${v}`));
  for (const sel of ax.inc) { const m = await measure(p, sel); if (m.worst < m.need) fails.push(`[${vp}] contraste ${m.worst.toFixed(2)}:1 < ${m.need} en "${m.text}" (${m.color}, ${m.size}px)`); }
  info.push(`[${vp}] axe: ${ax.v.length} violaciones; ${ax.inc.length} contrastes indeterminados medidos por píxeles`);
  if (w === 375) { await p.click('#burger'); await p.waitForTimeout(500); const m = await p.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2aa', 'wcag22aa'] } }).then(x => x.violations.map(v => v.id))); m.forEach(v => fails.push(`[375 menú abierto] axe ${v}`)); }
  await p.context().close();
}

// ---------- 4) Teclado ----------
for (const [w, h] of [[375, 667], [1440, 900]]) {
  const p = await newPage(w, h), vp = `${w}x${h}`; await p.waitForTimeout(300);
  const state = () => p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const s = getComputedStyle(e), r = e.getBoundingClientRect(), t = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1)); return { name: (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 30), outline: parseFloat(s.outlineWidth) > 0 && s.outlineStyle !== 'none', covered: !(t && (t === e || e.contains(t))) }; });
  let n = 0; for (; n < 60; n++) { await p.keyboard.press('Tab'); await settle(p); const d = await state(); if (!d) break; if (!d.outline) fails.push(`[${vp}] foco sin indicador visible: "${d.name}"`); if (d.covered) fails.push(`[${vp}] foco tapado por elemento fijo: "${d.name}"`); }
  info.push(`[${vp}] teclado: ${n} elementos focuseables, recorrido cíclico`);
  await p.goto(URL_); await p.keyboard.press('Tab'); const sk = await p.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return { txt: document.activeElement.textContent, vis: r.left >= 0 && r.top >= 0 }; });
  if (!sk.vis || !/contenido/i.test(sk.txt)) fails.push(`[${vp}] skip-link no es el primer foco o no se ve`);
  const anchors = await p.evaluate(async () => { const bad = []; for (const id of ['lugar', 'carta', 'pena', 'horarios', 'llegar']) { location.hash = '#' + id; await new Promise(r => setTimeout(r, 700)); if (document.querySelector(`#${id} h2`).getBoundingClientRect().top < document.querySelector('header').getBoundingClientRect().bottom - 1) bad.push(id); } return bad; });
  anchors.forEach(a => fails.push(`[${vp}] el header fijo tapa el título de #${a}`));
  if (w < 800) {
    await p.goto(URL_); for (let i = 0; i < 3; i++) await p.keyboard.press('Tab'); await p.keyboard.press('Enter');
    const o = await p.evaluate(() => document.getElementById('burger').getAttribute('aria-expanded') === 'true' && document.getElementById('nav').classList.contains('open')); if (!o) fails.push('menú: Enter no abre / aria-expanded no actualiza');
    await p.keyboard.press('Escape'); const c = await p.evaluate(() => !document.getElementById('nav').classList.contains('open') && document.activeElement.id === 'burger'); if (!c) fails.push('menú: Escape no cierra o no devuelve el foco al botón');
    await p.click('#burger'); await p.mouse.click(200, 500); if (await p.evaluate(() => document.getElementById('nav').classList.contains('open'))) fails.push('menú: click fuera no cierra');
  }
  await p.context().close();
}
await browser.close(); server.close();
info.forEach(i => console.log('· ' + i)); warns.forEach(x => console.log('AVISO: ' + x));
if (fails.length) { console.error('\nAUDITORÍA FALLA:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('\nauditoría OK (responsive, axe WCAG 2.2 AA, contraste por píxeles, teclado)');
