# Polaris Flow — Especificación de dogfooding de Office Flow

**Versión:** 1.0  
**Estado:** Propuesta operativa para aprobación antes del prototipo  
**Proceso elegido:** Polaris Web Studio — cotizador de proyectos web  
**Flujo:** Lead-to-Quote  
**Alcance:** Uso interno de Polaris; no es todavía un SaaS multiempresa

## 1. Objetivo

El primer dogfooding de Office Flow debe operar el proceso comercial real de Polaris Web Studio desde la llegada de una solicitud de cotización hasta el siguiente paso aprobado por el equipo. La meta no es reemplazar el cotizador actual ni construir una plataforma completa. La meta es probar una capa operativa alrededor de un proceso que ya existe.

El flujo debe responder en todo momento cuatro preguntas:

| Pregunta | Respuesta que Office Flow debe mostrar |
|---|---|
| ¿Qué entró? | La oportunidad, su negocio, canal, configuración y fecha |
| ¿Qué falta? | Campos incompletos, aclaraciones o acciones pendientes |
| ¿Qué se preparó? | Cotización, resumen y correo en estado de borrador |
| ¿Qué sigue? | Aprobación, envío, reunión, seguimiento o cierre |

> **Regla principal:** Office Flow puede ordenar información y preparar un borrador, pero no puede enviar una cotización comercial sin aprobación humana explícita.

## 2. Límite del primer piloto

El primer piloto debe incluir únicamente el recorrido que comienza en `/cotizar`, el cotizador principal de Polaris. En su primera iteración no se deben mezclar automáticamente conversaciones de Atlas, mensajes de WhatsApp, correos directos ni la consulta de alineación de `/proceso`. Esas entradas pueden registrarse como fuentes futuras, pero añadirlas ahora dificultaría saber qué parte del sistema funciona.

| Fuente actual | Decisión para el primer piloto | Tratamiento |
|---|---|---|
| Cotizador `/cotizar` | **Incluida** | Fuente canónica de dogfooding |
| PDF de cotización | **Incluida** | Evento principal de captura del lead |
| Agendado desde el cotizador | **Incluido** | Evento que completa el contexto comercial |
| Consulta directa desde `/proceso` | Fuera de la primera iteración | Mantener como flujo separado hasta estabilizar el piloto |
| Atlas/QuoteBot | Fuera de la primera iteración | Puede entregar a `/cotizar` o WhatsApp, pero no crea una oportunidad canónica todavía |
| `/contacto`, correo y WhatsApp | Fuera de la primera iteración | Registrar manualmente si se necesita probar un caso excepcional |

El cotizador actual tiene cinco pasos: sector y tipo de negocio, tipo de web, complementos y dominio, datos para recibir la cotización PDF y agendado de la reunión.[1] El CTA del PDF crea el lead y dispara el correo de confirmación; el agendado posterior actualiza nombre y correo si el prospecto los corrige.[1] [2]

## 3. Entrada canónica de Office Flow

La captura canónica ocurre cuando el prospecto pulsa **Obtener mi cotización PDF** y el sistema acepta un correo válido. En ese momento debe generarse una oportunidad de Office Flow con un identificador propio y un evento de entrada. El sistema puede conservar `wizardLeads` y `quoteSessions` por compatibilidad, pero no debe tratarlos como el modelo operativo final.

La razón es que la sesión anónima del wizard representa progreso de navegación, mientras que el lead representa una solicitud capturada. Las reglas actuales mantienen ambos objetos separados y permiten actualizar después únicamente nombre y correo del lead.[3]

### 3.1 Campos obligatorios de entrada

| Campo | Obligatorio | Fuente | Validación |
|---|---:|---|---|
| `source` | Sí | Sistema | Valor controlado: `quote_wizard` |
| `sourceEventId` | Sí | Sistema | Idempotencia; no se puede reutilizar para otra captura |
| `sessionId` | Sí | Wizard | UUID de la sesión, si existe; crear uno server-side si falta |
| `language` | Sí | Contexto de interfaz | Solo `es` o `en` |
| `sector` | Sí | Paso 1 | Debe pertenecer al catálogo de sectores |
| `businessType` | Sí | Paso 1 | Texto del catálogo o valor `Otro` con aclaración |
| `projectType` | Sí | Paso 2 | `landing`, `corporate` o `ecommerce` |
| `addonIds` | Sí | Paso 3 | Lista controlada; `hosting` puede estar incluido por defecto |
| `email` | Sí | Paso 4 | Formato válido y normalización en minúsculas |
| `name` | No en captura; sí para reunión | Paso 4 / agendado | Si existe, máximo 200 caracteres; al agendar, mínimo 2 caracteres |
| `domain` | No | Paso 3 | Dominio normalizado o `null` |
| `estimatedOneTime` | Sí | Sistema | Recalcular server-side; nunca confiar en el total enviado por el cliente |
| `estimatedMonthly` | Sí | Sistema | Recalcular server-side a partir de complementos mensuales |
| `capturedAt` | Sí | Sistema | Timestamp server-side |

