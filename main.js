(() => {
  const S = window.SITE, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, attrs = {}, text) => { const n = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); if (text != null) n.textContent = text; return n; };
  const REL = 'noopener noreferrer';
  const isHttps = u => { try { return new URL(u).protocol === 'https:'; } catch { return false; } };
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

  // Estado "Abierto ahora": hora de Argentina (no la del dispositivo). Se oculta si no hay `schedule`.
  const updateOpen = () => {
    const box = $('#open-status'); if (!box || !S.schedule) return;
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
    const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday)];
    const m = t => t.split(':').reduce((h, x) => h * 60 + +x), now = +p.hour * 60 + +p.minute;
    const spans = (S.schedule[day] || []).map(([a, b]) => [m(a), m(b), a]);
    const open = spans.some(([a, b]) => now >= a && now < b), next = spans.find(([a]) => a > now);
    $('#open-text').textContent = open ? 'Abierto ahora' : next ? 'Cerrado ahora · abre hoy a las ' + next[2] : 'Cerrado ahora';
    box.classList.toggle('is-closed', !open); box.hidden = false;
  };
  step('estado', updateOpen);
  // La página puede quedar abierta horas en segundo plano: al volver, se recalcula
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && step('estado', updateOpen));
  step('año', () => { $('#year').textContent = new Date().getFullYear(); });

  try {
  // Menú móvil accesible: Escape (devuelve foco), click fuera, cierre al elegir, aria dinámico
  const btn = $('#burger'), nav = $('#nav'), hd = $('header');
  const set = (o, focus) => { nav.classList.toggle('open', o); btn.setAttribute('aria-expanded', String(o)); if (!o && focus) btn.focus(); };
  btn.addEventListener('click', () => set(!nav.classList.contains('open')));
  nav.addEventListener('click', e => e.target.closest('a') && set(false));
  document.addEventListener('click', e => nav.classList.contains('open') && !hd.contains(e.target) && set(false));
  addEventListener('keydown', e => e.key === 'Escape' && nav.classList.contains('open') && set(false, true));
  const wide = matchMedia('(min-width: 56rem)'), onWide = e => e.matches && set(false); // al pasar a escritorio no queda un estado "abierto" oculto
  wide.addEventListener ? wide.addEventListener('change', onWide) : wide.addListener(onWide); // Safari < 14 solo tiene addListener
  const onS = () => hd.classList.toggle('solid', scrollY > 40); onS(); addEventListener('scroll', onS, { passive: true });
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !calm) {
    // Animaciones infinitas (brasas, cinta, haces, ecualizador): solo corren mientras su bloque está en pantalla
    const pv = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('off', !e.isIntersecting)), { rootMargin: '80px' });
    $$('.hero, .marq, #pena').forEach(e => pv.observe(e));
  }
  // Control del usuario para detener el movimiento (WCAG 2.2.2). Con "reducir movimiento" ya está detenido y no hace falta.
  const mo = $('#motion');
  if (mo && !calm) { mo.hidden = false; mo.addEventListener('click', () => { const on = !document.documentElement.classList.toggle('calm'); mo.setAttribute('aria-pressed', String(!on)); mo.textContent = on ? 'Pausar animaciones' : 'Reanudar animaciones'; }); }
  if ('IntersectionObserver' in window && !calm) {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))), { threshold: .12 });
    $$('.rv').forEach(e => { e.classList.add('rv-on'); io.observe(e); });
  }
  } catch (e) { console.warn('UI:', e); }
})();
