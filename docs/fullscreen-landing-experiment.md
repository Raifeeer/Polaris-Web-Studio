# Experimento de landing inmersiva — Polaris Web Studio

## Propósito

Esta rama prueba una landing que se comporta como una secuencia de escenas de pantalla completa, no como una colección de tarjetas dentro de un contenedor. La experiencia mantiene la identidad de Polaris, el contenido comercial y los destinos existentes de cada CTA.

## Dirección: "Órbita de precisión"

La landing se construye sobre un fondo espacial azul noche, con índigo de marca, blanco frío y destellos cian usados como señales funcionales. Cabinet Grotesk mantiene el impacto de los titulares; Satoshi conserva la lectura operativa. El elemento distintivo es una **retícula orbital**: líneas finas, índices de capítulo y recorridos lumínicos que conectan las escenas sin convertirlas en decoración arbitraria.

| Rol | Decisión |
|---|---|
| Composición | Escenas full-bleed de al menos una altura de viewport; sin borde ni radio exterior. |
| Jerarquía | Titulares muy grandes, copy breve y CTAs persistentes por escena. |
| Espacio | Retícula editorial, divisores de 1 px y márgenes interiores responsive, no tarjetas centradas. |
| Movimiento | Transformaciones y opacidad breves; sin blur de fondo ni animación continua que afecte dispositivos móviles. |
| Accesibilidad | Contraste alto, foco visible, targets táctiles amplios y reducción de movimiento respetada. |

## Wireframe de escenas

```text
01 / HERO        Mensaje de impacto + CTA + escena 3D de fondo
02 / SERVICIOS   Tres columnas de capacidad, a ancho completo
03 / VALOR       Declaración + métricas y prueba de método
04 / PROCESO     Línea de avance: planifica → diseñamos → lanzamos
05 / PORTAFOLIO  Proyectos como láminas horizontales, no como tarjetas
06 / ECOSISTEMA  Polaris Web Studio + Local Lift + Polaris Flow
07 / FAQ + CTA   Preguntas esenciales y cierre de conversión
```

La rama es puramente visual. No altera Firestore, precios, cotizadores, reglas comerciales ni endpoints.