### 3.2 Campos operativos adicionales

Estos campos no están completos en la captura actual, pero deben existir en la oportunidad canónica para que el proceso sea operable.

| Campo | Propósito |
|---|---|
| `status` | Estado actual de la oportunidad |
| `priority` | Priorización determinista |
| `assigneeId` | Persona responsable |
| `nextAction` | Próxima acción visible y fecha objetivo |
| `lastEventAt` | Última actividad del flujo |
| `quoteVersion` | Versión del cálculo y de la plantilla utilizada |
| `quoteFingerprint` | Detectar reintentos de la misma configuración |
| `meeting` | Fecha, zona horaria, enlace y estado del agendado |
| `outboundMessages` | Historial de borradores, aprobaciones y envíos |
| `approval` | Quién aprobó, cuándo, qué versión y con qué decisión |
| `reminders` | Recordatorios programados, enviados, cancelados o fallidos |
| `utm` | Atribución de campañas, si existe |
| `consent` | Evidencia del consentimiento aplicable a comunicación comercial |

## 4. Reglas de normalización y duplicados

Office Flow debe permitir que una misma persona cotice más de un proyecto. El correo no debe utilizarse como bloqueo global, porque un cliente puede pedir otro sitio, cotizar para otra empresa o regresar meses después.

La deduplicación debe operar sobre eventos y configuraciones, no sobre la identidad completa del prospecto.

| Situación | Comportamiento esperado |
|---|---|
| Reintento del mismo botón o timeout del navegador | Reusar `sourceEventId`; no crear otra oportunidad ni otro correo |
| Misma sesión, mismo correo y misma configuración | Actualizar la oportunidad existente y conservar el historial |
| Mismo correo, nueva sesión y configuración diferente | Crear una nueva oportunidad relacionada por `contactEmail` |
| Mismo correo, mismo proyecto después de una captura reciente | Mostrar una posible coincidencia al equipo; no enviar automáticamente un duplicado |
| Nombre corregido al agendar | Actualizar solo los datos de identidad permitidos y registrar el evento |
| Cambio de precio, paquete o complemento | Crear una nueva versión de cotización y exigir nueva aprobación |

El envío debe ser idempotente. Un reintento nunca debe convertirse en una segunda cotización enviada. El sistema debe distinguir entre `not_started`, `accepted_by_provider`, `delivered`, `failed_before_send` y `sync_pending`.

## 5. Clasificación determinista

La primera versión no necesita una clasificación compleja con IA. Debe producir una prioridad comprensible a partir de reglas explícitas. La IA puede resumir o sugerir, pero no decidir por sí sola la prioridad comercial ni cambiar el precio.

### 5.1 Estado inicial

1. Si falta un campo obligatorio, la oportunidad entra en `needs_information`.
2. Si los datos están completos, entra en `captured` y pasa a la cola de preparación.
3. Si existe un error de cálculo, correo o persistencia, entra en `error` y genera una alerta interna.

### 5.2 Prioridad inicial

| Regla | Prioridad |
|---|---|
| `projectType = ecommerce` | Alta |
| Incluye `ai_agent`, `semantic_search` o `crm_connect` | Alta |
| `projectType = corporate` | Media |
| `projectType = landing` sin complementos de alta complejidad | Normal |
| Existe reunión agendada | Alta mientras esté pendiente de la reunión |
| Faltan datos obligatorios | No priorizar para venta; prioridad operativa de aclaración |
| El prospecto pide información pero no inicia cotización | No entra en este piloto |

Estas reglas son una primera hipótesis de operación y deben poder modificarse sin reescribir la interfaz. La prioridad no debe aparecer ante el cliente como una etiqueta de valor o urgencia; es una herramienta interna.

## 6. Estados y transiciones

