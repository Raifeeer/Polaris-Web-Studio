# Validación — Polaris en dirección Mercury

| Caso | Resultado | Evidencia |
|---|---|---|
| Hero de escritorio | Imagen real de La Reja a pantalla completa, capa onyx y copy centrado sobre navegación transparente | Vite local, 27 de agosto de 2026 |
| Sistema de superficies | Fondo `#171721`, tarjetas `#1e1e2a`, controles en píldora y sin sombras decorativas | Inspección visual local |
| Jerarquía de contenido | Introducción, servicios, portafolio y proceso mantienen contraste y separación por material, no por colores brillantes | Revisión de las primeras secciones |
| Compilación Vite | Correcta | `vite build` completó correctamente |
| Prueba de contrato | Correcta, 2 de 2 | `src/lib/flowContact.test.ts` |
| TypeScript | Sin errores nuevos de la rama; persisten 3 errores preexistentes fuera de la landing | `api/index.ts`, `src/App.tsx` y `src/pages/AtlasChat.tsx` |
| Revisión móvil | La captura aislada no terminó dentro de 90 s; las clases responsive fueron revisadas en código | Pendiente de una inspección manual en la vista previa |
| Vista previa Vercel | Lista y vinculada al commit Mercury de la rama experimental | `dpl_AEf4t6UMWKfWQ3vssxrMyAqdxWVZ`, estado READY |

No se modificaron rutas, precios, Firestore, endpoints ni flujos de cotización. Las pruebas se realizaron sobre una vista estática local, sin envíos de formularios ni operaciones de datos.
