# Parrilla Don Quiquiche — sitio estático

El sitio no tiene dependencias en producción (las de `package.json` son solo para `npm run audit`). Abrir `index.html` o `npm start` (`python3 -m http.server 8080`). Desplegar la carpeta en cualquier hosting estático.

**Editar datos:** solo `data/site.js` (title, description, teléfono, WhatsApp, horarios, redes, categorías, carta, eventos, galería). Después correr:

```
npm run build   # valida data/site.js (URLs solo https, assets locales, esquema por campo) y regenera lo que está entre markers BUILD en index.html + robots/sitemap
npm run check   # verifica que index.html está EXACTAMENTE sincronizado con data/site.js + SEO, rel, IDs, accesibilidad básica, JSON-LD
npm run audit   # (opcional) navegador real: responsive, axe-core WCAG 2.2 AA, contraste por píxeles, teclado
```

`npm run audit` no forma parte del sitio: `npm i -D playwright axe-core && npx playwright install chromium` una sola vez.

**Markers BUILD en `index.html`** (el build solo reemplaza lo que está entre `<!--BUILD:X-->` y `<!--/BUILD:X-->`; el resto del HTML es tuyo):
`SEO`, `LD`, `STATIC_HOURS`, `STATIC_ADDRESS`, `STATIC_CATEGORIES`, `STATIC_YEAR`, `STATIC_PRACTICAL`, `STATIC_PRACTICAL_NAV` y `STATIC_LINK`. `404.html` usa solo `STATIC_LINK` (el build la sincroniza también). Los enlaces críticos se declaran así y el build genera el `<a>` completo (href, target, rel, aria-label):

```html
<!--BUILD:STATIC_LINK kind="wa" val="reserva" class="btn btn-p" label="Consultar por WhatsApp"--><!--/BUILD:STATIC_LINK-->
```
`kind`: `home`, `wa` (con `val` = clave de `waMessages`), `map`, `ig`, `fb`, `tel`, `menu` (con `label` y `alt`). `wrap="li"` lo envuelve en `<li>`. Si el dato es `null` (p. ej. `facebook`), el enlace desaparece del HTML.

## Fotos
Hero: `hero.image` en `data/site.js`. Galería: `gallery[]`. Solo se muestran ítems con `status:"authorized"`; la sección "Fotos" aparece sola. Campos opcionales: `caption` (leyenda), `credit` (fotógrafo), `authorizedBy`, `authorizedAt`.

## Dominio
1. En `data/site.js`: `siteUrl` con el dominio final (https, sin barra final) y `ogImage: "assets/og.jpg"` (1200x630, foto real y autorizada).
2. `node scripts/build.mjs` → escribe canonical, og:url, og:image, sitemap.xml y robots.txt con Sitemap.

## "Antes de venir" (pagos, estacionamiento, accesibilidad, niños, mascotas…)
Lista `practical` en `data/site.js`. Cada ítem: `{ label, text, status, verifiedBy, updatedAt }`. **Solo se publican los ítems con `status: "confirmed-by-business"`**, que exigen `verifiedBy` y `updatedAt`. Mientras no haya ninguno, la sección y su enlace del menú no existen. Se genera como HTML estático (funciona sin JavaScript).

## Página 404
`404.html` es autónoma (estilos propios, sin rutas relativas), `noindex`, con enlaces a inicio, teléfono y WhatsApp generados por el build. El enlace "Volver al inicio" usa `siteUrl` si está definido; si no, `/`. Al desplegar en una subcarpeta sin dominio propio, ese enlace debe ajustarse.

## Trazabilidad de datos
El bloque `verification` de `data/site.js` registra estado (`unverified` · `public-source` · `confirmed-by-business`), fuente y fecha por dato. Hoy ningún dato está confirmado por el negocio. Fuentes, hallazgos y pendientes: ver [`docs/FUENTES.md`](docs/FUENTES.md).

## Verificaciones
`node scripts/build.mjs` valida datos y sincroniza HTML/SEO/robots/sitemap (idempotente; falla si hay datos inválidos).
`node scripts/check.mjs` falla ante HTML inyectado en main.js, estilos inline, fecha UTC, restos de reputación, placeholders, anclas rotas, archivos inexistentes, desincronía con `site.js`, JSON-LD inválido.