| Estado | Entrada | Acción permitida | Siguiente estado |
|---|---|---|---|
| `captured` | Solicitud aceptada | Validar y preparar | `needs_information` o `preparing_draft` |
| `needs_information` | Falta un dato o existe inconsistencia | Solicitar aclaración | `captured` o `closed_lost` |
| `preparing_draft` | Datos válidos | Generar borrador estructurado | `draft_ready` o `error` |
| `draft_ready` | Borrador preparado | Revisión interna | `approval_pending` |
| `approval_pending` | Borrador listo para decisión | Editar, aprobar o rechazar | `approved`, `draft_ready` o `needs_information` |
| `approved` | Persona autorizada aprobó la versión | Enviar una sola vez | `sent` o `error` |
| `sent` | Proveedor acepta el mensaje | Esperar respuesta o reunión | `awaiting_client` |
| `awaiting_client` | No existe siguiente actividad | Recordatorio aprobado | `meeting_scheduled`, `won`, `closed_lost` o `snoozed` |
| `meeting_scheduled` | Booking confirmado | Preparar reunión | `won`, `snoozed` o cierre manual |
| `snoozed` | Equipo pospone la acción | Reactivar manualmente | `awaiting_client` o `closed_lost` |
| `error` | Fallo técnico o de proveedor | Reintentar de forma segura o intervenir | Estado anterior o `closed_lost` |
| `won` | El proyecto avanza a contratación | Cierre comercial | Estado final |
| `closed_lost` | No continuará | Registrar motivo | Estado final |

No se debe permitir una transición silenciosa. Cada cambio debe crear un evento con actor, timestamp, estado anterior, estado nuevo y, cuando aplique, motivo.

## 7. Borrador comercial

El borrador se debe generar en el idioma elegido durante el cotizador. No se debe traducir posteriormente de forma automática solo porque el equipo cambió el idioma de la interfaz. El idioma de la oportunidad queda fijado en la captura, salvo que un usuario autorizado lo cambie de forma explícita.

### 7.1 Contenido del correo

**Asunto en español:** `Recibimos tu cotización de Polaris — siguiente paso`  
**Asunto en inglés:** `We received your Polaris quote request — next step`

El cuerpo debe seguir esta estructura:

1. **Reconocimiento:** agradecer la solicitud y mencionar el tipo de negocio.
2. **Resumen:** mostrar el paquete, tipo de proyecto, dominio propuesto y complementos seleccionados.
3. **Estimación:** separar inversión inicial de cargos mensuales y declarar que es una estimación basada en la configuración recibida.
4. **Alcance:** listar lo incluido y las suposiciones utilizadas.
5. **Siguiente paso:** indicar si hay una reunión agendada o invitar a reservarla.
6. **Acción alternativa:** ofrecer responder al correo o contactar por WhatsApp si necesita aclarar algo.
7. **Adjunto o enlace:** incluir el PDF generado solo después de verificar que corresponde a la versión aprobada.
8. **Firma estándar:** utilizar la plantilla de correo vigente de Polaris, sin inventar un footer diferente.

### 7.2 Texto base recomendado

> Hola, [nombre].
>
> Recibimos la configuración de tu proyecto para **[tipo de negocio]**. Preparamos una cotización inicial basada en **[paquete]**, con **[complementos]** y el dominio propuesto **[dominio]**.
>
> La estimación es de **[total inicial]**, más **[total mensual]** cuando corresponda. El documento adjunto resume el alcance, las condiciones consideradas y el siguiente paso recomendado.
>
> Si ya tienes una reunión agendada, revisaremos contigo los objetivos, las fechas y cualquier ajuste necesario. Si todavía no la has reservado, puedes hacerlo desde el enlace de la cotización o responder directamente a este correo.
>
> Saludos,  
> Equipo Polaris Web Studio

El texto anterior es una plantilla de trabajo. No debe enviarse directamente desde el generador. Debe convertirse en borrador estructurado, pasar validaciones y quedar pendiente de aprobación humana.

### 7.3 Reglas de contenido

El borrador nunca debe inventar precio, plazo, entregables, disponibilidad de dominio, integración, resultado de negocio ni capacidad técnica. Si un dato no existe, debe aparecer como `[requiere confirmación]` en la bandeja interna y bloquear la aprobación hasta resolverlo.

El modelo puede redactar, resumir y detectar inconsistencias. El precio, la lista de servicios, el descuento y los cargos recurrentes deben calcularse con reglas deterministas a partir del catálogo vigente. El backend debe volver a calcular el total y comparar el resultado con los datos de presentación antes de permitir la aprobación.

## 8. Aprobación humana

