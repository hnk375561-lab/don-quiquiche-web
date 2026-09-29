// Pruebas de extremo a extremo en Chromium real (Playwright). Opcional: no forma parte del sitio ni de `npm run check`.
// Requiere: npm i -D playwright && npx playwright install chromium
// Cubre integración: CSP sin bypass, cero solicitudes a terceros, modo sin JS, file://, hero por orientación,
// menú móvil (incl. horizontal), enlaces críticos, control de animaciones, 404 real, LCP/CLS con CPU y red limitadas.
import fs from 'node:fs'; import http from 'node:http'; import path from 'node:path';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { console.error('Falta playwright: npm i -D playwright && npx playwright install chromium'); process.exit(2); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml' };
const root = process.cwd();
const server = http.createServer((q, s) => {
  let f = path.join(root, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (f.endsWith(path.sep)) f += 'index.html';
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404, { 'content-type': TYPES['.html'] }); return s.end(fs.readFileSync(path.join(root, '404.html'))); }
  s.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`, URL_ = ORIGIN + '/index.html';

const fails = [], info = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const browser = await chromium.launch();

// Instrumenta una página: errores de consola, violaciones CSP, solicitudes fallidas y a terceros, bytes por recurso
async function open(url, ctxOpts = {}, { js = true } = {}) {
  const ctx = await browser.newContext({ javaScriptEnabled: js, ...ctxOpts }), p = await ctx.newPage();
  p.__errs = []; p.__ext = []; p.__bad = []; p.__res = [];
  p.on('pageerror', e => p.__errs.push('pageerror: ' + e.message));
  p.on('console', m => ['error', 'warning'].includes(m.type()) && p.__errs.push(m.type() + ': ' + m.text()));
  p.on('request', r => { const u = new URL(r.url()); if (!/^(127\.0\.0\.1|localhost)$/.test(u.hostname) && u.protocol.startsWith('http')) p.__ext.push(r.url()); });
  p.on('requestfailed', r => p.__bad.push('falló: ' + r.url()));
  p.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) p.__bad.push(`HTTP ${r.status()}: ${r.url()}`); p.__res.push(r); });
  await p.addInitScript(() => {
    window.__csp = []; addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));
    window.__m = { cls: 0, lcp: null }; try {
      new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__m.cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(l => { const e = l.getEntries().at(-1); window.__m.lcp = { t: Math.round(e.startTime), tag: e.element && e.element.tagName, src: e.url || null }; }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch { }
  });
  await p.goto(url, { waitUntil: 'load' });
  return p;
}
const cleanup = p => p.context().close();

// ---------- 1) HTTP: sin errores, sin CSP violada, sin terceros, sin fallos ----------
for (const [w, h] of [[375, 667], [1440, 900]]) {
  const p = await open(URL_, { viewport: { width: w, height: h } }); await p.waitForTimeout(1500);
  const csp = await p.evaluate(() => window.__csp);
  ok(!p.__errs.length, `[${w}] consola: ${p.__errs.join(' | ').slice(0, 300)}`);
  ok(!csp.length, `[${w}] violaciones CSP: ${csp.join(' | ')}`);
  ok(!p.__ext.length, `[${w}] solicitudes a terceros: ${p.__ext.join(', ')}`);
  ok(!p.__bad.length, `[${w}] recursos fallidos: ${p.__bad.join(', ')}`);
  ok(await p.evaluate(() => document.fonts.check('700 20px "Playfair Display"') && document.fonts.check('400 16px Inter')), `[${w}] tipografías locales no cargaron`);
  info.push(`[${w}] HTTP: sin errores de consola, sin violaciones CSP, ${p.__res.length} respuestas, 0 solicitudes a terceros`);
  await cleanup(p);
}

// ---------- 2) Hero según orientación: cada una baja SOLO su imagen ----------
for (const [name, vp, want, notWant] of [['vertical', { width: 390, height: 844 }, 'hero-parrilla-m.webp', 'hero-parrilla.webp'], ['horizontal', { width: 1440, height: 900 }, 'hero-parrilla.webp', 'hero-parrilla-m.webp']]) {
  const p = await open(URL_, { viewport: vp }); await p.waitForTimeout(600);
  const urls = p.__res.map(r => r.url());
  ok(urls.some(u => u.endsWith(want)), `hero ${name}: no pidió ${want}`);
  ok(!urls.some(u => u.endsWith('/' + notWant)), `hero ${name}: pidió ${notWant} de más`);
  const cs = await p.evaluate(() => document.querySelector('.hero-img').currentSrc.split('/').pop());
  ok(cs === want, `hero ${name}: currentSrc=${cs}`);
  info.push(`hero ${name}: sirve ${cs}`);
  await cleanup(p);
}

// ---------- 3) Sin JavaScript: contenido y enlaces críticos siguen ahí ----------
{
  const p = await open(URL_, { viewport: { width: 390, height: 844 } }, { js: false });
  const r = await p.evaluate(() => { const vis = e => { const s = getComputedStyle(e), b = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && b.width > 0; };
    const gal = document.querySelector('#galeria'), navPhotos = document.querySelector('#nav a[href="#galeria"]');
    return { hero: !!document.querySelector('.hero-img') && document.querySelector('.hero-img').complete && document.querySelector('.hero-img').naturalWidth > 0,
      gallery: gal ? gal.querySelectorAll('figure img').length : 0, galleryImgsOk: gal ? [...gal.querySelectorAll('img')].every(i => i.getAttribute('loading') === 'lazy' && i.alt) : false,
      navPhotosTargetVisible: navPhotos ? !!gal && vis(gal) : true,
      wa: [...document.querySelectorAll('a[data-wa]')].map(a => a.href), tel: [...document.querySelectorAll('a[data-tel]')].map(a => a.href), map: [...document.querySelectorAll('a[data-map]')].map(a => a.href),
      hours: document.querySelectorAll('[data-hours] dt').length, h1: document.querySelectorAll('h1').length, revealHidden: [...document.querySelectorAll('.rv')].filter(e => getComputedStyle(e).opacity === '0').length };
  });
  ok(r.hero, 'sin JS: el hero no se ve (imagen ausente o no cargó)'); ok(r.gallery === 5, `sin JS: galería con ${r.gallery} fotos (esperadas 5)`); ok(r.navPhotosTargetVisible, 'sin JS: el enlace "Fotos" apunta a una sección oculta');
  ok(r.wa.length >= 4 && r.wa.every(h => /^https:\/\/wa\.me\/5493442581870\?text=.+/.test(h)), 'sin JS: enlaces de WhatsApp inválidos'); ok(r.tel.every(h => h === 'tel:+543442581870'), 'sin JS: enlace tel inválido'); ok(r.map.length >= 2 && r.map.every(h => h.startsWith('https://www.google.com/maps/')), 'sin JS: enlaces de mapa inválidos');
  ok(r.hours >= 6, 'sin JS: horarios ausentes'); ok(r.h1 === 1, 'sin JS: H1'); ok(r.revealHidden === 0, 'sin JS: hay bloques invisibles (opacity 0)');
  info.push(`sin JS: hero, ${r.gallery} fotos, ${r.wa.length} enlaces WhatsApp, horarios y mapa presentes`);
  await cleanup(p);
}

// ---------- 4) file://: abrir index.html haciendo doble clic también funciona (README) ----------
{
  const p = await open('file://' + path.join(root, 'index.html'), { viewport: { width: 390, height: 844 } }); await p.waitForTimeout(800);
  const csp = await p.evaluate(() => window.__csp);
  ok(!csp.length, 'file://: violaciones CSP: ' + csp.join(' | ')); // En file:// solo la PRECARGA de fuentes avisa por CORS (origen null); las fuentes cargan igual por @font-face. En http(s) no ocurre (ver punto 1).
  const real = p.__errs.filter(e => !/font|preload|ERR_FAILED/i.test(e)); ok(!real.length, 'file://: consola: ' + real.join(' | ').slice(0, 200)); ok(await p.evaluate(async () => { await document.fonts.ready; return [...document.fonts].every(f => f.status === 'loaded'); }), 'file://: las tipografías no cargaron');
  ok(await p.evaluate(() => document.querySelector('.hero-img').naturalWidth > 0 && !document.querySelector('#open-status').hidden), 'file://: hero o estado "abierto" no funcionan');
  info.push('file://: carga sin errores ni violaciones CSP'); await cleanup(p);
}

// ---------- 5) Enlaces: formato, rel, anclas ----------
{
  const p = await open(URL_, { viewport: { width: 1280, height: 800 } });
  const r = await p.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => ({ h: a.getAttribute('href'), t: a.target, rel: a.rel, ext: a.origin !== location.origin && !a.href.startsWith('tel:') })));
  r.filter(a => a.ext).forEach(a => { ok(a.h.startsWith('https://'), 'enlace externo no https: ' + a.h); ok(a.t === '_blank' && /noopener/.test(a.rel) && /noreferrer/.test(a.rel), 'target=_blank sin rel completo: ' + a.h); });
  const ids = new Set(await p.evaluate(() => [...document.querySelectorAll('[id]')].map(e => e.id))); r.filter(a => a.h.startsWith('#') && a.h.length > 1).forEach(a => ok(ids.has(a.h.slice(1)), 'ancla rota ' + a.h));
  // Vuelta atrás tras navegar por ancla
  await p.click('#nav a[href="#horarios"]'); await p.waitForTimeout(2200); const y1 = await p.evaluate(() => scrollY); await p.goBack(); await p.waitForTimeout(2200); // el scroll suave tarda ~1-2 s
  ok(y1 > 500 && (await p.evaluate(() => scrollY)) < y1, 'navegación hacia atrás tras ancla no restaura la posición');
  await p.reload(); await p.waitForTimeout(500); ok(!p.__errs.length, 'recarga con errores: ' + p.__errs.join(' | ').slice(0, 200));
  info.push(`${r.length} enlaces revisados (formato https, rel, anclas), atrás/recarga OK`); await cleanup(p);
}

// ---------- 6) Menú móvil: vertical y horizontal, doble pulsación, Escape, cambio a escritorio ----------
for (const [w, h] of [[375, 667], [667, 375], [320, 568]]) {
  const p = await open(URL_, { viewport: { width: w, height: h }, hasTouch: true, isMobile: true }); await p.waitForTimeout(300);
  const ex = () => p.getAttribute('#burger', 'aria-expanded');
  await p.tap('#burger'); ok((await ex()) === 'true', `[${w}x${h}] el menú no abre`);
  const m = await p.evaluate(() => { const n = document.querySelector('#nav'), b = n.getBoundingClientRect(); return { fits: b.bottom <= innerHeight + 1, scrollable: n.scrollHeight > n.clientHeight, label: document.querySelector('#burger').getAttribute('aria-label') }; });
  ok(await p.evaluate(() => { const a = document.querySelector('#nav a:not(.btn)'), s = getComputedStyle(a); return s.color !== 'rgb(34, 197, 94)' && parseFloat(s.fontSize) >= 15; }), `[${w}x${h}] los enlaces del menú heredan el estilo del estado "abierto" (verde/pequeño)`);
  ok(m.fits, `[${w}x${h}] el menú se sale de la pantalla (no se alcanzan sus enlaces)`); ok(m.label === 'Menú', `[${w}x${h}] aria-label del botón cambia: ${m.label}`);
  await p.evaluate(() => { const n = document.querySelector('#nav'); n.scrollTop = n.scrollHeight; }); // último ítem alcanzable
  const lastVisible = await p.evaluate(() => { const b = document.querySelector('#nav .btn'), l = b.getBoundingClientRect(), top = document.elementFromPoint(l.left + l.width / 2, l.top + l.height / 2); return l.bottom <= innerHeight + 1 && l.top >= 0 && !!top && b.contains(top); }); // y no queda tapado por la barra fija inferior ok(lastVisible, `[${w}x${h}] el botón "Reservar" del menú no es alcanzable`);
  await p.tap('#burger'); ok((await ex()) === 'false', `[${w}x${h}] segunda pulsación no cierra`);
  await p.tap('#burger'); await p.keyboard.press('Escape'); ok((await ex()) === 'false', `[${w}x${h}] Escape no cierra`); ok(await p.evaluate(() => document.activeElement.id === 'burger'), `[${w}x${h}] Escape no devuelve el foco`);
  ok(!(await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)), `[${w}x${h}] scroll horizontal`);
  ok(!p.__errs.length, `[${w}x${h}] consola: ${p.__errs.join(' | ').slice(0, 200)}`); await cleanup(p);
}
{ // abrir en móvil y ensanchar a escritorio: sin estado "abierto" colgado
  const p = await open(URL_, { viewport: { width: 400, height: 700 } }); await p.click('#burger'); await p.setViewportSize({ width: 1200, height: 800 }); await p.waitForTimeout(200);
  await p.setViewportSize({ width: 400, height: 700 }); await p.waitForTimeout(200);
  ok(!(await p.evaluate(() => document.querySelector('#nav').classList.contains('open'))), 'menú queda abierto tras pasar por escritorio y volver'); await cleanup(p);
}

// ---------- 7) Animaciones: control del usuario, pausa fuera de pantalla, reduce-motion ----------
{
  const p = await open(URL_, { viewport: { width: 1280, height: 800 } });
  const anim = () => p.evaluate(() => getComputedStyle(document.querySelector('.embers i')).animationName);
  ok((await anim()) === 'rise', 'las brasas no animan por defecto'); ok(await p.isVisible('#motion'), 'falta el control "Pausar animaciones"');
  await p.click('#motion'); ok((await anim()) === 'none' && (await p.getAttribute('#motion', 'aria-pressed')) === 'true', 'el control no detiene el movimiento');
  await p.click('#motion'); ok((await anim()) === 'rise', 'el control no reanuda');
  await p.evaluate(() => scrollTo(0, document.querySelector('#horarios').offsetTop)); await p.waitForTimeout(400);
  ok(await p.evaluate(() => document.querySelector('.hero').classList.contains('off') && getComputedStyle(document.querySelector('.embers i')).animationPlayState === 'paused'), 'las animaciones del hero no se pausan fuera de pantalla');
  await cleanup(p);
  const q = await open(URL_, { viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  ok((await q.evaluate(() => getComputedStyle(document.querySelector('.embers i')).animationName)) === 'none', 'reduce-motion: hay animación'); ok(!(await q.isVisible('#motion')), 'reduce-motion: se muestra el control innecesariamente'); await cleanup(q);
  info.push('animaciones: control del usuario, pausa fuera de pantalla y prefers-reduced-motion OK');
}

// ---------- 8) Estado "Abierto ahora" con relojes simulados (hora de Argentina, cruce de medianoche) ----------
for (const [iso, want] of [['2026-09-30T15:00:00Z', /Abierto ahora/], ['2026-09-30T18:00:00Z', /Cerrado ahora · abre hoy a las 20:00/], ['2026-10-04T05:00:00Z', /Abierto ahora/], ['2026-10-04T08:00:00Z', /Cerrado ahora/]]) {
  const ctx = await browser.newContext(), p = await ctx.newPage(); await p.clock.install({ time: new Date(iso) }); await p.goto(URL_); await p.waitForTimeout(200);
  const t = await p.textContent('#open-text'); ok(want.test(t), `estado a ${iso}: "${t}" no coincide con ${want}`); await ctx.close();
}
info.push('estado abierto/cerrado: 4 instantes simulados OK (incluye sábado 02:00 → sigue abierto)');

// ---------- 8b) Fallback real: si data/site.js no carga (red lenta, bloqueo), el HTML estático sigue siendo usable ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }), p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); await ctx.route('**/data/site.js', r => r.abort());
  await p.goto(URL_); await p.waitForTimeout(600);
  await p.tap('#burger'); ok((await p.getAttribute('#burger', 'aria-expanded')) === 'true', 'sin site.js: el menú no abre');
  const r = await p.evaluate(() => ({ wa: [...document.querySelectorAll('a[data-wa]')].every(a => /^https:\/\/wa\.me\/5493442581870\?text=/.test(a.href)), hero: document.querySelector('.hero-img').naturalWidth > 0, hours: document.querySelectorAll('[data-hours] dt').length >= 6 }));
  ok(r.wa && r.hero && r.hours, 'sin site.js: faltan enlaces/hero/horarios estáticos'); ok(!errs.length, 'sin site.js: excepciones no controladas: ' + errs.join(' | ').slice(0, 200));
  info.push('sin data/site.js: menú, WhatsApp, hero y horarios funcionan; sin excepciones no controladas'); await ctx.close();
}

// ---------- 9) 404 real ----------
{
  const p = await open(ORIGIN + '/no/existe/nada', { viewport: { width: 390, height: 844 } }); await p.waitForTimeout(300);
  const r = await p.evaluate(() => ({ noindex: !!document.querySelector('meta[name=robots][content*=noindex]'), h1: document.querySelectorAll('h1').length, links: [...document.querySelectorAll('a')].map(a => a.href) }));
  ok(r.noindex && r.h1 === 1 && r.links.length === 3, '404: noindex/H1/enlaces'); ok(!(await p.evaluate(() => window.__csp.length)), '404: violaciones CSP'); ok(!p.__errs.filter(e => !/404/.test(e)).length, '404: consola ' + p.__errs.join('|'));
  info.push('404 servida en ruta inexistente: noindex, 1 H1, 3 enlaces, sin violaciones CSP'); await cleanup(p);
}

// ---------- 10) Métricas con CPU x4 y red ~1,6 Mbps / 150 ms (móvil de gama media, "Fast 3G"). Son mediciones locales, NO Lighthouse ----------
for (const [n, vp] of [['móvil vertical 390x844', { width: 390, height: 844, deviceScaleFactor: 2 }], ['escritorio 1440x900', { width: 1440, height: 900 }]]) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 800, isMobile: vp.width < 800 }), p = await ctx.newPage(), cdp = await ctx.newCDPSession(p);
  await p.addInitScript(() => { window.__m = { cls: 0, lcp: null }; new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__m.cls += e.value; })).observe({ type: 'layout-shift', buffered: true }); new PerformanceObserver(l => { const e = l.getEntries().at(-1); window.__m.lcp = { t: Math.round(e.startTime), tag: e.element && e.element.tagName, src: (e.url || '').split('/').pop() }; }).observe({ type: 'largest-contentful-paint', buffered: true }); });
  await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 }); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  let bytes = 0; cdp.on('Network.loadingFinished', e => bytes += e.encodedDataLength);
  await p.goto(URL_, { waitUntil: 'load' }); await p.waitForTimeout(2500);
  const m = await p.evaluate(() => window.__m); ok(m.cls <= 0.1, `${n}: CLS ${m.cls.toFixed(3)} > 0.1`); ok(m.lcp && m.lcp.t <= 4000, `${n}: LCP ${m.lcp && m.lcp.t} ms > 4000 con red/CPU limitadas`);
  info.push(`métricas (CPU x4, 1,6 Mbps/150 ms) ${n}: LCP ${m.lcp.t} ms (${m.lcp.tag} ${m.lcp.src || ''}), CLS ${m.cls.toFixed(3)}, ${(bytes / 1024).toFixed(0)} KB transferidos hasta la carga (imágenes lazy no incluidas)`);
  await ctx.close();
}

await browser.close(); server.close();
info.forEach(i => console.log('·', i));
if (fails.length) { console.error('\nE2E FALLA:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('\ne2e OK');
