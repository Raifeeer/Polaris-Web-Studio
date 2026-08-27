# Validación — experimento de landing inmersiva

| Caso | Resultado | Evidencia |
|---|---|---|
| Hero de escritorio | Ocupa el viewport completo, sin contenedor centrado ni radio exterior | `http://localhost:5173/` en la rama `experiment/fullscreen-landing` |
| Navegación | Cambia a barra de borde a borde dentro de la home experimental; conserva logo, Atlas, menú y CTA | Captura de escritorio, 27 de agosto de 2026 |
| CTA principal | Conserva el destino existente `/cotizar` | Inspección de elementos interactivos, sin activar el flujo |
| Contenido comercial | Servicios, proceso, portafolio, inversión, ecosistema, FAQ y CTA final permanecen en la nueva composición | Árbol accesible de la landing |
| Servicios | Tres capacidades a ancho completo, separadas con divisores; sin contenedores de tarjeta | Revisión tras el hero |
| Propuesta de valor | Escena de contraste índigo a pantalla completa, con retícula y tres principios operativos | Revisión de la segunda escena |
| Hero móvil, 390 × 844 | Titular, navegación y CTA son legibles; no hay desbordamiento lateral visible | Captura local posterior a la carga |
| Ruta existente `/flow` | Carga y conserva su experiencia comercial y CTAs de Office Flow | Navegación local en la rama experimental |
| Consola del cliente | Sin errores detectados durante la carga de la landing | Revisión de consola de Vite |
| Compilación Vite | Correcta | `vite build` completó en 12.66 s |
| Prueba de contrato | Correcta, 2 de 2 | `src/lib/flowContact.test.ts` |
| TypeScript | Sin errores nuevos de la rama; persisten 3 errores preexistentes fuera de la landing | `api/index.ts`, `src/App.tsx` y `src/pages/AtlasChat.tsx` |

La revisión se realizó contra Vite estático. No se inició el backend, no se enviaron formularios y no se hicieron cambios de datos, pagos ni Firestore.

En una sesión móvil sin preferencia previa, el aviso global de cookies se superpone a los CTA inferiores del hero. Es un comportamiento preexistente de consentimiento global; no se aceptó ni descartó durante la comprobación.
