# Dirección artística — Don Quiquiche

## Decisión

**Mesa larga / fuego vivo**: una experiencia editorial, nocturna y táctil que trata la parrilla como protagonista visual y la peña como pulso cultural. La dirección parte de las fotografías reales del local y evita inventar platos, precios o promesas no verificadas.

## Principios

- **Impacto inmediato:** hero fotográfico a sangre, titular corto y CTA visible.
- **Lujo honesto:** contraste carbón / hueso / cobre, serif de alto contraste y microcopy preciso; sin simular una marca que el negocio no tiene.
- **Composición editorial:** bloques asimétricos, numeración, líneas finas, ritmo de revista y galería tipo contact sheet.
- **Conversión clara:** reservar, consultar carta, llamar y llegar aparecen en momentos estratégicos.
- **Contenido real:** sólo se publican Ruta 39, Concepción del Uruguay, parrilla, asado, parrillada, peña, música en vivo, horarios públicos, teléfono, WhatsApp e Instagram.

## Sistema visual

- **Paleta:** carbón profundo `#10100f`, hueso `#f1eadf`, cobre brasa `#c9683d`, amarillo manteca `#e3b96a`, verde oliva apagado `#77755a`.
- **Tipografía:** Playfair Display para titulares y citas; Inter para navegación, datos y CTAs.
- **Firma:** monograma circular `DQ` + regla vertical; números de sección y etiquetas monoespaciadas.
- **Texturas:** sólo degradados CSS, líneas y máscaras; nada de recursos externos.

## Interacción

- Header que se vuelve sólido al hacer scroll.
- Entrada suave por bloques con `IntersectionObserver`.
- Scroll horizontal táctil para la galería en móvil.
- Menú móvil accesible con Escape, foco y cierre al navegar.
- Respeto a `prefers-reduced-motion` y control explícito para pausar animaciones.

## Arquitectura

Una sola página estática, SEO-friendly y sin dependencias nuevas. Se mantienen los scripts de build/check, los assets reales y los enlaces comerciales existentes. El hero usa la foto autorizada de la parrilla; la galería usa las fotos autorizadas del local y los platos.
