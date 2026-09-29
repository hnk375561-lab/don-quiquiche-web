/* ÚNICA fuente de datos editable. Cada dato: status + fuente (ver README). */
window.SITE = {
  siteUrl: null, // PENDIENTE: dominio final, ej. "https://dominio.com.ar" (sin barra final). Con esto `node scripts/build.mjs` genera canonical, og:url, sitemap y robots.
  ogImage: null, // PENDIENTE: ruta a imagen 1200x630 real y autorizada, ej. "assets/og.jpg"
  hero: { image: null }, // opcional: {src,w,h,alt,status:"authorized"}; si no hay, se usa el hero CSS
  // SEO / redes: el build genera <title>, description, og:* y twitter:* desde acá (no editar index.html a mano)
  title: "Parrilla Don Quiquiche | Parrilla y Peña en Concepción del Uruguay",
  description: "Parrilla Don Quiquiche en Concepción del Uruguay. Ambiente familiar, parrilla y espíritu de peña sobre Ruta 39. Consultá horarios y cómo llegar.",
  socialDescription: "Parrilla, mesa y música en Ruta 39. Concepción del Uruguay, Entre Ríos.",
  locale: "es_AR",
  ogType: "website", // "restaurant" no es un tipo OG válido (sería "restaurant.restaurant" con propiedades extra); el tipo de negocio ya está en el JSON-LD
  name: "Parrilla Don Quiquiche",
  fullName: "Parrilla Don Quiquiche, Ambiente Familiar, Peña",
  address: "Ruta Provincial 39, Concepción del Uruguay, Entre Ríos", // A (turismo/Google). "Ruta 39 y 42": PENDIENTE
  phone: "+543442581870", phoneLabel: "03442 58-1870",              // A
  whatsapp: "5493442581870",                                        // A (turismo oficial: +54 9 3442 581870)
  waMessages: {
    general: "Hola, quería hacer una consulta sobre Parrilla Don Quiquiche.",
    reserva: "Hola, quería consultar disponibilidad en Parrilla Don Quiquiche.",
    carta: "Hola, ¿me pasan la carta actual de Parrilla Don Quiquiche?",
    eventos: "Hola, quería consultar por las próximas fechas de música en Parrilla Don Quiquiche."
  },
  instagram: "https://www.instagram.com/parrilla.donquiquiche/", instagramHandle: "@parrilla.donquiquiche", // A
  facebook: null, // DQ-005: medida cautelar. Hay 3 URLs de Facebook (…/people/…/100070144780215 con ~45 likes; profile.php?id=100063776400477 con ~1.200; /pages/…/459810217427465). PENDIENTE: que el dueño indique la oficial.
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Parrilla+Don+Quiquiche+Concepcion+del+Uruguay", // B: pin oficial PENDIENTE
  hoursStatus: "public-source", // B: coincidencia en directorios, sin confirmación del negocio
  hours: [
    ["Lunes a viernes", "11:00–15:00 · 20:00–00:00"],
    ["Sábado", "11:00–04:00"],
    ["Domingo", "11:00–15:00"]
  ],
  categories: ["Asado", "Parrillada"], // B (reseñas). NO es carta. Picada/Pizza/Ensalada (solo directorios) retiradas de la UI hasta tener la carta (DQ-021); reponerlas si el dueño las confirma.
  menu: { url: null, items: [] },     // PENDIENTE: carta oficial. Si menu.url existe, "Ver carta" abre ese recurso.
  events: [ /* {date:"YYYY-MM-DD", time:"21:00", artist:"...", status:"confirmed"} — solo confirmed + futuras se muestran */ ],
  gallery: [ /* {src:"assets/x.webp", w:1200, h:800, alt:"...", caption:"(opcional) leyenda", credit:"(opcional) fotógrafo", authorizedBy:"quién autorizó", authorizedAt:"YYYY-MM-DD", status:"authorized"} — solo authorized */ ],
  // DQ-031: trazabilidad por dato. status: unverified | public-source | confirmed-by-business. Nada está confirmado por el negocio todavía.
  verification: {
    phone:     { status: "public-source", source: "Turismo oficial, Facebook, prensa local", updatedAt: "2026-09-29", verifiedBy: null },
    whatsapp:  { status: "unverified",    source: "Turismo oficial (formato con 9); falta probar que responde", updatedAt: "2026-09-29", verifiedBy: null },
    address:   { status: "public-source", source: "Turismo/Google; prensa local dice \"Ruta 39 y 42\" (pendiente)", updatedAt: "2026-09-29", verifiedBy: null },
    hours:     { status: "public-source", source: "Directorios; sábado 11:00–04:00 ambiguo", updatedAt: "2026-09-29", verifiedBy: null },
    instagram: { status: "public-source", source: "Turismo oficial", updatedAt: "2026-09-29", verifiedBy: null },
    facebook:  { status: "unverified",    source: "3 URLs distintas; oculto hasta confirmar", updatedAt: "2026-09-29", verifiedBy: null },
    categories:{ status: "public-source", source: "Reseñas (asado, parrillada)", updatedAt: "2026-09-29", verifiedBy: null }
  }
};
