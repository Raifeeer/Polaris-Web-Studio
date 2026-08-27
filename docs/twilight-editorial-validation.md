# Validación — rediseño editorial crepuscular

| Caso | Resultado | Evidencia |
|---|---|---|
| Hero de escritorio | Gradiente crepuscular de borde a borde con horizonte abstracto, manifiesto sobre papel y una única maqueta de La Reja | Vite local, 27 de agosto de 2026 |
| Navegación | Cápsula blanca flotante, con halo sutil, logo Polaris y CTA existente | Vite local, 27 de agosto de 2026 |
| Sistema de marca | Serif de display, Inter en interfaz y `#007aff` limitado a controles y enlaces | Inspección visual y de implementación |
| Hero móvil, 390 × 844 | Cápsula, titular, texto y CTA permanecen legibles; no hay desbordamiento lateral visible | Captura local posterior a la carga |
| Compilación Vite | Correcta | `vite build` completó correctamente |
| Prueba de contrato | Correcta, 2 de 2 | `src/lib/flowContact.test.ts` |
| TypeScript | Sin errores nuevos en la rama; persisten 3 errores preexistentes fuera de la landing | `api/index.ts`, `src/App.tsx` y `src/pages/AtlasChat.tsx` |

No se modificaron rutas, precios, Firestore, endpoints, ni flujos de cotización. La revisión se realizó contra una vista estática local; no se enviaron formularios ni se realizaron operaciones de datos.

En una sesión limpia sin preferencia persistida, el aviso global de cookies cubre parte de la maqueta del hero. Es un comportamiento preexistente del consentimiento global; no se aceptó ni se descartó durante la prueba.
