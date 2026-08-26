# Validación de integración de Polaris Flow

La revisión visual estática de `http://localhost:5173/flow` confirmó que la nueva ruta carga dentro de Polaris Web Studio y conserva la navegación global de PWS. La cabecera usa el logo oficial de tres ondas de Polaris Flow; el ámbar es el color dominante de la experiencia y el índigo aparece únicamente como apoyo visual.

| Caso | Resultado | Evidencia |
|---|---|---|
| Carga de `/flow` | Correcta tras el loader global | Navegación local, 26 de agosto de 2026 |
| Identidad de marca | Correcta: logo oficial, ámbar principal, índigo secundario | Hero de la ruta `/flow` |
| CTA comercial | Dirige a `/contacto?service=office-flow` | Sin ejecutar envío ni backend |
| Operación Office Flow | No expuesta ni duplicada desde PWS | El copy deja explícita la aprobación humana |
| Formulario contextual | Muestra Office Flow, copy específico y aviso de revisión humana | `/contacto?service=office-flow` |
| Español e inglés | El formulario traduce título, descripción, placeholder y aviso contextual | Cambio de idioma de la interfaz, sin envío |
| Hero móvil, 390 × 844 | Marca oficial, encabezado y cuerpo legibles; sin desbordamiento lateral visible | Captura local posterior al loader |

El servidor Express completo no se inició en la copia local porque requiere una credencial Firebase válida de entorno. No se modificaron secretos ni se intentó una operación de datos. La interfaz se verificó mediante Vite estático.

En la captura móvil sin preferencias persistidas, el banner de cookies cubre los CTA situados inmediatamente debajo del hero. Ese comportamiento pertenece al consentimiento global existente de PWS; el hero y la navegación siguen accesibles. No se descartó ni aceptó consentimiento durante la prueba.
