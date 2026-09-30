/* Capa de movimiento: GSAP + ScrollTrigger + SplitText (autoalojados en assets/vendor).
   Mejora progresiva: sin JS, con "reducir movimiento" o con "Pausar movimiento" el sitio se ve completo y sin efectos.
   Rendimiento: todo anima transform/opacity/clip-path (nada de layout), los revelados corren una sola vez (once),
   el parallax y los imanes solo existen en escritorio (gsap.matchMedia) y todo se revierte limpio al pausar. */
(() => {
  const root = document.documentElement, g = window.gsap, ST = window.ScrollTrigger, SP = window.SplitText;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (!g || !ST || reduce.matches) { root.classList.add('anim-off'); return; }
  g.registerPlugin(ST, ...(SP ? [SP] : []));
  g.config({ nullTargetWarn: false });
  g.ticker.lagSmoothing(500, 33);
  ST.config({ ignoreMobileResize: true, limitCallbacks: true });
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const wide = '(min-width: 861px)', fine = '(hover: hover) and (pointer: fine)';
  const once = (trigger, start = 'top 88%') => ({ trigger, start, once: true });
  let ctx, mm;

  const build = () => {
    ctx = g.context(() => {
      /* 1. Apertura del hero: la franja de foto se abre como un ventanal y las letras suben desde el horizonte */
      let split = null;
      if (SP) { split = SP.create('.qq', { type: 'chars', charsClass: 'ch', mask: 'chars' }); $('.qq').classList.add('is-split'); $('.qq').setAttribute('role', 'group'); }
      const letters = split ? split.chars : ['.qq'];
      g.timeline({ defaults: { ease: 'expo.out' } })
        .fromTo('.hero-photo', { clipPath: 'inset(46% 0% 46% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.7, ease: 'expo.inOut' }, 0)
        .from('.hero-img', { scale: 1.35, duration: 2.4, ease: 'power3.out' }, 0)
        .from(letters, { yPercent: 112, duration: 1.3, stagger: 0.055 }, 0.55)
        .fromTo('.don', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1 }, 0.95)
        .fromTo('.hero-foot', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1 }, 1.15);

      /* Al bajar: la foto se desplaza más lento que la página y las letras se abren hacia los costados */
      const heroTrig = { trigger: '.hero', start: 'top top', end: 'bottom 25%', scrub: 0.6, invalidateOnRefresh: true };
      g.set('.hero-pic', { scale: 1.14 });
      g.fromTo('.hero-pic', { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: heroTrig });
      if (split) g.to(split.masks, { xPercent: (i, t, a) => (i - (a.length - 1) / 2) * (matchMedia(wide).matches ? 9 : 5), ease: 'none', scrollTrigger: heroTrig });
      g.to('.don', { opacity: 0, ease: 'none', scrollTrigger: { ...heroTrig, end: 'top -20%' } });

      /* 2. Titulares: se revelan por líneas, una sola vez (se re-parten solos si cambia el ancho) */
      if (SP) $$('h2').forEach(h => SP.create(h, { type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: s => g.from(s.lines, { yPercent: 105, duration: 1.2, ease: 'expo.out', stagger: 0.09, scrollTrigger: once(h) }) }));
      $$('.hora').forEach(h => g.from(h, { opacity: 0, x: -18, duration: 1, ease: 'power3.out', scrollTrigger: once(h, 'top 92%') }));

      /* 3. La casa: el texto se enciende palabra por palabra al leer */
      if (SP) {
        const w = SP.create('.manifiesto', { type: 'words' }).words; $('.manifiesto').setAttribute('role', 'group');
        g.fromTo(w, { opacity: 0.16 }, { opacity: 1, stagger: 0.09, ease: 'none', scrollTrigger: { trigger: '.manifiesto', start: 'top 82%', end: 'bottom 55%', scrub: 0.5 } });
      }
      g.timeline({ scrollTrigger: { trigger: '.casa-body', start: 'top 85%', end: 'bottom 45%', scrub: 0.6 } })
        .fromTo('.casa-fuego img', { filter: 'grayscale(.85) brightness(.55) contrast(1.1)' }, { filter: 'grayscale(0) brightness(1) contrast(1.04)', ease: 'none' }, 0)
        .fromTo('.casa-fuego', { '--glow': 0 }, { '--glow': 1, ease: 'none' }, 0);

      /* 4. Fotografías: cada marco se abre desde un lado y la imagen se asienta (queda a 1.12 para dejar margen al parallax) */
      const settle = matchMedia(wide).matches ? 1.12 : 1.04;
      const from = { l: 'inset(0% 100% 0% 0%)', r: 'inset(0% 0% 0% 100%)', b: 'inset(100% 0% 0% 0%)' };
      $$('[data-reveal]').forEach(f => g.timeline({ scrollTrigger: once(f) })
        .fromTo(f, { clipPath: from[f.dataset.reveal] || from.b }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' })
        .fromTo($('img', f), { scale: 1.32 }, { scale: settle, duration: 1.9, ease: 'power3.out' }, 0));

      /* 5. La mesa: ASADO y PARRILLADA suben letra por letra */
      if (SP && $('#cats')) g.from(SP.create('#cats li', { type: 'chars', mask: 'chars' }).chars, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.035, scrollTrigger: once('#cats', 'top 90%') });
      if ($('#cats')) g.from('#cats', { clipPath: 'inset(0% 100% 0% 0%)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: once('#cats', 'top 90%') });

      /* 6. La peña: la escena queda fija; el ventanal de la sala se abre y la imagen se acerca */
      g.timeline({ scrollTrigger: { trigger: '.pena-scene', start: 'top top', end: 'bottom bottom', scrub: 0.8 } })
        .fromTo('.pena-bg', { clipPath: 'inset(20% 13% 30% 13%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', duration: 0.55 }, 0)
        .fromTo('.pena-bg img', { scale: 1.28 }, { scale: 1, ease: 'none', duration: 1 }, 0)
        .fromTo('.pena-dim', { opacity: 1 }, { opacity: 0.45, ease: 'none', duration: 0.7 }, 0);
      g.from('.pena-copy > *', { y: 26, opacity: 0, stagger: 0.12, duration: 1, ease: 'power3.out', scrollTrigger: once('.pena-copy', 'top 80%') });

      /* 7. Galería: las fotos entran en cadena, en lotes, sin disparar un trigger por foto */
      const figs = $$('#gallery figure');
      if (figs.length) { g.set(figs, { opacity: 0, y: 30 });
        ST.batch(figs, { start: 'top 92%', once: true, onEnter: b => g.to(b, { opacity: 1, y: 0, stagger: 0.12, duration: 1, ease: 'power3.out', overwrite: true }) }); }

      /* 8. Visita: las 04:00 suben como un contador, una sola vez; después caen los horarios */
      if (SP && $('.reloj')) g.from(SP.create('.reloj', { type: 'chars', mask: 'chars' }).chars, { yPercent: 115, duration: 1.4, ease: 'expo.out', stagger: 0.1, scrollTrigger: once('.reloj', 'top 85%') });
      g.from('.reloj-lead', { opacity: 0, y: 16, duration: 1, ease: 'power3.out', scrollTrigger: once('.reloj-lead', 'top 90%') });
      g.from('.visita-main > *, .hours div, .visita-data > *', { y: 34, opacity: 0, stagger: 0.08, duration: 1, ease: 'power3.out', scrollTrigger: once('.visita-info', 'top 78%') });

      /* 9. Contacto: el arco se abre de abajo hacia arriba y el texto llega detrás */
      g.fromTo('.contact-photo', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.7, ease: 'expo.inOut', scrollTrigger: once('.contact-photo', 'top 85%') });
      g.from('.contact-copy p, .contact-actions > *', { y: 24, opacity: 0, stagger: 0.1, duration: 1, ease: 'power3.out', scrollTrigger: once('.contact-copy', 'top 75%') });

      /* 10. Pie: la marca sube letra por letra y el resto la sigue */
      if (SP) g.from(SP.create('.footer-mark', { type: 'chars', mask: 'chars' }).chars, { yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: 0.05, scrollTrigger: once('footer', 'top 92%') });
      g.from('.footer-tag, footer li, .footer-hours', { y: 18, opacity: 0, stagger: 0.08, duration: 1, ease: 'power3.out', scrollTrigger: once('footer', 'top 80%') });

      /* Al revertir (Pausar movimiento) se devuelve el hero a su estado estático */
      return () => { $('.qq')?.classList.remove('is-split'); $('.qq')?.removeAttribute('role'); $('.manifiesto')?.removeAttribute('role'); };
    });

    /* Solo escritorio: profundidad dentro de cada marco (la imagen se mueve, el marco no: nada choca) e imanes en los botones */
    mm = g.matchMedia();
    mm.add(wide, () => {
      $$('.ph').forEach(f => { const im = $('img', f); if (im) g.fromTo(im, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: 0.5 } }); });
    });
    mm.add(fine, () => {
      const off = [];
      $$('.hero .btn, .pena .btn, .contact .btn, .footer-main li a').forEach(b => {
        const x = g.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), y = g.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
        let r; const en = () => { r = b.getBoundingClientRect(); }, mv = e => { if (!r) en(); x((e.clientX - r.left - r.width / 2) * 0.22); y((e.clientY - r.top - r.height / 2) * 0.3); }, lv = () => { r = null; x(0); y(0); };
        b.addEventListener('pointerenter', en, { passive: true }); b.addEventListener('pointermove', mv, { passive: true }); b.addEventListener('pointerleave', lv, { passive: true });
        off.push(() => { b.removeEventListener('pointerenter', en); b.removeEventListener('pointermove', mv); b.removeEventListener('pointerleave', lv); });
      });
      return () => off.forEach(f => f());
    });
    root.classList.add('gsap-ready'); root.classList.remove('anim-off');
  };

  const stop = () => { mm && mm.revert(); ctx && ctx.revert(); root.classList.remove('gsap-ready'); root.classList.add('anim-off'); };
  const start = () => { try { build(); } catch (e) { console.warn('GSAP: se mantiene el contenido estático', e); stop(); } };
  Promise.race([document.fonts ? document.fonts.ready : 0, new Promise(r => setTimeout(r, 1800))]).then(start);
  addEventListener('load', () => ST.refresh());

  /* "Pausar movimiento": revierte todo al estado estático y lo reanuda al volver a activarlo */
  $('#motion')?.addEventListener('click', () => { if (root.classList.contains('calm')) stop(); else start(); });
  /* Si la persona activa "reducir movimiento" del sistema con la página abierta, se apaga todo */
  reduce.addEventListener('change', e => { if (e.matches) stop(); });
})();
