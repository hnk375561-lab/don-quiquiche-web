/* Enlaces desde data/site.js, menú, estado "abierto ahora", galería ampliada y control de movimiento. Sin dependencias. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)], S = window.SITE;
  const wa = k => `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(S.waMessages[k] || S.waMessages.general)}`;
  if (S) {
  const setUrl = (a, u) => { try { const x = new URL(u); if (x.protocol === 'tel:') { a.href = x.href; return; } if (x.protocol !== 'https:') return; a.href = x.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; } catch {} };
  $$('[data-wa]').forEach(a => setUrl(a, wa(a.dataset.wa)));
  $$('[data-map]').forEach(a => setUrl(a, S.mapsUrl));
  $$('[data-ig]').forEach(a => setUrl(a, S.instagram));
  $$('[data-tel]').forEach(a => setUrl(a, 'tel:' + S.phone));
  $$('[data-menu]').forEach(a => { if (S.menu.url) { setUrl(a, S.menu.url); a.textContent = a.dataset.label || 'Ver la carta'; } else { setUrl(a, wa('carta')); a.textContent = a.dataset.alt || 'Consultar la carta por WhatsApp'; } });

  }

  /* Header y menú móvil */
  const header = $('#site-header'), burger = $('#burger'), nav = $('#nav');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY, dy = y - lastY; header.classList.toggle('scrolled', y > 40);
    if (Math.abs(dy) > 6) { header.classList.toggle('hide', dy > 0 && y > 240); lastY = y; }
  };
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  addEventListener('focusin', e => { if (header.contains(e.target)) header.classList.remove('hide'); });

  /* Capítulo actual: tono de la cabecera (claro/oscuro según el cielo) y rótulo con la hora */
  const chap = $('#chapter'), secs = $$('main > section[data-tone]');
  if ('IntersectionObserver' in window && secs.length) {
    const hourEl = document.createElement('b'), nameEl = document.createElement('i');
    chap.append(hourEl, nameEl); let cur = null;
    const set = s => {
      if (s === cur) return; cur = s; header.dataset.tone = s.dataset.tone;
      hourEl.textContent = s.dataset.hour || ''; nameEl.textContent = s.dataset.chapter || '';
      chap.hidden = !s.dataset.hour || s.id === 'top';
    };
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(e.target); }), { rootMargin: '-6% 0px -90% 0px' });
    secs.forEach(s => io.observe(s));
  }
  const setMenu = (open, focus) => {
    nav.classList.toggle('open', open); header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.style.overflow = open ? 'hidden' : ''; if (focus) burger.focus();
  };
  burger?.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav?.addEventListener('click', e => { if (e.target.closest('a') || e.target === nav) setMenu(false); });
  document.addEventListener('click', e => { if (nav.classList.contains('open') && !e.target.closest('#nav, #burger')) setMenu(false); });
  matchMedia('(min-width: 861px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) setMenu(false, true); });

  /* Progreso de lectura: respaldo para navegadores sin scroll-driven animations */
  const ember = $('.ember');
  if (ember && !CSS.supports('animation-timeline: scroll()')) {
    const upd = () => { ember.style.transform = `scaleX(${Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)).toFixed(4)})`; };
    upd(); addEventListener('scroll', upd, { passive: true });
  }

  /* Abierto ahora (hora de Argentina), desde S.schedule */
  const keys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], names = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const hm = s => { const [h, m] = s.split(':').map(Number); return h + m / 60; };
  const label = n => String(Math.floor(n) % 24).padStart(2, '0') + ':' + String(Math.round((n % 1) * 60)).padStart(2, '0');
  const status = () => {
    try {
      const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      const g = t => p.find(x => x.type === t).value, d = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(g('weekday')), t = (+g('hour') % 24) + +g('minute') / 60;
      const slots = i => (S.schedule[keys[(d + i) % 7]] || []).map(([a, b]) => [hm(a), hm(b)]);
      const cur = slots(0).find(([a, b]) => t >= a && t < b);
      let txt, closed = false;
      if (cur) { txt = 'Abierto ahora, hasta las ' + label(cur[1]); }
      else {
        closed = true; let n = null;
        for (let i = 0; i < 7 && !n; i++) { const s = slots(i).filter(([a]) => i > 0 || a > t)[0]; if (s) n = [i, s[0]]; }
        txt = 'Cerrado. ' + (n ? 'Abre ' + (n[0] === 0 ? 'hoy' : n[0] === 1 ? 'mañana' : names[(d + n[0]) % 7]) + ' a las ' + label(n[1]) : 'Consultá los horarios.');
      }
      $$('[data-status]').forEach(e => { e.textContent = txt; e.classList.toggle('closed', closed); });
    } catch {}
  };
  if (S && S.schedule) status();
  document.addEventListener('visibilitychange', () => { if (!document.hidden && S && S.schedule) status(); });

  /* Galería ampliada */
  const figs = $$('#gallery figure');
  if (figs.length && 'HTMLDialogElement' in window) {
    const dl = document.createElement('dialog'); dl.className = 'lb'; dl.setAttribute('aria-label', 'Galería de fotos');
    const mk = (t, c, x, l) => { const e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; if (l) { e.setAttribute('aria-label', l); e.type = 'button'; } return e; };
    const wrap = mk('div', 'lb-in'), im = document.createElement('img'), cap = mk('p');
    wrap.append(im, cap, mk('button', 'x', '✕', 'Cerrar'), mk('button', 'p', '←', 'Foto anterior'), mk('button', 'n', '→', 'Foto siguiente'));
    dl.append(wrap); document.body.append(dl);
    let i = 0;
    const show = k => { i = (k + figs.length) % figs.length; const s = $('img', figs[i]); im.src = s.currentSrc || s.src; im.alt = s.alt; cap.textContent = s.alt; im.style.animation = 'none'; im.offsetWidth; im.style.animation = ''; };
    const open = k => { show(k); dl.showModal(); };
    figs.forEach((f, k) => { const s = $('img', f), b = document.createElement('button'); b.type = 'button'; b.className = 'zoom'; b.setAttribute('aria-label', 'Ampliar foto: ' + s.alt); s.replaceWith(b); b.append(s); b.addEventListener('click', () => open(k)); });
    dl.addEventListener('click', e => { if (e.target === dl || e.target === wrap || e.target.closest('.x')) dl.close(); else if (e.target.closest('.p')) show(i - 1); else if (e.target.closest('.n')) show(i + 1); });
    dl.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); });
  }

  /* Control de movimiento (WCAG 2.2.2) */
  const motion = $('#motion');
  if (motion && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    motion.hidden = false;
    motion.addEventListener('click', () => { const calm = document.documentElement.classList.toggle('calm'); motion.textContent = calm ? 'Reanudar movimiento' : 'Pausar movimiento'; motion.setAttribute('aria-pressed', String(calm)); });
  }
})();
