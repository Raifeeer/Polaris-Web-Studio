// Genera dist/local-lift-static.html a partir del dist/index.html real ya
// construido -- reusa los mismos tags de script/CSS que Vite acaba de
// emitir (con sus hashes reales), pero con <title>/meta/OG específicos de
// Local Lift y un snapshot de texto real dentro de #root.
//
// Por qué existe: este sitio es una SPA (Vite + React, createRoot().render(),
// sin SSR) -- todas las rutas sirven el MISMO index.html estático, así que
// cualquier bot que no ejecute JS (el verificador de marca OAuth de Google,
// entre otros) ve siempre el mismo <title>/<meta description> genéricos de
// la agencia, sin importar qué ruta pida. Encontrado en vivo el 15 de
// agosto: Google rechazó la verificación de "Información de la marca"
// citando "En la página principal, no se explica el propósito de la app" --
// cambiar la URL de /  a /local-lift no tuvo ningún efecto porque ambas
// devuelven exactamente el mismo HTML crudo.
//
// createRoot(...).render() (no hydrateRoot) hace un render de cliente
// normal, así que no hay riesgo de "hydration mismatch": React simplemente
// reemplaza el contenido de #root en cuanto el bundle carga, sin importar
// qué había ahí antes -- el snapshot estático de abajo solo lo ve un bot
// sin JS o el usuario en la fracción de segundo antes de que hidrate.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distIndexPath = resolve(__dirname, "../dist/index.html");
const outPath = resolve(__dirname, "../dist/local-lift-static.html");

const built = readFileSync(distIndexPath, "utf-8");

const scriptMatch = built.match(/<script type="module"[^>]*><\/script>/);
const preloadMatches = built.match(/<link rel="modulepreload"[^>]*>/g) || [];
const stylesheetMatch = built.match(/<link rel="stylesheet"[^>]*index-[^"]*\.css"[^>]*>/);

if (!scriptMatch || !stylesheetMatch) {
  throw new Error("[prerender-local-lift] No pude extraer los tags de script/CSS reales de dist/index.html -- revisa si vite cambió el formato de salida.");
}

const assetTags = [scriptMatch[0], ...preloadMatches, stylesheetMatch[0]].join("\n    ");

const title = "Polaris Local Lift | Más visibilidad y conversaciones en 48 horas";
const description =
  "Polaris Local Lift optimiza tu Google Business Profile, Google Maps y WhatsApp en 48 horas: diagnóstico gratis con datos reales de tu ficha, y un paquete completo de contenido (publicaciones, respuestas a reseñas, mensajes de seguimiento) listo para usar.";

const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="https://polarisweb.studio/local-lift" />

    <link rel="preconnect" href="https://api.fontshare.com" />
    <link rel="preconnect" href="https://cdn.fontshare.com" crossorigin />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,500,700,400,900&f[]=satoshi@900,700,500,300,400&display=swap" media="print" onload="this.media='all'" />

    <link rel="icon" type="image/svg+xml" sizes="any" href="/favicon.svg?v=3" />
    <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png?v=1" />
    <link rel="shortcut icon" href="/favicon.ico?v=1" />

    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://polarisweb.studio/local-lift" />
    <meta property="og:site_name" content="Polaris Web Studio" />
    <meta property="og:locale" content="es_DO" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="https://polarisweb.studio/og-image.jpg" />

    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="https://polarisweb.studio/og-image.jpg" />

    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "Polaris Local Lift",
        "provider": { "@type": "Organization", "name": "Polaris Web Studio", "url": "https://polarisweb.studio" },
        "areaServed": ["Dominican Republic", "Worldwide"],
        "description": ${JSON.stringify(description)},
        "offers": { "@type": "Offer", "priceCurrency": "USD", "price": "99", "availability": "https://schema.org/InStock" }
      }
    </script>

    <script>
      (function () {
        try {
          var saved = localStorage.getItem('polaris-theme');
          var theme = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
          if (theme === 'light') document.documentElement.classList.add('light');
        } catch (e) {}
      })();
    </script>
    <style>
      html { background-color: #020617; }
      html.light { background-color: #f8fafc; }
      body { margin: 0; background-color: #020617; color: #e2e8f0; font-family: 'Satoshi', system-ui, sans-serif; }
      html.light body { background-color: #f8fafc; color: #0f172a; }
      .ll-snap h1 { font-family: 'Cabinet Grotesk', system-ui, sans-serif; }
      .ll-snap li::marker { color: #16C8C1; }
      .ll-snap .ll-snap-p1 { color: #cbd5e1; }
      .ll-snap .ll-snap-ul { color: #e2e8f0; }
      .ll-snap .ll-snap-p2 { color: #94a3b8; }
      html.light .ll-snap .ll-snap-p1 { color: #374151; }
      html.light .ll-snap .ll-snap-ul { color: #1f2937; }
      html.light .ll-snap .ll-snap-p2 { color: #6b7280; }
    </style>
    ${assetTags}
  </head>
  <body>
    <div id="root">
      <main class="ll-snap" style="max-width: 760px; margin: 0 auto; padding: 56px 24px;">
        <img src="/brand/local-lift-lockup-horizontal-dark.svg" alt="Local Lift by Polaris Web Studio" style="height: 40px; width: auto; margin-bottom: 32px;" />
        <h1 style="font-weight: 800; font-size: 40px; line-height: 1.1; letter-spacing: -0.02em; margin: 0 0 20px;">Haz que tu ficha de Google ayude a decidir.</h1>
        <p class="ll-snap-p1" style="font-size: 17px; line-height: 1.7; margin: 0 0 28px;">Tus clientes ya te están buscando. Polaris Local Lift organiza tu presencia en Google y WhatsApp en 48 horas para que tus clientes entiendan qué ofreces, dónde estás y cómo contactarte.</p>
        <ul class="ll-snap-ul" style="list-style: disc; padding-left: 20px; margin: 0 0 28px; display: flex; flex-direction: column; gap: 14px; font-size: 15px; line-height: 1.6;">
          <li><strong style="color: #16C8C1;">Diagnóstico Express</strong> (24 horas) -- revisión de tu ficha de Google/Maps y WhatsApp, cinco problemas prioritarios, y un plan de acción de 7 días.</li>
          <li><strong style="color: #16C8C1;">Impulso</strong> -- auditoría completa, descripción y servicios reescritos, 10 publicaciones listas, respuestas personalizadas a tus reseñas reales, y 10 mensajes de WhatsApp de seguimiento.</li>
          <li><strong style="color: #16C8C1;">Ascenso</strong> -- todo lo de Impulso, más implementación asistida de los cambios que autorices.</li>
        </ul>
        <p class="ll-snap-p2" style="font-size: 15px; line-height: 1.7; margin: 0;">Si conectas tu cuenta de Google Business Profile, con tu autorización explícita en cada caso, publicamos el contenido aprobado directamente en tu ficha o respondemos tus reseñas en tu nombre.</p>
      </main>
    </div>
  </body>
</html>
`;

writeFileSync(outPath, html);
console.log(`[prerender-local-lift] Generado ${outPath}`);
