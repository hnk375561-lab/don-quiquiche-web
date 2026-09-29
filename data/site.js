/* ÚNICA fuente de datos editable. Cada dato: status + fuente (ver README). */
window.SITE = {
  siteUrl: null, // PENDIENTE: dominio final, ej. "https://dominio.com.ar" (sin barra final). Con esto `node scripts/build.mjs` genera canonical, og:url, sitemap y robots.
  ogImage: null, // PENDIENTE: ruta a imagen 1200x630 real y autorizada, ej. "assets/og.jpg"
  hero: { image: null }, // opcional: {src,w,h,alt,status:"authorized"}; si no hay, se usa el hero CSS
  name: "Parrilla Don Quiquiche",
  fullName: "Parrilla Don Quiquiche, Ambiente Familiar, Peña",
  address: "Ruta Provincial 39, Concepción del Uruguay, Entre Ríos", // A (turismo/Google). "Ruta 39 y 42": PENDIENTE
  phone: "+543442581870", phoneLabel: "03442 58-1870",              // A
  whatsapp: "5493442581870",                                        // A (turismo oficial: +54 9 3442 581870)
  waMessages: {
    general: "Hola, quería hacer una consulta sobre Parrilla Don Quiquiche.",
    reserva: "Hola, quería consultar por una reserva en Parrilla Don Quiquiche.",
    carta: "Hola, ¿me pasan la carta actual de Parrilla Don Quiquiche?",
    eventos: "Hola, quería consultar por las próximas fechas de música en Parrilla Don Quiquiche."
  },
  instagram: "https://www.instagram.com/parrilla.donquiquiche/", instagramHandle: "@parrilla.donquiquiche", // A
  facebook: "https://www.facebook.com/people/Parrilla-Don-Quiquiche/100070144780215/", // B: página encontrada en búsqueda 28/09/2026; mismo teléfono y "Ruta 39". Turismo oficial cita "Facebook: Parrilla Don Quiquiche"
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Parrilla+Don+Quiquiche+Concepcion+del+Uruguay", // B: pin oficial PENDIENTE
  hoursStatus: "public-source", // B: coincidencia en directorios, sin confirmación del negocio
  hours: [
    ["Lunes a viernes", "11:00–15:00 · 20:00–00:00"],
    ["Sábado", "11:00–04:00"],
    ["Domingo", "11:00–15:00"]
  ],
  categories: ["Asado", "Parrillada", "Picada", "Pizza", "Ensalada"], // B (Restaurant Guru/reseñas). NO es carta.
  menu: { url: null, items: [] },     // PENDIENTE: carta oficial. Si menu.url existe, "Ver carta" abre ese recurso.
  events: [ /* {date:"YYYY-MM-DD", time:"21:00", artist:"...", status:"confirmed"} — solo confirmed + futuras se muestran */ ],
  gallery: [ /* {src:"assets/x.webp", w:1200, h:800, alt:"...", credit:"...", status:"authorized"} — solo authorized */ ],
  reputation: { /* solo interno: NO se muestra en el sitio (dato de tercero, dinámico) */ text: "4,1/5 en Google (≈245 reseñas)", source: "Restaurant Guru", date: "28/09/2026" } // B, dinámico
};
