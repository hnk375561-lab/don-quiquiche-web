/* Don Quiquiche · capa de movimiento (GSAP 3.15 + ScrollTrigger + SplitText + DrawSVG, autoalojados en assets/vendor).
   Mejora progresiva: el sitio ya es completo sin este archivo. Si GSAP no carga, si no hay JavaScript o si el usuario
   pidió "reducir movimiento", no se toca nada y el contenido queda visible (los reveals CSS de main.js siguen ahí).
   Se ejecuta DESPUÉS de main.js, porque anima nodos que main.js completa (horarios, categorías, eventos, estado). */
(() => {
  'use strict';
  const g = window.gsap, ST = window.ScrollTrigger, SP = window.SplitText, DR = window.DrawSVGPlugin;
  if (!g || !ST) return;
  try { g.registerPlugin(ST, ...(SP ? [SP] : []), ...(DR ? [DR] : [])); } catch (e) { console.warn('GSAP: no se pudo registrar', e); return; }
  ST.config({ ignoreMobileResize: true }); // la barra del navegador móvil no dispara recálculos en cadena

  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const make = (tag, cls, attrs = {}) => { const n = document.createElement(tag); if (cls) n.className = cls; Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); return n; };
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const safe = (name, fn) => { try { return fn(); } catch (e) { console.warn(`Animación "${name}" falló; queda el contenido estático:`, e); } };
  const lite = (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2; // equipos modestos: intro más simple
  const late = performance.now() > 3000; // si GSAP llegó tarde (red muy lenta), el hero ya se mostró: no repetir la intro
  let introDone = false;

  // Animaciones continuas: se pausan con "Pausar animaciones" (WCAG 2.2.2) y cuando están fuera de pantalla
  const loops = new Set();
  const calm = () => root.classList.contains('calm');
  const loop = (tween, trigger) => {
    const st = { vis: true };
    const sync = () => tween.paused(calm() || !st.vis);
    const rec = { sync };
    if (trigger) ST.create({ trigger, start: 'top bottom', end: 'bottom top', onToggle: s => { st.vis = s.isActive; sync(); } });
    loops.add(rec); sync();
    return () => { loops.delete(rec); tween.kill(); };
  };
  new MutationObserver(() => loops.forEach(l => l.sync())).observe(root, { attributes: true, attributeFilter: ['class'] });

  const mm = g.matchMedia();

  /* ============ 1) Movimiento general (solo si el usuario NO pidió reducir movimiento) ============ */
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const cleanups = [];
    const hero = $('.hero'), pic = $('.hero-pic'), veil = $('.veil'), heroIn = $('.hero-in'), h1 = $('.hero h1');
    const heroBits = hero ? $$('.hero-in > *:not(h1), .trust', hero) : [];
    const trustItems = hero ? $$('.trust li', hero) : [];
    let dead = false;
    cleanups.push(() => { dead = true; });

    /* ---------- HERO: "se enciende la parrilla" ----------
       Referencia conceptual: revelados con máscara/clip-path de Codrops (Image Reveal / Page Transitions), adaptados a
       un frente de llamas: un polígono con lenguas de fuego sube por la foto; detrás del frente se ve la foto, delante
       el hollín, y una franja de brasa marca el borde. Todo con clip-path sobre 3 capas, solo durante ~1,7 s. */
    safe('hero', () => {
      if (!hero || !pic) return;
      root.classList.add('gx'); // desde acá el estado oculto lo maneja GSAP (antes lo hacía el CSS con su salvavidas)
      const playIntro = !introDone && !late;
      if (!playIntro) { g.set(pic, { scale: 1.1 }); return; }

      const N = 26, D = 0.45;
      const seed = Array.from({ length: N + 1 }, (_, i) => { const s = Math.sin((i + 1) * 12.9898) * 43758.5453; return s - Math.floor(s); });
      const R = seed.map((v, i, a) => (a[i - 1] ?? v) * .25 + v * .5 + (a[i + 1] ?? v) * .25);
      const edge = p => R.map(r => 100 - clamp01(p * (1 + D) - D * r) * 102);
      const xs = R.map((_, i) => (i / N * 100).toFixed(2));
      const top = p => edge(p).map((y, i) => `${xs[i]}% ${y.toFixed(1)}%`);
      const fill = p => `polygon(${top(p).join(',')},100% 102%,0% 102%)`;
      const band = (pl, pt) => `polygon(${top(pl).join(',')},${top(pt).reverse().join(',')})`;

      const fire = lite ? null : make('div', 'gx-fire', { 'aria-hidden': 'true' });
      const layers = veil ? [pic, veil] : [pic];
      if (fire) veil ? veil.after(fire) : pic.after(fire);
      const bits = [...heroBits, ...(h1 ? [h1] : [])];
      g.set(bits, { opacity: 0 });
      g.set(pic, { scale: 1.3 });
      if (lite) g.set(layers, { clipPath: 'none', opacity: 0 });
      else { g.set(layers, { clipPath: fill(0) }); g.set(fire, { clipPath: band(0, 0) }); }

      let tl, split, finished = false;
      const finish = () => {
        if (finished) return; finished = true;
        removeSkip();
        try { split && split.revert(); } catch (e) { /* noop */ }
        if (tl) tl.progress(1);
        g.set(layers, { clearProps: 'clipPath,opacity' });
        g.set([...bits, ...trustItems], { clearProps: 'opacity,transform' });
        fire && fire.remove();
        introDone = true;
        ST.refresh();
      };
      // Cualquier gesto del usuario (o scroll) termina la intro al instante: nunca hay que esperarla
      const skip = () => finish();
      const onScrollSkip = () => scrollY > 24 && finish();
      const skipEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
      const removeSkip = () => { skipEvents.forEach(ev => removeEventListener(ev, skip)); removeEventListener('scroll', onScrollSkip); };
      skipEvents.forEach(ev => addEventListener(ev, skip, { passive: true, once: true }));
      addEventListener('scroll', onScrollSkip, { passive: true });
      cleanups.push(() => { removeSkip(); fire && fire.remove(); });
      const guard = g.delayedCall(5, finish); // red de seguridad: pase lo que pase, a los 5 s todo está visible
      cleanups.push(() => guard.kill());

      const go = () => safe('hero-intro', () => {
        if (dead || finished) return;
        if (h1 && SP) split = SP.create(h1, { type: 'lines,words,chars', mask: 'lines', linesClass: 'gx-line' });
        tl = g.timeline({ defaults: { ease: 'power3.out' }, onComplete: finish });
        const prog = { p: 0 };
        if (lite) tl.to(layers, { opacity: 1, duration: .9, ease: 'power1.out' }, 0);
        else tl.to(prog, {
          p: 1, duration: 1.7, ease: 'power2.inOut',
          onUpdate() {
            const pt = clamp01(prog.p * 1.3 - .3), pl = clamp01(prog.p * 1.3);
            const c = fill(pt); layers.forEach(l => l.style.clipPath = c); fire.style.clipPath = band(pl, pt);
          }
        }, 0);
        tl.to(pic, { scale: 1.1, duration: 2.6, ease: 'power3.out' }, 0);
        const t0 = lite ? .1 : .7;
        if (split) {
          g.set(h1, { opacity: 1 });
          tl.from(split.chars, { yPercent: 118, rotate: 7, color: '#ffb15a', duration: 1, stagger: { each: .032, from: 'start' }, ease: 'power4.out' }, t0);
        } else if (h1) tl.fromTo(h1, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .9 }, t0);
        const badge = $('.badge', hero), status = $('.status', hero), sub = $('.sub', hero), btns = $$('.hero .acts .btn');
        badge && tl.fromTo(badge, { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: .8 }, t0 - .25);
        status && tl.fromTo(status, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: .8 }, t0 - .1);
        sub && tl.fromTo(sub, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .9 }, t0 + .45);
        btns.length && tl.fromTo(btns, { opacity: 0, y: 34, scale: .94 }, { opacity: 1, y: 0, scale: 1, duration: .9, stagger: .12, ease: 'back.out(1.5)' }, t0 + .6);
        const bar = $('.trust', hero);
        bar && tl.fromTo(bar, { opacity: 0, yPercent: 100 }, { opacity: 1, yPercent: 0, duration: .8, ease: 'power3.out' }, t0 + .75);
        trustItems.length && tl.fromTo(trustItems, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .6, stagger: .1 }, t0 + .95);
      });
      // SplitText necesita las tipografías ya cargadas (se precargan, así que suele ser inmediato)
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go, go);
    });

    /* ---------- HERO: profundidad al hacer scroll (transform/opacity, sin layout) ---------- */
    safe('hero-scroll', () => {
      if (!hero || !pic) return;
      g.fromTo(pic, { yPercent: 0 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      if (heroIn) g.fromTo(heroIn, { yPercent: 0, opacity: 1 }, { yPercent: -12, opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 35%', scrub: true } });
    });

    /* ---------- CINTA: la velocidad y el sentido siguen al scroll (idea clásica de Codrops: "scroll velocity marquee") ---------- */
    safe('cinta', () => {
      const marq = $('.marq'), track = marq && marq.firstElementChild;
      if (!track) return;
      marq.classList.add('gx-marq'); // apaga la animación CSS: ahora la mueve GSAP
      const set = g.quickSetter(track, 'x', 'px'), setSkew = g.quickSetter(track, 'skewX', 'deg');
      const s = { x: 0, dir: 1, skew: 0 }; let vel = 0, active = false;
      const half = () => track.scrollWidth / 2;
      const sv = ST.create({ start: 0, end: 'max', onUpdate: self => { vel = self.getVelocity(); if (vel) s.dir = vel > 0 ? 1 : -1; } });
      const vis = ST.create({ trigger: marq, start: 'top bottom', end: 'bottom top', onToggle: t => { active = t.isActive; } });
      const tick = (_, dt) => {
        if (!active) return;
        if (calm()) { s.skew += (0 - s.skew) * .2; setSkew(s.skew); return; }
        const k = Math.min(dt, 50) / 1000, h = half();
        s.x -= (62 * s.dir + vel * .045) * k; // 62 px/s ≈ velocidad de la cinta original
        if (h) { if (s.x <= -h) s.x += h; else if (s.x > 0) s.x -= h; }
        s.skew += (g.utils.clamp(-9, 9, -vel * .0035) - s.skew) * .12;
        set(s.x); setSkew(s.skew);
      };
      g.ticker.add(tick);
      cleanups.push(() => { g.ticker.remove(tick); sv.kill(); vis.kill(); marq.classList.remove('gx-marq'); g.set(track, { clearProps: 'transform' }); });
    });

    /* ---------- SECCIONES: títulos con máscara por líneas, textos que suben, filas que se dibujan ---------- */
    safe('reveals', () => {
      $$('.rv').forEach(b => b.classList.remove('rv-on')); // el reveal CSS de main.js cede el lugar a GSAP
      const boxes = $$('.rv').map(box => ({ box, eyebrow: $(':scope > .eyebrow', box), title: $(':scope > h2', box) }));
      const gal = $('#galeria .wrap');
      if (gal) boxes.push({ box: gal, eyebrow: null, title: $(':scope > h2', gal), only: true });

      boxes.forEach(({ box, eyebrow, title, only }) => {
        const kids = only ? [] : [...box.children].filter(c => c !== eyebrow && c !== title);
        const isList = box.matches('ul, dl'); // .pillars y dl.h son el propio contenedor .rv
        const rows = isList ? kids : [];
        const cats = kids.filter(c => c.matches('.cats')).flatMap(c => [...c.children]);
        const plain = isList ? [] : kids.filter(c => !c.matches('.cats'));
        const build = split => {
          let tl;
          tl = g.timeline({
            defaults: { ease: 'power3.out' },
            scrollTrigger: { trigger: box, start: 'top 86%', once: true, onEnter: self => { const v = Math.abs(self.getVelocity()); if (v > 6000) tl.progress(1); else if (v > 2500) tl.timeScale(2.2); } },
            onComplete() { try { split && split.revert(); } catch (e) { /* noop */ } }
          });
          eyebrow && tl.from(eyebrow, { x: -28, opacity: 0, duration: .7, clearProps: 'transform,opacity' }, 0);
          if (split) tl.from(split.lines, { yPercent: 118, rotate: 2.5, duration: 1.05, stagger: .1, ease: 'power4.out' }, .08);
          else if (title) tl.from(title, { y: 30, opacity: 0, duration: .9, clearProps: 'transform,opacity' }, .08);
          if (plain.length) tl.from(plain, { y: 36, opacity: 0, duration: .9, stagger: .11, clearProps: 'transform,opacity' }, .3);
          if (cats.length) tl.from(cats, { clipPath: 'inset(0% 100% 0% 0% round 999px)', xPercent: -10, duration: .95, stagger: .13, ease: 'power3.inOut', clearProps: 'clipPath,transform' }, .35);
          if (rows.length) {
            if (box.matches('dl')) tl.from(rows, { clipPath: 'inset(0% 100% 0% 0%)', duration: 1, stagger: .14, ease: 'power3.inOut', clearProps: 'clipPath' }, 0);
            else { // .pillars: filas + íconos que se dibujan
              tl.from(rows, { x: -36, opacity: 0, duration: .9, stagger: .16, clearProps: 'transform,opacity' }, 0);
              const icons = $$('.ic', box);
              tl.from(icons, { scale: .55, rotate: -28, duration: 1, stagger: .16, ease: 'back.out(1.7)', clearProps: 'transform' }, .05);
              if (DR) {
                const strokes = icons.filter(i => i.getAttribute('fill') === 'none').flatMap(i => $$('path, circle', i));
                if (strokes.length) tl.fromTo(strokes, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.4, stagger: .05, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset' }, .35);
              }
            }
          }
          return tl;
        };
        if (title && SP && !only) SP.create(title, { type: 'lines', mask: 'lines', linesClass: 'gx-line', autoSplit: true, onSplit: self => build(self) });
        else if (title && SP) SP.create(title, { type: 'lines', mask: 'lines', linesClass: 'gx-line', autoSplit: true, onSplit: self => build(self) });
        else build(null);
      });

      // Llama del pilar "Fuego": parpadeo suave, solo mientras se ve y si el usuario no pausó el movimiento
      const flame = $('.pillars li:first-child .ic');
      if (flame) {
        const shapes = $$('path', flame);
        const tw = g.to(shapes, { scaleY: 1.07, scaleX: .96, transformOrigin: '50% 100%', duration: .75, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: .18 });
        cleanups.push(loop(tw, flame));
      }
    });

    /* ---------- PEÑA: las luces del escenario se van encendiendo con el scroll ---------- */
    safe('pena', () => {
      const beams = $('#pena .beams');
      if (beams) g.fromTo(beams, { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: '#pena', start: 'top 85%', end: 'top 25%', scrub: true } });
    });

    /* ---------- GALERÍA: revelado con máscara + parallax interno + ampliación con FLIP ---------- */
    safe('galeria', () => {
      const figs = $$('#gallery figure').filter(f => $('img', f));
      if (!figs.length) return;
      const items = figs.map(fig => {
        const img = $('img', fig);
        const btn = make('button', 'gx-ph', { type: 'button', 'aria-label': 'Ampliar foto: ' + (img.alt || 'galería') });
        img.replaceWith(btn); btn.append(img);
        return { fig, img, btn };
      });
      cleanups.push(() => items.forEach(({ img, btn }) => { if (btn.isConnected) { btn.replaceWith(img); g.set(img, { clearProps: 'all' }); } }));

      items.forEach(({ fig, img, btn }, i) => {
        const cap = $('figcaption', fig);
        const tl = g.timeline({ scrollTrigger: { trigger: btn, start: 'top 88%', once: true, onEnter: self => { if (Math.abs(self.getVelocity()) > 6000) tl.progress(1); } }, onComplete: () => g.set(btn, { clearProps: 'clipPath' }) });
        tl.fromTo(btn, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: 'power4.inOut' }, 0)
          .fromTo(img, { scale: 1.55 }, { scale: 1.16, duration: 1.7, ease: 'power3.out' }, 0);
        cap && tl.from(cap, { opacity: 0, y: 12, duration: .7, clearProps: 'transform,opacity' }, .7);
        g.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: btn, start: 'top bottom', end: 'bottom top', scrub: .6 } });
        // zoom suave al pasar el mouse (en táctil no hay hover: solo se ve el parallax)
        if (matchMedia('(hover: hover)').matches) {
          const on = () => g.to(img, { scale: 1.26, duration: .9, ease: 'power3.out', overwrite: 'auto' }), off = () => g.to(img, { scale: 1.16, duration: .9, ease: 'power3.out', overwrite: 'auto' });
          btn.addEventListener('pointerenter', on); btn.addEventListener('pointerleave', off);
          cleanups.push(() => { btn.removeEventListener('pointerenter', on); btn.removeEventListener('pointerleave', off); });
        }
        void i;
      });

      // --- Ampliación: <dialog> nativo (foco atrapado, Escape, aria-modal) + FLIP a mano con transform/clip-path ---
      const dlg = make('dialog', 'gx-lb', { 'aria-label': 'Foto ampliada' });
      const bd = make('div', 'gx-bd', { 'aria-hidden': 'true' });
      const lbImg = make('img'), cap = make('p', 'gx-cap'), x = make('button', 'gx-x', { type: 'button', 'aria-label': 'Cerrar foto' });
      x.textContent = '✕';
      dlg.append(bd, x, lbImg, cap); document.body.append(dlg);
      let cur = null, busy = false;
      const geo = () => {
        const to = lbImg.getBoundingClientRect(), from = cur.btn.getBoundingClientRect();
        const k = Math.max(from.width / to.width, from.height / to.height);
        const ix = Math.max(0, (to.width - from.width / k) / 2), iy = Math.max(0, (to.height - from.height / k) / 2);
        return { x: from.left + from.width / 2 - (to.left + to.width / 2), y: from.top + from.height / 2 - (to.top + to.height / 2), scale: k, clipPath: `inset(${iy}px ${ix}px ${iy}px ${ix}px round ${14 / k}px)` };
      };
      const open = it => {
        if (busy || dlg.open) return; busy = true; cur = it;
        lbImg.src = it.img.currentSrc || it.img.src; lbImg.alt = it.img.alt; cap.textContent = it.img.alt;
        dlg.showModal(); root.classList.add('gx-lock');
        const run = () => {
          const from = geo();
          g.timeline({ onComplete: () => { busy = false; } })
            .fromTo(bd, { opacity: 0 }, { opacity: 1, duration: .5, ease: 'power2.out' }, 0)
            .fromTo(lbImg, from, { x: 0, y: 0, scale: 1, clipPath: 'inset(0px 0px 0px 0px round 8px)', duration: .9, ease: 'expo.out' }, 0)
            .fromTo([cap, x], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .5, stagger: .08, ease: 'power3.out' }, .4);
        };
        lbImg.complete && lbImg.naturalWidth ? run() : (lbImg.decode ? lbImg.decode().then(run, run) : (lbImg.onload = run));
      };
      const shut = () => {
        if (busy || !dlg.open) return; busy = true;
        g.timeline({ onComplete: () => { dlg.close(); } })
          .to([cap, x], { opacity: 0, duration: .2 }, 0)
          .to(lbImg, { ...geo(), duration: .6, ease: 'expo.inOut' }, 0)
          .to(bd, { opacity: 0, duration: .5, ease: 'power2.inOut' }, .1);
      };
      const onClosed = () => { root.classList.remove('gx-lock'); busy = false; g.set([lbImg, bd, cap, x], { clearProps: 'all' }); if (cur) cur.btn.focus({ preventScroll: true }); };
      dlg.addEventListener('close', onClosed);
      dlg.addEventListener('cancel', e => { e.preventDefault(); shut(); }); // Escape
      dlg.addEventListener('click', e => { if (e.target === dlg || e.target === bd) shut(); });
      x.addEventListener('click', shut);
      items.forEach(it => { it.h = () => open(it); it.btn.addEventListener('click', it.h); });
      cleanups.push(() => { items.forEach(it => it.btn.removeEventListener('click', it.h)); dlg.open && dlg.close(); dlg.remove(); root.classList.remove('gx-lock'); });
    });

    /* ---------- NAVEGACIÓN: progreso de lectura, sección activa y menú móvil ---------- */
    safe('nav', () => {
      const header = $('header'), nav = $('#nav');
      if (header) {
        const bar = make('span', 'gx-prog', { 'aria-hidden': 'true' }); header.append(bar);
        g.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });
        cleanups.push(() => bar.remove());
      }
      if (nav) {
        $$('a[href^="#"]', nav).forEach(a => {
          const t = $(a.getAttribute('href'));
          if (!t || a.classList.contains('btn')) return;
          ST.create({ trigger: t, start: 'top 45%', end: 'bottom 45%', onToggle: s => s.isActive ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current') });
        });
        cleanups.push(() => $$('a[aria-current]', nav).forEach(a => a.removeAttribute('aria-current')));
        // Al abrir el menú móvil los enlaces entran en cascada (solo transform: nunca afecta la legibilidad)
        const mo = new MutationObserver(() => { if (nav.classList.contains('open') && !matchMedia('(min-width: 56rem)').matches) g.fromTo(nav.children, { x: -26 }, { x: 0, duration: .4, stagger: .035, ease: 'power3.out', clearProps: 'transform', overwrite: true }); });
        mo.observe(nav, { attributes: true, attributeFilter: ['class'] });
        cleanups.push(() => mo.disconnect());
      }
    });

    // Las tipografías o imágenes pueden mover el layout: se recalculan las posiciones una vez cargado todo
    const refresh = () => ST.refresh();
    addEventListener('load', refresh, { once: true });
    document.fonts && document.fonts.ready.then(refresh);
    return () => cleanups.forEach(fn => { try { fn(); } catch (e) { /* noop */ } });
  });

  /* ============ 2) Solo con mouse (hover + puntero fino): cursor, profundidad, botones magnéticos ============ */
  mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    const cleanups = [];
    const hero = $('.hero'), pic = $('.hero-pic'), embers = $('.embers'), heroIn = $('.hero-in');

    // Luz de brasa que sigue al cursor + tres capas con profundidad distinta (foto, contenido, brasas)
    safe('hero-cursor', () => {
      if (!hero || !pic) return;
      const glow = make('div', 'gx-glow', { 'aria-hidden': 'true' }); hero.insertBefore(glow, heroIn || null);
      const q = (t, p, d = .8) => g.quickTo(t, p, { duration: d, ease: 'power3' });
      const gx = q(glow, 'x', .7), gy = q(glow, 'y', .7), px = q(pic, 'x', 1.3), py = q(pic, 'y', 1.3);
      const ex = embers ? q(embers, 'x', 1) : null, ey = embers ? q(embers, 'y', 1) : null;
      const move = e => {
        if (e.pointerType !== 'mouse') return;
        const r = hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, nx = x / r.width - .5, ny = y / r.height - .5;
        gx(x); gy(y); px(-nx * 28); py(-ny * 18);
        if (ex) { ex(nx * 34); ey(ny * 20); }
      };
      const enter = e => { if (e.pointerType !== 'mouse') return; const r = hero.getBoundingClientRect(); g.set(glow, { x: e.clientX - r.left, y: e.clientY - r.top }); g.to(glow, { opacity: 1, duration: .6, overwrite: 'auto' }); };
      const leave = () => { g.to(glow, { opacity: 0, duration: .8, overwrite: 'auto' }); px(0); py(0); ex && (ex(0), ey(0)); };
      hero.addEventListener('pointermove', move, { passive: true }); hero.addEventListener('pointerenter', enter); hero.addEventListener('pointerleave', leave);
      cleanups.push(() => { hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerenter', enter); hero.removeEventListener('pointerleave', leave); glow.remove(); g.set([pic, embers].filter(Boolean), { x: 0, y: 0 }); });
    });

    // Botones magnéticos (desktop): se inclinan hacia el cursor. El "fill" de color al hover es CSS puro.
    safe('magnetic', () => {
      $$('.acts .btn, #nav .btn').forEach(b => {
        b.classList.add('gx-mag');
        const xt = g.quickTo(b, 'x', { duration: .55, ease: 'power3' }), yt = g.quickTo(b, 'y', { duration: .55, ease: 'power3' });
        let cx = 0, cy = 0;
        const enter = () => { const r = b.getBoundingClientRect(); cx = r.left + r.width / 2 - g.getProperty(b, 'x'); cy = r.top + r.height / 2 - g.getProperty(b, 'y'); };
        const move = e => { if (e.pointerType === 'mouse') { xt((e.clientX - cx) * .22); yt((e.clientY - cy) * .32); } };
        const leave = () => { xt(0); yt(0); };
        b.addEventListener('pointerenter', enter); b.addEventListener('pointermove', move, { passive: true }); b.addEventListener('pointerleave', leave);
        cleanups.push(() => { b.removeEventListener('pointerenter', enter); b.removeEventListener('pointermove', move); b.removeEventListener('pointerleave', leave); b.classList.remove('gx-mag'); g.set(b, { clearProps: 'transform' }); });
      });
    });

    // Cursor "Ampliar" sobre las fotos (delegado: no depende de cuándo se crearon los botones)
    safe('cursor-galeria', () => {
      const cur = make('div', 'gx-cur', { 'aria-hidden': 'true' }); cur.textContent = 'Ampliar'; document.body.append(cur);
      g.set(cur, { xPercent: -50, yPercent: -50, scale: 0, opacity: 0 });
      const cx = g.quickTo(cur, 'x', { duration: .35, ease: 'power3' }), cy = g.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
      let on = false, lx = 0, ly = 0, raf = 0;
      const show = v => { if (v === on) return; on = v; root.classList.toggle('gx-curs', v); g.to(cur, { scale: v ? 1 : 0, opacity: v ? 1 : 0, duration: .4, ease: v ? 'back.out(2)' : 'power2.out', overwrite: 'auto' }); };
      const over = (x, y) => { const t = document.elementFromPoint(x, y); return !!(t && t.closest && t.closest('.gx-ph')); };
      const move = e => { if (e.pointerType !== 'mouse') return; lx = e.clientX; ly = e.clientY; cx(lx); cy(ly); show(over(lx, ly)); };
      const onScroll = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; if (on || lx) show(over(lx, ly)); }); };
      document.addEventListener('pointermove', move, { passive: true }); addEventListener('scroll', onScroll, { passive: true });
      cleanups.push(() => { document.removeEventListener('pointermove', move); removeEventListener('scroll', onScroll); cur.remove(); root.classList.remove('gx-curs'); });
    });
    return () => cleanups.forEach(fn => { try { fn(); } catch (e) { /* noop */ } });
  });
})();
