(() => {
  const S = window.SITE, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const wa = k => `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(S.waMessages[k] || S.waMessages.general)}`;
  $$('[data-wa]').forEach(a => { a.href = wa(a.dataset.wa); a.target = '_blank'; a.rel = 'noopener'; });
  $$('[data-map]').forEach(a => { a.href = S.mapsUrl; a.target = '_blank'; a.rel = 'noopener'; });
  $$('[data-ig]').forEach(a => { a.href = S.instagram; a.target = '_blank'; a.rel = 'noopener'; });
  $$('[data-tel]').forEach(a => { a.href = 'tel:' + S.phone; if (!a.children.length && !a.textContent.trim()) a.textContent = S.phoneLabel; });
  $$('[data-menu]').forEach(a => { if (S.menu.url) { a.href = S.menu.url; a.target = '_blank'; a.rel = 'noopener'; } else { a.href = wa('carta'); a.target = '_blank'; a.rel = 'noopener'; } });
  $$('[data-address]').forEach(e => e.textContent = S.address);
  $$('[data-hours]').forEach(e => e.innerHTML = S.hours.map(([d, h]) => `<div><dt>${d}</dt><dd>${h}</dd></div>`).join(''));
  $('#cats').innerHTML = S.categories.map(c => `<li>${c}</li>`).join('');
  const rep = S.reputation; $('#rep').textContent = `${rep.text} · ${rep.source}, ${rep.date}`;
  // Eventos: solo confirmados y futuros
  const today = new Date().toISOString().slice(0, 10);
  const ev = S.events.filter(e => e.status === 'confirmed' && e.date >= today);
  if (ev.length) $('#events').innerHTML = ev.map(e => `<li><time datetime="${e.date}">${new Date(e.date + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}${e.time ? ' · ' + e.time + ' h' : ''}</time> <strong>${e.artist}</strong></li>`).join('');
  else $('#events').hidden = true, $('#no-events').hidden = false;
  // Galería: solo material autorizado; si no hay, la sección no se muestra
  const g = S.gallery.filter(i => i.status === 'authorized');
  if (g.length) { $('#galeria').hidden = false; $('#gallery').innerHTML = g.map((i, n) => `<figure><img src="${i.src}" width="${i.w}" height="${i.h}" alt="${i.alt}" ${n ? 'loading="lazy"' : ''} decoding="async">${i.credit ? `<figcaption>${i.credit}</figcaption>` : ''}</figure>`).join(''); $$('[href="#galeria"]').forEach(a => a.hidden = false); }
  $('#year').textContent = new Date().getFullYear();
  // Menú móvil
  const btn = $('#burger'), nav = $('#nav');
  const set = o => { nav.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); };
  btn.addEventListener('click', () => set(!nav.classList.contains('open')));
  nav.addEventListener('click', e => e.target.closest('a') && set(false));
  addEventListener('keydown', e => e.key === 'Escape' && set(false));
  // Header sólido + reveal (transform/opacity)
  const hd = $('header'); const onS = () => hd.classList.toggle('solid', scrollY > 40); onS(); addEventListener('scroll', onS, { passive: true });
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))), { threshold: .12 });
    $$('.rv').forEach(e => { e.classList.add('rv-on'); io.observe(e); });
  }
})();
