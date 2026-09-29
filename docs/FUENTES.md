# Fuentes, hallazgos y pendientes (documento interno)

Nada de lo que sigue está confirmado por el negocio. Clasificación: A = fuente pública oficial · B = directorio/prensa/reseñas · C = tercero de baja confianza.
Auditoría completa del 29/09/2026: ver informe de auditoría (fuera del repo). El "dossier §01" citado en versiones anteriores no está en este repositorio.

## Datos publicados en el sitio
| Dato | Valor | Fuente | Conf. |
|---|---|---|---|
| Dirección | Ruta Provincial 39, C. del Uruguay | Turismo/Google | A (incompleta) |
| Tel/WhatsApp | 03442 58-1870 / 5493442581870 | Turismo oficial | A (WhatsApp sin probar) |
| Instagram | @parrilla.donquiquiche | Turismo oficial | A |
| Horarios | L–V 11–15/20–00; Sáb 11–04; Dom 11–15 | Directorios | B, verificar (sábado ambiguo) |
| Categorías | Asado, parrillada | Reseñas | B |
| Música | "suele haber música en vivo en distintas ocasiones" | Prensa local 2019–2025 | B |

## Retirado o no publicado (y por qué)
- **Facebook**: enlace oculto (`facebook: null`). Existen 3 URLs: `/people/Parrilla-Don-Quiquiche/100070144780215/` (~45 likes), `profile.php?id=100063776400477` (~1.200 likes) y `/pages/Parrilla Don Quiquiche/459810217427465/`. Falta saber cuál es la oficial.
- **Picada, pizza, ensalada**: solo aparecen en directorios; retiradas de la UI hasta tener carta.
- **"Encuentros culturales"**: sin evidencia hallada; retirado.
- **"Las próximas fechas se anuncian en Instagram"** y **"pedí la carta por WhatsApp"**: no verificados; reformulados.
- **Reputación**: no se muestra. Restaurant Guru muestra 3,8/5 (251 reseñas, mayo 2026) y cita 4,1 como puntaje de usuarios de Google. No mezclar ambas cifras; la versión anterior de este README atribuía 4,1 a Restaurant Guru (error).
- Broccolino "8,2 (399)" (escala propia) y "precios accesibles": descartados.
- quehacerenconcepcion.com.ar: "Parrillada, pastas y minutas" (C): no se publica.
- Email y 2.º teléfono de directorios: no publicados.
- Facebook "Sábados, Cena Show!!" (sin fecha) y "estamos trabajando con delivery" (sin fecha): no se publican.
- Prensa local 2019–oct 2025 (El Miércoles Digital): actuaciones pasadas, no son agenda vigente.

## Pendientes para el dueño
- Nombre oficial (corto/largo), dirección completa ("Ruta 39 y 42": cruce, número o km, CP), pin oficial de Maps.
- Horarios: sábado corrido o dos turnos, feriados, cocina vs. salón.
- Reservas (una nota de prensa de mayo 2025 cita "Reservas 03442 15581870"), WhatsApp activo, delivery, pagos, estacionamiento, accesibilidad.
- Carta vigente con fecha, fotos autorizadas, logo, agenda, Facebook oficial, ficha de Google.
- Dominio → canonical, og:url, sitemap, og:image.
- Contradicción WhatsApp: con 9 (549…) vs. sin 9; se usa 549… (formato móvil AR).
- Al confirmar datos, actualizar `verification` y, si corresponde, relajar a propósito la lista de campos "prohibidos" del JSON-LD en `scripts/check.mjs` (geo, horarios, menú, etc.).

## Fotos
Hero, og.jpg y 5 fotos de galería (parrilla, salón con música, baile, 2 platos) provienen de la página de Facebook del local, descargadas por el desarrollador. **PENDIENTE: OK escrito del dueño** para publicarlas; al tenerlo, completar `authorizedBy`/`authorizedAt` en `data/site.js` (hoy el build avisa). Se optimizaron y se les quitaron los metadatos. Hay una foto de comensales de cerca (no usada) por privacidad. Para la versión final conviene pedir los originales.

## Historial de cambios
- Ronda 29/09/2026 (4): rediseño del hero (badge de ubicación, estado "Abierto ahora" calculado desde `schedule`, CTA "Reservar mesa por WhatsApp", "Ver carta y menú", franja de confianza), tipografías Playfair Display + Inter, naranja #ea580c con texto oscuro (AA). PENDIENTE confirmar: que se tomen reservas, horarios (sábado), y el texto de la franja.
- Ronda 29/09/2026 (3): demo visual (brasas, llama, cinta, íconos, luces de escenario) y fotos reales integradas.
- Ronda 29/09/2026 (aplicación de la auditoría): Facebook oculto; copy prudente (sin "carta" en meta, sin "encuentros culturales", sin afirmar Instagram/WhatsApp); H1 con espacio; se quitó el trío decorativo duplicado; botón "Llamar" en hero y barra móvil; mensaje de peña visible sin JavaScript; favicon limpio de metadatos C2PA (sigue siendo provisorio, no es el logo del negocio); esquemas de eventos/galería ampliados y bloque `verification`.
- Ronda 29/09/2026 (2): `404.html` (noindex, autónoma, sincronizada por el build y verificada por `check`); bloque "Antes de venir" alimentado por `practical`, que solo publica datos confirmados por el negocio (con responsable y fecha); validación y avisos para ítems sin confirmar.
- Rondas anteriores: fecha local para eventos; menú móvil accesible; render con DOM; JSON-LD generado; validador de datos; contraste AA; `apple-touch-icon.png`.
