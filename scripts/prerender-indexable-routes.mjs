// Genera un HTML de entrada por cada URL pública del sitemap.
// La app sigue siendo una SPA y React mantiene la metadata dinámica al navegar,
// pero Google recibe también canonical/og:url correctos en el HTML inicial de
// cada ruta, antes de ejecutar JavaScript.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, posix } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteUrl = "https://polarisweb.studio";
const sitemapPath = resolve(__dirname, "../public/sitemap.xml");
const distIndexPath = resolve(__dirname, "../dist/index.html");
const sitemap = readFileSync(sitemapPath, "utf8");
const built = readFileSync(distIndexPath, "utf8");
const urls = [...sitemap.matchAll(/<loc>(https:\/\/polarisweb\.studio[^<]*)<\/loc>/g)].map((match) => match[1].trim());

if (!urls.length) {
  throw new Error("[prerender-indexable-routes] sitemap.xml no contiene URLs de Polaris");
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function routeHtml(pageUrl) {
  const parsed = new URL(pageUrl);
  const pathname = parsed.pathname || "/";
  const canonical = `${siteUrl}${pathname === "/" ? "" : pathname}`;
  const canonicalTag = `<link rel="canonical" href="${escapeHtml(canonical)}" />`;
  const ogUrlTag = `<meta property="og:url" content="${escapeHtml(canonical)}" />`;
  const twitterUrlTag = `<meta property="twitter:url" content="${escapeHtml(canonical)}" />`;

  let html = built;
  html = html.replace(/\s*<link rel="canonical" href="[^"]*"\s*\/?>/g, "");
  html = html.replace(/\s*<meta property="og:url" content="[^"]*"\s*\/?>/g, "");
  html = html.replace(/\s*<meta property="twitter:url" content="[^"]*"\s*\/?>/g, "");
  return html.replace("</head>", `    ${canonicalTag}\n    ${ogUrlTag}\n    ${twitterUrlTag}\n  </head>`);
}

let generated = 0;
for (const pageUrl of urls) {
  const pathname = new URL(pageUrl).pathname || "/";
  if (pathname === "/") continue;
  if (pathname.includes("..") || pathname.includes("//")) {
    throw new Error(`[prerender-indexable-routes] ruta no segura: ${pathname}`);
  }
  const outPath = resolve(__dirname, "../dist", `.${pathname}`, "index.html");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, routeHtml(pageUrl));
  generated += 1;
}

writeFileSync(distIndexPath, routeHtml(`${siteUrl}/`));
console.log(`[prerender-indexable-routes] Generados ${generated + 1} HTML de entrada para ${urls.length} URLs públicas.`);
