// Genera public/sitemap.xml a partir de las páginas fijas reales del sitio +
// los posts reales del blog (src/data/blogData.ts) -- antes era un archivo
// estático a mano, con solo 6 páginas fijas y fechas ("lastmod") de antes de
// que el dominio existiera, sin ningún post del blog incluido (bug real
// encontrado el 20 de julio). Se corre antes de `vite build` (ver
// package.json) para que cada deploy quede con el sitemap al día.
import { writeFileSync } from "node:fs";
import { BLOG_POSTS } from "../src/data/blogData";

const SITE = "https://polarisweb.studio";
const today = new Date().toISOString().slice(0, 10);

interface Entry {
  loc: string;
  lastmod: string;
  changefreq: "monthly" | "weekly" | "daily";
  priority: string;
}

const staticPages: Entry[] = [
  { loc: `${SITE}/`, lastmod: today, changefreq: "monthly", priority: "1.0" },
  { loc: `${SITE}/servicios`, lastmod: today, changefreq: "monthly", priority: "0.8" },
  { loc: `${SITE}/proceso`, lastmod: today, changefreq: "monthly", priority: "0.8" },
  { loc: `${SITE}/portafolio`, lastmod: today, changefreq: "weekly", priority: "0.9" },
  { loc: `${SITE}/nosotros`, lastmod: today, changefreq: "monthly", priority: "0.7" },
  { loc: `${SITE}/contacto`, lastmod: today, changefreq: "monthly", priority: "0.7" },
  { loc: `${SITE}/blog`, lastmod: today, changefreq: "weekly", priority: "0.8" },
  { loc: `${SITE}/cotizar`, lastmod: today, changefreq: "monthly", priority: "0.9" },
];

const blogEntries: Entry[] = BLOG_POSTS.map((post) => ({
  loc: `${SITE}/blog/${post.slug}`,
  lastmod: post.publishedAt,
  changefreq: "monthly",
  priority: "0.6",
}));

const entries = [...staticPages, ...blogEntries];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

writeFileSync(new URL("../public/sitemap.xml", import.meta.url), xml);
console.log(`sitemap.xml generado con ${entries.length} URLs (${staticPages.length} fijas + ${blogEntries.length} posts de blog).`);
