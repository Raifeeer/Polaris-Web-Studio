import { useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

// Actualiza el <title> de la pestaña y el meta description en cada página real
// (LandingPage.tsx tiene su propia versión, basada en scroll-spy de sus
// secciones internas, no en rutas -- esta es la que usa el resto de las
// páginas, cada una con su propio título/descripción fijo por ruta).
export function useDocumentTitle(esTitle: string, enTitle: string, esDesc?: string, enDesc?: string) {
  const { language } = useLanguage();

  useEffect(() => {
    document.title = language === "es" ? esTitle : enTitle;

    if (esDesc && enDesc) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", language === "es" ? esDesc : enDesc);
    }
  }, [language, esTitle, enTitle, esDesc, enDesc]);
}
