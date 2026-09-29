(() => {
  const S = window.SITE, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, attrs = {}, text) => { const n = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); if (text != null) n.textContent = text; return n; };
  const REL = 'noopener noreferrer';
  const isHttps = u => { try { return new URL(u).protocol === 'https:'; } catch { return false; } };
  const isAsset = p => typeof p === 'string' && /^assets\/[\w\-./]+$/.test(p) && !p.split('/').some(x => !x || x === '.' || x === '..');
  // Solo https: (nunca javascript:, data:, http:). Devuelve false si no se pudo aplicar.
  const ext = (a, url) => { if (!isHttps(url)) return false; a.href = url; a.target = '_blank'; a.rel = REL; return true; };
  const wa = k => `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(S.waMessages[k] || S.waMessages.general)}`;
  // Fecha LOCAL (no UTC): evita errores de agenda cerca de medianoche en Argentina
  const localISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  // Render seguro: cada bloque y cada nodo falla de forma aislada; si falla, queda el HTML estático
  const step = (name, fn) => { try { fn(); } catch (e) { console.warn(`Render "${name}" falló; queda el HTML estático:`, e); } };
  const nodes = (list, fn) => list.flatMap(x => { try { return [fn(x)]; } catch (e) { console.warn('Nodo omitido:', e); return []; } });
  const fill = (target, list, fn) => { const n = nodes(list, fn); if (n.length) target.replaceChildren(...n); };

  step('enlaces', () => {
    $$('[data-wa]').forEach(a => ext(a, wa(a.dataset.wa)));
    $$('[data-map]').forEach(a => ext(a, S.mapsUrl));
    $$('[data-ig]').forEach(a => ext(a, S.instagram));
    $$('[data-fb]').forEach(a => S.facebook && ext(a, S.facebook) ? 0 : (a.closest('li') || a).hidden = true);
    $$('[data-tel]').forEach(a => { a.href = 'tel:' + S.phone; if (!a.textContent.trim()) a.textContent = S.phoneLabel; });
  });
  // "Carta": si no hay carta oficial, la acción es honesta ("Consultar")
  step('carta', () => $$('[data-menu]').forEach(a => {
    if (S.menu.url && ext(a, S.menu.url)) { if (a.dataset.label) a.textContent = a.dataset.label; a.removeAttribute('aria-label'); return; }
    ext(a, wa('carta')); if (a.dataset.alt) a.textContent = a.dataset.alt; a.setAttribute('aria-label', 'Consultar la carta por WhatsApp');
  }));
  step('dirección', () => $$('[data-address]').forEach(e => e.textContent = S.address));
  step('horarios', () => $$('[data-hours]').forEach(e => fill(e, S.hours, ([d, h]) => { const r = el('div'); r.append(el('dt', {}, d), el('dd', {}, h)); return r; })));
  step('categorías', () => fill($('#cats'), S.categories, c => el('li', {}, c)));

  // Eventos: solo confirmados y futuros (hora local)
  step('eventos', () => {
    const today = localISO();
    const items = nodes(S.events.filter(e => e && e.status === 'confirmed' && e.date >= today), e => {
      const li = el('li'); const t = el('time', { datetime: e.date }, new Date(e.date + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) + (e.time ? ' · ' + e.time + ' h' : ''));
      li.append(t, ' ', el('strong', {}, e.title ? `${e.title} — ${e.artist}` : e.artist)); return li;
    });
    if (items.length) { $('#events').replaceChildren(...items); $('#events').hidden = false; $('#no-events').hidden = true; }
  });

  // Galería y hero: solo material autorizado y con ruta local válida
  step('galería', () => {
    const g = S.gallery.filter(i => i && i.status === 'authorized' && isAsset(i.src));
    const figs = nodes(g, i => { const f = el('figure'); const im = el('img', { src: i.src, width: i.w, height: i.h, alt: i.alt, decoding: 'async' }); if (i !== g[0]) im.loading = 'lazy'; f.append(im); const cap = [i.caption, i.credit && 'Foto: ' + i.credit].filter(Boolean).join(' · '); if (cap) f.append(el('figcaption', {}, cap)); return f; });
    if (!figs.length) return;
    $('#galeria').hidden = false; $$('[href="#galeria"]').forEach(a => a.hidden = false); $('#gallery').replaceChildren(...figs);
  });
  step('hero', () => {
    const hi = S.hero && S.hero.image;
    if (!(hi && hi.status === 'authorized' && isAsset(hi.src))) return;
    const hero = $('.hero'); hero.prepend(el('div', { class: 'veil' })); hero.prepend(el('img', { class: 'hero-img', src: hi.src, width: hi.w, height: hi.h, alt: hi.alt || '', fetchpriority: 'high', decoding: 'async' }));
  });
  step('año', () => { $('#year').textContent = new Date().getFullYear(); });

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
