# Validación — Polaris / Auros orbital

| Caso | Resultado | Evidencia |
|---|---|---|
| Carga de la landing | El cargador inicial completó y la ruta raíz mostró la variante orbital | Vite local, 27 de agosto de 2026 |
| Hero de escritorio | El orbe de partículas, anillos y trayectorias aparece como elemento de firma sobre el canvas espacial de Polaris | Revisión visual en `http://localhost:5173/` |
| Jerarquía | Titular, texto secundario y CTA mantienen contraste; el degradado azul → hielo → violeta se limita a la acción principal | Revisión visual local |
| Contenido | Las rutas a cotización, servicios, portafolio, proceso, Local Lift y Polaris Flow se mantienen presentes | Revisión de contenido renderizado |
| Compilación Vite | Correcta | `vite build` completó en el entorno recuperado |
| Prueba de contrato | Correcta, 2 de 2 | `src/lib/flowContact.test.ts` |
| TypeScript | Sin errores nuevos de la variante; persisten 3 errores preexistentes fuera de la landing | `api/index.ts`, `src/App.tsx` y `src/pages/AtlasChat.tsx` |
| Móvil | La captura móvil automatizada queda pendiente; los breakpoints base, `sm`, `md` y `lg` fueron revisados en el código | Se requiere confirmación visual desde la vista previa |

La verificación se realizó en una vista local estática. No se enviaron formularios, no se escribieron datos y no se usaron servicios externos.
