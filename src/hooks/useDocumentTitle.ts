import { useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

const SITE_URL = "https://polarisweb.studio";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

function setMeta(selector: string, attr: string, content: string) {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    const [, name] = selector.match(/\[(?:name|property)="([^"]+)"\]/) || [];
    if (name) el.setAttribute(selector.startsWith('meta[property') ? "property" : "name", name);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, content);
}

interface SeoOptions {
  /** URL absoluta de la imagen para Open Graph/Twitter -- default: og-image.jpg genérico del sitio */
  image?: string;
  /** Ruta canónica real de la página (ej. "/portafolio/lumina-sky-concept") -- default: la ruta actual */
  path?: string;
}

// Actualiza el <title> de la pestaña, el meta description, y Open Graph/Twitter
// Card en cada página real -- LandingPage.tsx tiene su propia versión (basada
// en scroll-spy de sus secciones internas, no en rutas). Antes de esto, los
// tags og:*/twitter:* quedaban fijos en index.html sin importar qué página se
// compartiera -- compartir /portafolio/x por WhatsApp mostraba el título/imagen
// genérico de la home, no algo específico del proyecto.
export function useDocumentTitle(
  esTitle: string,
  enTitle: string,
  esDesc?: string,
  enDesc?: string,
  options?: SeoOptions,
) {
  const { language } = useLanguage();

  useEffect(() => {
    const title = language === "es" ? esTitle : enTitle;
    const desc = (language === "es" ? esDesc : enDesc) || "";
    const image = options?.image || DEFAULT_OG_IMAGE;
    const path = options?.path ?? window.location.pathname;
    const url = `${SITE_URL}${path === "/" ? "" : path}`;

    document.title = title;

    if (desc) {
      setMeta('meta[name="description"]', "content", desc);
      setMeta('meta[property="og:description"]', "content", desc);
      setMeta('meta[name="twitter:description"]', "content", desc);
    }

    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:image"]', "content", image);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:url"]', "content", url);
    setMeta('meta[name="twitter:image"]', "content", image);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
  }, [language, esTitle, enTitle, esDesc, enDesc, options?.image, options?.path]);
}

// Inyecta (o reemplaza) un bloque JSON-LD identificado por id -- usado para
// datos estructurados específicos de una página (ej. BlogPosting en un post
// real), separado del bloque Organization estático de index.html. Se limpia
// solo al desmontar para no dejar JSON-LD de una página vieja pegado en la
// siguiente ruta.
export function useJsonLd(id: string, data: object | null) {
  useEffect(() => {
    if (!data) return;
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);

    return () => {
      script?.remove();
    };
  }, [id, data]);
}
