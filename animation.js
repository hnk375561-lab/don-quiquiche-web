/* Capa de movimiento: GSAP + ScrollTrigger + SplitText (autoalojados en assets/vendor).
   Mejora progresiva: sin JS, con "reducir movimiento" o con "Pausar movimiento" el sitio se ve completo y sin efectos. */
(() => {
  const root = document.documentElement, g = window.gsap, ST = window.ScrollTrigger, SP = window.SplitText;
  if (!g || !ST || matchMedia('(prefers-reduced-motion: reduce)').matches) { root.classList.add('anim-off'); return; }
  g.registerPlugin(ST, ...(SP ? [SP] : []));
  ST.config({ ignoreMobileResize: true });
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const wide = '(min-width: 861px)', fine = '(hover: hover) and (pointer: fine)';
  let ctx;

  const build = () => {
    ctx = g.context(() => {
      /* 1. Apertura del hero: la franja de foto se abre como un ventanal y las letras suben desde el horizonte */
      let split = null;
      if (SP) { split = SP.create('.qq', { type: 'chars', charsClass: 'ch', mask: 'chars' }); $('.qq').classList.add('is-split'); }
      const letters = split ? split.chars : ['.qq'];
      g.timeline({ defaults: { ease: 'expo.out' } })
        .fromTo('.hero-photo', { clipPath: 'inset(46% 0% 46% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.7, ease: 'expo.inOut' }, 0)
        .from('.hero-img', { scale: 1.35, duration: 2.4, ease: 'power3.out' }, 0)
        .from(letters, { yPercent: 112, duration: 1.3, stagger: 0.055 }, 0.55)
        .fromTo('.don', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1 }, 0.95)
        .fromTo('.hero-foot', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1 }, 1.15);

      /* Al bajar: la foto se desplaza más lento que la página y las letras se abren hacia los costados */
      const heroTrig = { trigger: '.hero', start: 'top top', end: 'bottom 25%', scrub: true };
      g.set('.hero-pic', { scale: 1.14 });
      g.fromTo('.hero-pic', { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: heroTrig });
      if (split) g.to(split.masks, { xPercent: (i, t, a) => (i - (a.length - 1) / 2) * (matchMedia(wide).matches ? 9 : 5), ease: 'none', scrollTrigger: heroTrig });
      g.to('.don', { opacity: 0, ease: 'none', scrollTrigger: { ...heroTrig, end: 'top -20%' } });

      /* 2. Titulares: se revelan por líneas, una sola vez */
      if (SP) $$('h2').forEach(h => SP.create(h, { type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: s => g.from(s.lines, { yPercent: 105, duration: 1.2, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: h, start: 'top 88%', once: true } }) }));

      /* 3. La casa: el texto se enciende palabra por palabra al leer */
      if (SP) {
        const w = SP.create('.manifiesto', { type: 'words' }).words;
        g.fromTo(w, { opacity: 0.16 }, { opacity: 1, stagger: 0.09, ease: 'none', scrollTrigger: { trigger: '.manifiesto', start: 'top 82%', end: 'bottom 55%', scrub: true } });
      }

      /* 3b. La casa: el fuego se enciende al ritmo de la lectura (la foto pasa de brasa apagada a llama viva) */
      g.timeline({ scrollTrigger: { trigger: '.casa-body', start: 'top 85%', end: 'bottom 45%', scrub: true } })
        .fromTo('.casa-fuego img', { filter: 'grayscale(.85) brightness(.55) contrast(1.1)' }, { filter: 'grayscale(0) brightness(1) contrast(1.04)', ease: 'none' }, 0)
        .fromTo('.casa-fuego', { '--glow': 0 }, { '--glow': 1, ease: 'none' }, 0);

      /* 4. Fotografías: cada marco se revela desde un lado distinto y la imagen se asienta */
      const from = { l: 'inset(0% 100% 0% 0%)', r: 'inset(0% 0% 0% 100%)', b: 'inset(100% 0% 0% 0%)' };
      $$('[data-reveal]').forEach(f => g.timeline({ scrollTrigger: { trigger: f, start: 'top 88%', once: true } })
        .fromTo(f, { clipPath: from[f.dataset.reveal] || from.b }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' })
        .from($('img', f), { scale: 1.32, duration: 1.9, ease: 'power3.out' }, 0));
      $$('#gallery figure').forEach(f => g.from(f, { opacity: 0, y: 50, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: f, start: 'top 90%', once: true } }));

      /* 5. La mesa: ASADO y PARRILLADA cruzan en sentidos opuestos mientras los platos derivan a distinta velocidad */
      const cats = $$('#cats li'), mesa = { trigger: '.mesa', start: 'top 75%', end: 'bottom 25%', scrub: true };
      const sh = matchMedia(wide).matches ? 7 : 0;
      if (cats[0] && sh) g.fromTo(cats[0], { xPercent: -sh }, { xPercent: sh, ease: 'none', scrollTrigger: mesa });
      if (cats[1] && sh) g.fromTo(cats[1], { xPercent: sh }, { xPercent: -sh, ease: 'none', scrollTrigger: mesa });

      /* 6. La peña: la escena queda fija; el ventanal de la sala se abre y la imagen se acerca */
      g.timeline({ scrollTrigger: { trigger: '.pena-scene', start: 'top top', end: 'bottom bottom', scrub: true } })
        .fromTo('.pena-bg', { clipPath: 'inset(20% 13% 30% 13%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', duration: 0.55 }, 0)
        .fromTo('.pena-bg img', { scale: 1.28 }, { scale: 1, ease: 'none', duration: 1 }, 0)
        .fromTo('.pena-dim', { opacity: 1 }, { opacity: 0.45, ease: 'none', duration: 0.7 }, 0);

      /* 7. Madrugada de sábado: el reloj avanza de 20:00 a 04:00 con el scroll */
      const hh = $('.reloj .hh');
      if (hh) { const o = { v: 20 }; hh.textContent = '20';
        g.to(o, { v: 28, ease: 'none', onUpdate: () => { hh.textContent = String(Math.round(o.v) % 24).padStart(2, '0'); },
          scrollTrigger: { trigger: '.visita-clock', start: 'top top', end: 'bottom bottom', scrub: true } }); }
      g.from('.visita-main > *, .hours div, .visita-data > *', { y: 34, opacity: 0, stagger: 0.08, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.visita-info', start: 'top 75%', once: true } });
      g.fromTo('.contact-photo', { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom bottom', scrub: true } });
      g.from('.footer-mark', { yPercent: 45, opacity: 0, duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: 'footer', start: 'top 92%', once: true } });

      /* Solo escritorio: profundidad entre planos y botones magnéticos */
      g.matchMedia().add(wide, () => {
        [['.plato-a', 40, -40], ['.plato-b', -70, 80], ['.cinta', 30, -30], ['.parrillada', -40, 40], ['.duo-a', 30, -30], ['.duo-b', -40, 40], ['#gallery .g1', 30, -30], ['#gallery .g2', -60, 60], ['#gallery .g3', 40, -40]]
          .forEach(([sel, a, b]) => { const el = $(sel); if (el) g.fromTo(el, { y: a }, { y: b, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } }); });
      });
      if (matchMedia(fine).matches) $$('.hero .btn, .pena .btn, .contact .btn').forEach(b => {
        const x = g.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), y = g.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
        b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.22); y((e.clientY - r.top - r.height / 2) * 0.3); });
        b.addEventListener('pointerleave', () => { x(0); y(0); });
      });
    });
    root.classList.add('gsap-ready'); root.classList.remove('anim-off');
  };

  const start = () => { try { build(); } catch (e) { console.warn('GSAP: se mantiene el contenido estático', e); root.classList.add('anim-off'); } };
  Promise.race([document.fonts ? document.fonts.ready : 0, new Promise(r => setTimeout(r, 1800))]).then(start);
  addEventListener('load', () => ST.refresh());

  /* "Pausar movimiento": revierte todo al estado estático y lo reanuda al volver a activarlo */
  $('#motion')?.addEventListener('click', () => {
    if (root.classList.contains('calm')) { ctx && ctx.revert(); root.classList.remove('gsap-ready'); root.classList.add('anim-off'); }
    else start();
  });
})();