Durante todo el dogfooding, **100 % de los mensajes externos requieren aprobación**. No se debe activar un modo de envío automático para probar la velocidad del flujo.

| Situación | ¿Requiere aprobación? | Motivo |
|---|---:|---|
| Primera cotización | Sí | Contiene precio y alcance comercial |
| Recordatorio de 24 horas | Sí | Comunicación externa |
| Recordatorio de 72 horas | Sí | Comunicación externa |
| Cambio de precio o complemento | Sí, nueva versión | Cambia la oferta |
| Corrección interna sin cambio comercial | Sí, si afecta el texto enviado | Mantener trazabilidad |
| Mensaje de error solo interno | No | No sale del sistema |
| Nota interna de seguimiento | No | No es comunicación externa |

La aprobación debe guardar `approverId`, `approvedAt`, `draftVersion`, `contentHash` y una copia del resumen que se aprobó. Si se modifica el precio, el alcance, los complementos, el idioma, el destinatario o el adjunto después de aprobar, la aprobación debe invalidarse y exigir una nueva.

## 9. Seguimiento inicial

La secuencia debe ser corta y controlada. El objetivo es evitar que una oportunidad quede olvidada, no crear una campaña de marketing automática.

| Momento | Condición | Acción |
|---|---|---|
| Inmediato | Cotización aprobada y enviada | Registrar envío y dejar próxima acción visible |
| 24 horas | No hay reunión ni respuesta registrada | Preparar recordatorio para aprobación humana |
| 72 horas | Sigue sin reunión ni respuesta | Preparar segundo y último recordatorio para aprobación |
| 7 días | Sigue sin actividad | Pasar a `snoozed` o `closed_lost` manualmente; no enviar más mensajes automáticamente |
| Reunión agendada | Antes de la reunión | Cancelar recordatorios de cotización |
| Respuesta del cliente | En cualquier momento | Crear tarea de revisión y detener recordatorios hasta decisión humana |

Los tiempos son valores iniciales para el piloto, no compromisos comerciales publicables. El equipo debe poder pausarlos por oportunidad y registrar por qué.

## 10. Modelo operativo de la bandeja

La bandeja de Office Flow debe priorizar la acción, no la cantidad de campos. Cada tarjeta debe mostrar:

| Elemento | Ejemplo |
|---|---|
| Nombre y negocio | Juan Pérez · Restaurante X |
| Estado | Pendiente de aprobación |
| Prioridad | Alta |
| Configuración | Nova · CRM Connect · dominio disponible |
| Último evento | Borrador generado hace 12 min |
| Próxima acción | Revisar y aprobar correo |
| Responsable | Polaris / administrador |
| Riesgo | Falta confirmar plazo, si aplica |

La vista de detalle debe incluir el resumen de entrada, el cálculo server-side, el borrador, la validación, la línea de tiempo y las acciones disponibles. El usuario nunca debería tener que buscar en varias pantallas para saber si el correo ya salió.

## 11. Arquitectura de dogfooding

El prototipo debe crear una entidad canónica de Office Flow en backend, por ejemplo `officeFlowOpportunities`, y conservar las colecciones actuales como fuentes de compatibilidad durante la transición. El navegador no debe poder fijar por sí solo el precio final, el estado de envío ni la aprobación.

| Componente | Responsabilidad |
|---|---|
| Cotizador actual | Capturar las selecciones y disparar el evento de entrada |
| Endpoint server-side | Validar payload, calcular totales, deduplicar y crear oportunidad |
| Firestore | Guardar oportunidad, eventos, borradores, aprobaciones y tareas |
| Generador estructurado | Preparar resumen y correo; devolver JSON validable |
| Validador determinista | Confirmar campos, precios, idioma, destinatario y adjuntos |
| Bandeja interna | Permitir revisar, editar, aprobar, rechazar y programar seguimiento |
| Proveedor de correo | Enviar solo mensajes con aprobación válida e idempotency key |
| Servicio de agenda | Vincular la reunión confirmada con la oportunidad existente |

El primer prototipo no necesita multi-tenant completo, constructor visual de flujos ni configuración autoservicio. Sí debe tener separación lógica de datos, control de acceso administrativo y registros suficientes para auditar cada acción.

## 12. Pruebas de aceptación

