# Parrilla Don Quiquiche — sitio estático
Sin dependencias (Node solo para `scripts/`). Abrir `index.html` o `python3 -m http.server`. Desplegar la carpeta en cualquier hosting estático (GitHub Pages, Netlify, etc.).
**Editar datos:** `data/site.js` (teléfono, WhatsApp, horarios, redes, categorías, carta, eventos, galería). Después de editar, correr `node scripts/build.mjs` (idempotente): valida los datos y regenera en `index.html` los enlaces, horarios, dirección, JSON-LD, canonical/OG y el sitemap desde esa misma fuente. Así el contacto y la ubicación funcionan aunque el JS falle. No editar esos bloques a mano.
## Pendientes (no inventados)
- Dominio → canonical, og:url, sitemap.xml, og:image (foto real).
- Pin oficial de Maps, "Ruta 39 y 42", horario del sábado hasta 04:00, carta oficial, fotos autorizadas/logo, agenda confirmada, delivery/reservas/estacionamiento/accesibilidad (solo directorios: no publicados).
- Email y 2.º teléfono de Todos Negocios: NO publicados. Precios de terceros: NO publicados.
- Contradicción: dossier §01 da wa.me/543442581870 (sin 9); turismo oficial da +54 9 3442 581870. Se usó 549… (formato móvil AR).
## Datos publicados
| Dato | Valor | Fuente | Conf. |
|---|---|---|---|
| Dirección | Ruta Provincial 39, C. del Uruguay | Turismo/Google | A |
| Tel/WhatsApp | 03442 58-1870 / 5493442581870 | Turismo oficial | A |
| Instagram | @parrilla.donquiquiche | Turismo oficial | A |
| Horarios | L–V 11–15/20–00; Sáb 11–04; Dom 11–15 | Directorios | B, verificar |
| Categorías | Asado, parrillada, picada, pizza, ensalada | Restaurant Guru/reseñas | B |
| Reputación | 4,1/5 (~245) al 28/09/2026 | Restaurant Guru | B, dinámico |
| Música/peña | descripción conceptual, sin agenda | Medios/directorios | B/histórico |
| Facebook | facebook.com/people/Parrilla-Don-Quiquiche/100070144780215 | Búsqueda 28/09/2026 (mismo tel. y Ruta 39) | B |

## Hallazgos nuevos (28/09/2026) — NO publicados
- Facebook, intro de la página: "Sábados, Cena Show!!" — sin fecha; no se publica periodicidad.
- quehacerenconcepcion.com.ar: "J.J Bruno y Ex Ruta 42", tel. (03442) 155-81870, "Parrillada, pastas y minutas" — tercero sin fecha (C). Refuerza que "Ruta 39 y 42" hay que verificar; pastas/minutas no se publican.
- Broccolino: "8.2 (399 reseñas)" y "precios accesibles" — escala propia de tercero, descartado.

## Cómo dejarlo listo para dominio
1. En `data/site.js`: `siteUrl` con el dominio final (https, sin barra final) y `ogImage: "assets/og.jpg"` (1200x630, foto real y autorizada).
2. `node scripts/build.mjs` → escribe canonical, og:url, og:image, sitemap.xml y robots.txt con Sitemap.
## Fotos
Hero: `hero.image` en `data/site.js`. Galería: `gallery[]`. Solo se muestran ítems con `status:"authorized"`; la sección "Fotos" aparece sola.
## Cambios de esta ronda
Fecha local (no UTC) para eventos; menú móvil con Escape/click fuera/aria dinámico; "Carta" pasa a "Consultar" mientras no exista carta oficial; render con DOM (sin HTML inyectado) y sin estilos inline; rating de terceros retirado de la UI (queda en datos); contraste de horarios corregido; JSON-LD generado desde `site.js`; validador de datos.

## Ronda V4 (auditoría 29/09/2026)
Nota: la auditoría V4 se hizo contra el `main` público, que tenía una mezcla de versiones (main.js viejo con `$('#rep')` sin elemento, sin `scripts/build.mjs`). Esta versión ya no tiene esa referencia. **Reemplazar el contenido completo del repo con este zip**, no fusionar archivo por archivo.
- JS: bloques de datos y de UI en `try/catch` independientes (si falla el render, el menú móvil sigue andando); `defer` en ambos scripts; sin dato de reputación (eliminado, no se mostraba).
- Enlaces, horarios, dirección y año quedan como HTML estático generado por el build (sin JS siguen funcionando).
- Contraste WCAG AA: eyebrow sobre crema `#a33a21`, hover del botón primario `#a83a20`. El textura de ruido del hero solo en pantallas ≥ 56rem.
- "Carta": aria-label "Consultar la carta por WhatsApp" mientras no haya carta oficial.
- No se agregó manifest/PWA ni 404 (la auditoría los marca como innecesarios/baja prioridad).

## Ronda "Auditoría final" (29/09/2026)
- CTA del hero: "Consultar disponibilidad" (no afirma un sistema de reservas). Mensaje de WhatsApp acorde.
- Textos de horarios y carta sin exponer la fuente de terceros al visitante; la trazabilidad queda en `data/site.js` y en este README.
- `assets/apple-touch-icon.png` (180x180) agregado. Preload del hero: el build lo agrega solo cuando `hero.image` está autorizado.
- Sin cambios en datos: nada de email, segundo teléfono, delivery, reservas, precios ni agenda.

## Verificaciones (todas reales, sin dependencias)
`node scripts/build.mjs` — valida datos y sincroniza HTML/SEO/robots/sitemap (idempotente; sale con código ≠ 0 si hay datos inválidos).
`node scripts/check.mjs` — falla si encuentra: HTML inyectado en main.js, estilos inline, fecha UTC, restos de `#rep`/reputación, placeholders de dominio, anclas rotas o archivos referenciados que no existen.
