(() => {
  const S = window.SITE, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, attrs = {}, text) => { const n = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); if (text != null) n.textContent = text; return n; };
  const ext = (a, url) => { a.href = url; a.target = '_blank'; a.rel = 'noopener'; };
  const wa = k => `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(S.waMessages[k] || S.waMessages.general)}`;
  // Fecha LOCAL (no UTC): evita errores de agenda cerca de medianoche en Argentina
  const localISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  try {
  $$('[data-wa]').forEach(a => ext(a, wa(a.dataset.wa)));
  $$('[data-map]').forEach(a => ext(a, S.mapsUrl));
  $$('[data-ig]').forEach(a => ext(a, S.instagram));
  $$('[data-fb]').forEach(a => S.facebook ? ext(a, S.facebook) : (a.closest('li') || a).hidden = true);
  $$('[data-tel]').forEach(a => { a.href = 'tel:' + S.phone; if (!a.textContent.trim()) a.textContent = S.phoneLabel; });
  // "Carta": si no hay carta oficial, la acción es honesta ("Consultar")
  $$('[data-menu]').forEach(a => { if (S.menu.url) ext(a, S.menu.url); else { ext(a, wa('carta')); if (a.dataset.alt) a.textContent = a.dataset.alt; a.setAttribute('aria-label', 'Consultar la carta por WhatsApp'); } });
  $$('[data-address]').forEach(e => e.textContent = S.address);
  $$('[data-hours]').forEach(e => e.replaceChildren(...S.hours.map(([d, h]) => { const r = el('div'); r.append(el('dt', {}, d), el('dd', {}, h)); return r; })));
  $('#cats').replaceChildren(...S.categories.map(c => el('li', {}, c)));

  // Eventos: solo confirmados y futuros (hora local)
  const today = localISO();
  const ev = S.events.filter(e => e.status === 'confirmed' && e.date >= today);
  if (ev.length) {
    $('#events').replaceChildren(...ev.map(e => { const li = el('li'); const t = el('time', { datetime: e.date }, new Date(e.date + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) + (e.time ? ' · ' + e.time + ' h' : '')); li.append(t, ' ', el('strong', {}, e.artist)); return li; }));
  } else { $('#events').hidden = true; $('#no-events').hidden = false; }

  // Galería y hero: solo material autorizado
  const g = S.gallery.filter(i => i.status === 'authorized');
  if (g.length) {
    $('#galeria').hidden = false; $$('[href="#galeria"]').forEach(a => a.hidden = false);
    $('#gallery').replaceChildren(...g.map((i, n) => { const f = el('figure'); const im = el('img', { src: i.src, width: i.w, height: i.h, alt: i.alt, decoding: 'async' }); if (n) im.loading = 'lazy'; f.append(im); if (i.credit) f.append(el('figcaption', {}, i.credit)); return f; }));
  }
  const hi = S.hero && S.hero.image;
  if (hi && hi.status === 'authorized') { const hero = $('.hero'); hero.prepend(el('div', { class: 'veil' })); hero.prepend(el('img', { class: 'hero-img', src: hi.src, width: hi.w, height: hi.h, alt: hi.alt || '', fetchpriority: 'high', decoding: 'async' })); }
  $('#year').textContent = new Date().getFullYear();
  } catch (e) { console.warn('Render de datos falló; queda el HTML estático:', e); }

  try {
  // Menú móvil accesible: Escape (devuelve foco), click fuera, cierre al elegir, aria dinámico
  const btn = $('#burger'), nav = $('#nav'), hd = $('header');
  const set = (o, focus) => { nav.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); btn.setAttribute('aria-label', o ? 'Cerrar menú' : 'Abrir menú'); if (!o && focus) btn.focus(); };
  btn.addEventListener('click', () => set(!nav.classList.contains('open')));
  nav.addEventListener('click', e => e.target.closest('a') && set(false));
  document.addEventListener('click', e => nav.classList.contains('open') && !hd.contains(e.target) && set(false));
  addEventListener('keydown', e => e.key === 'Escape' && nav.classList.contains('open') && set(false, true));
  const onS = () => hd.classList.toggle('solid', scrollY > 40); onS(); addEventListener('scroll', onS, { passive: true });
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))), { threshold: .12 });
    $$('.rv').forEach(e => { e.classList.add('rv-on'); io.observe(e); });
  }
  } catch (e) { console.warn('UI:', e); }
})();