1. Una cotización completada desde `/cotizar` crea una sola oportunidad canónica con sector, negocio, paquete, complementos, idioma, correo y cálculo server-side.
2. Un segundo intento del mismo evento no crea un duplicado ni envía otro correo.
3. Si falta un campo obligatorio, la oportunidad queda en `needs_information` y no se genera una cotización aprobable.
4. El total de la oportunidad coincide con el catálogo vigente y separa cargos iniciales de cargos mensuales.
5. El borrador conserva el idioma elegido en la captura.
6. Una edición posterior a la aprobación invalida la aprobación anterior.
7. Ningún correo sale sin `approvedAt`, `draftVersion` y `contentHash` válidos.
8. El registro de envío distingue aceptación del proveedor, entrega, fallo y sincronización pendiente.
9. Al agendar una reunión, la oportunidad registra fecha, zona horaria, enlace y estado de reunión.
10. Si el prospecto corrige nombre o correo durante el agendado, el cambio queda registrado como evento y no modifica silenciosamente el resto de la cotización.
11. Al existir una reunión agendada, los recordatorios pendientes se cancelan.
12. Al cambiar el paquete o los complementos, se crea una nueva versión y se exige aprobación nuevamente.
13. Una misma dirección de correo puede crear otra oportunidad para una configuración distinta.
14. El panel muestra estado, responsable, último evento y próxima acción sin depender del historial del navegador.
15. Un fallo de IA o de correo deja una alerta accionable y no marca la oportunidad como enviada.

## 13. Decisiones recomendadas para aprobar ahora

Para comenzar el prototipo sin ampliar el alcance, recomiendo aprobar estos valores iniciales:

| Decisión | Valor recomendado |
|---|---|
| Fuente inicial | Solo el cotizador `/cotizar` |
| Evento de captura | Pulsar **Obtener mi cotización PDF** con correo válido |
| Salida inicial | Correo con cotización PDF y enlace para agendar |
| Aprobación | Obligatoria para toda salida externa |
| Responsable | Usuario administrador de Polaris |
| Aprobador final | Usuario propietario de Polaris |
| Recordatorios | 24 horas y 72 horas, ambos sujetos a aprobación |
| Dedupe | Por evento y configuración; nunca bloqueo global por correo |
| Catálogo | Paquetes y complementos vigentes, recalculados server-side |
| IA | Solo extracción, resumen y redacción estructurada |
| Primer objetivo | Operar manualmente cinco a diez oportunidades reales y medir errores |

## 14. Decisiones que todavía debe confirmar Polaris

Antes de escribir código hay que confirmar tres puntos de negocio. Primero, si el correo con la cotización PDF seguirá siendo la salida principal o si la prioridad será el agendado. Segundo, si los recordatorios de 24 y 72 horas son adecuados para el ciclo comercial real de Polaris. Tercero, cuál es el criterio manual para marcar una oportunidad como ganada o perdida después de la reunión. El aprobador final ya queda definido: será el usuario propietario de Polaris.

Mi recomendación es aceptar los valores de la sección anterior como configuración inicial, incluyendo al usuario propietario de Polaris como aprobador final, y modificarlos después de operar los primeros casos. No conviene retrasar el prototipo intentando diseñar todos los escenarios futuros de Office Flow.

## Referencias internas

[1]: [Cotizador actual — `WizardQuote.tsx`](../src/pages/WizardQuote.tsx)  
[2]: [Agendado actual — `BookingScheduler.tsx`](../src/components/BookingScheduler.tsx)  
[3]: [Reglas actuales de Firestore](../firestore.rules)  
[4]: [Cierre actual del cotizador — `Gracias.tsx`](../src/pages/Gracias.tsx)  
[5]: [Camino alterno de consulta directa — `Process.tsx`](../src/pages/Process.tsx)  
[6]: [Preguntas comerciales de Atlas/QuoteBot](../src/components/QuoteBot.tsx)

[1] El cotizador actual define cinco pasos y persiste una sesión anónima mientras el usuario avanza; el lead se guarda al solicitar la cotización PDF.

[2] El componente de agenda consulta horarios, reserva por backend y devuelve fecha, zona horaria y enlace de reunión al flujo.

[3] Las reglas actuales permiten crear `wizardLeads`, actualizar después únicamente nombre y correo, y mantener una sesión separada en `quoteSessions`.

[4] La pantalla de cierre actual comunica registro, briefing estratégico y lanzamiento como pasos siguientes.

[5] La página de metodología mantiene una consulta directa de 15 minutos como camino paralelo al cotizador.

[6] Atlas/QuoteBot realiza cuatro preguntas de orientación y ofrece continuar hacia paquetes, WhatsApp o el sitio de servicios; no es la fuente canónica del primer piloto.
