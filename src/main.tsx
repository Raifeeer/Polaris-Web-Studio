import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ✦ Polaris DevTools Easter Egg
if (typeof window !== "undefined") {
  const styles = {
    logo: "color: #6366f1; font-size: 14px; font-weight: bold; font-family: monospace; line-height: 1.4;",
    brand: "color: #6366f1; font-size: 20px; font-weight: 900; font-family: system-ui; letter-spacing: 2px;",
    sub: "color: #818cf8; font-size: 11px; font-family: monospace;",
    text: "color: #94a3b8; font-size: 11px; font-family: system-ui; line-height: 1.6;",
    link: "color: #6366f1; font-size: 11px; font-family: system-ui; text-decoration: underline;",
    warn: "color: #f59e0b; font-size: 12px; font-weight: bold; font-family: monospace;",
  };

  console.log(
    `%c
    ✦         
   ✦ ✦       
  ✦   ✦      
 ✦  ·  ✦     
  ✦   ✦      
   ✦ ✦       
    ✦         
`, styles.logo);

  console.log("%cPOLARIS WEB STUDIO", styles.brand);
  console.log("%cv1.0 · Punta Cana, República Dominicana", styles.sub);
  console.log(
    "%c\n👋 Si estás viendo esto, probablemente sabes lo que haces.\n\nEste sitio está construido con React 19 + Vite 6 + Tailwind CSS 4.\nSin plantillas. Sin WordPress. Sin atajos. Solo código limpio.\n\n¿Te interesa trabajar juntos o tienes un proyecto en mente?",
    styles.text
  );
  console.log("%c→ hola@polarisweb.studio", styles.link);
  console.log("%c→ instagram.com/polariswebstudio", styles.link);
  console.log("%c→ +1 (829) 920-0544\n", styles.link);
  console.log(
    "%c⚡ Psst... escribe la secuencia secreta en cualquier página para desbloquear algo especial.",
    styles.warn
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
