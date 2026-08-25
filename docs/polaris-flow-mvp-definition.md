# Polaris Flow — Definición del MVP

**Versión:** 1.0  
**Estado:** Propuesta lista para decisión y construcción  
**Marca matriz:** Polaris Web Studio  
**Producto inicial:** Office Flow  
**Tagline:** *Operations in motion.*

## 1. Decisión ejecutiva

Polaris Flow debe comenzar como un **servicio productizado de automatización operativa**, no como una plataforma SaaS abierta para cualquier tipo de proceso. La primera versión debe resolver un recorrido concreto, fácil de explicar y repetible entre clientes: **recibir una solicitud comercial, ordenar la información, preparar una cotización o documento, obtener aprobación humana y dar seguimiento hasta el siguiente paso**.

El primer producto se llamará **Office Flow**, pero seguirá siendo una aplicación de Polaris Flow y no una marca independiente. Esta decisión permite vender un resultado operativo claro, aprender con implementaciones reales y reutilizar los mismos componentes —estados, reglas, aprobaciones, plantillas, historial y notificaciones— en futuras verticales.

> **MVP de Polaris Flow:** ningún lead se pierde entre la entrada, la preparación de una respuesta y el siguiente paso aprobado.

## 2. Qué problema resuelve

Las pequeñas y medianas empresas suelen recibir oportunidades por formularios, correo, WhatsApp, llamadas y referencias. La información queda distribuida entre conversaciones, notas y hojas de cálculo. El dueño o el equipo comercial termina copiando datos, preparando cotizaciones manualmente, recordando seguimientos y preguntando internamente cuál es el estado de cada oportunidad.

Polaris Flow no pretende reemplazar el criterio del equipo. Su función es crear continuidad: registrar lo que entró, detectar qué falta, preparar el trabajo repetitivo, pedir aprobación cuando corresponde y dejar un historial visible de lo ocurrido.

La promesa no debe expresarse como “automatizamos tu negocio”. Debe expresarse como:

> **Convertimos tus solicitudes comerciales en un recorrido visible, aprobable y medible.**

## 3. Cliente ideal del MVP

El cliente inicial debe ser una empresa de servicios con un equipo pequeño, un proceso comercial repetitivo y suficiente volumen para sentir el costo del desorden. No necesita tener un departamento técnico ni una infraestructura sofisticada. De hecho, el MVP será más valioso para empresas que actualmente dependen del dueño, de una asistente o de una persona clave para que las oportunidades no se queden detenidas.

| Criterio | Perfil recomendado |
|---|---|
| Tipo de negocio | Agencias, inmobiliarias, clínicas, mantenimiento, servicios profesionales, hospitalidad y proveedores B2B |
| Tamaño operativo | Aproximadamente 2–15 personas involucradas en ventas, atención u operaciones |
| Problema visible | Leads dispersos, cotizaciones manuales, seguimientos olvidados o documentos repetitivos |
| Disparador de compra | El equipo ya perdió oportunidades o dedica demasiadas horas a tareas administrativas |
| Nivel técnico | Bajo o medio; el cliente quiere usar el sistema, no construirlo |
| Mercado inicial | República Dominicana, comenzando con negocios que ya operan por correo, formularios o WhatsApp |
| Persona compradora | Dueño, gerente de operaciones, gerente comercial o responsable administrativo |

No se debe intentar vender el MVP a empresas que necesiten una suite ERP completa, decisiones totalmente autónomas, procesos regulatorios complejos o decenas de integraciones desde el primer día. Esos casos pueden explorarse más adelante, después de validar el flujo base.

## 4. Primer caso de uso: Lead-to-Quote

El flujo inicial recomendado se denomina **Lead-to-Quote**. Su objetivo es acompañar una oportunidad desde que entra hasta que queda convertida en una cotización aprobada, enviada y lista para seguimiento.

| Etapa | Acción del sistema | Acción humana |
|---|---|---|
| **Recibe** | Captura la solicitud desde un formulario o correo autorizado y crea una oportunidad única | Revisa la bandeja cuando sea necesario |
| **Ordena** | Normaliza nombre, contacto, servicio solicitado, urgencia, presupuesto y contexto | Completa o corrige datos faltantes |
| **Valida** | Comprueba campos obligatorios y marca la información incompleta | Decide qué hacer con excepciones |
| **Prepara** | Crea un borrador de respuesta, cotización o documento usando plantillas y reglas aprobadas | Revisa, edita, aprueba o rechaza |
| **Confirma** | Envía el contenido aprobado por el canal autorizado y registra el evento | Supervisa el resultado cuando el flujo lo requiera |
| **Sigue** | Programa recordatorios y muestra la próxima acción | Atiende respuestas, reprograma o cierra la oportunidad |

La primera implementación debe usar **un canal de entrada y un canal de salida**. La opción más segura para la demostración inicial es formulario web más correo electrónico. Si un cliente depende principalmente de WhatsApp, puede incorporarse después de confirmar el proceso mediante un piloto controlado; no conviene convertir la integración más compleja en requisito de la primera demostración.

## 5. Flujo detallado del MVP

### 5.1 Entrada de la oportunidad

Una solicitud entra por un formulario, correo reenviado o endpoint autorizado. El sistema debe generar un identificador único y evitar duplicar la misma oportunidad cuando un proveedor reintente el envío o el usuario vuelva a pulsar el botón.

La oportunidad debe iniciar con un estado visible, por ejemplo `Nueva`, y registrar el origen, la fecha, el responsable inicial y el último evento. El usuario debe poder saber en pocos segundos qué entró y qué debe ocurrir después.

### 5.2 Orden y validación

El sistema clasifica la oportunidad según reglas configuradas por el cliente. Como mínimo debe reconocer el tipo de servicio, urgencia, ubicación, tamaño aproximado del trabajo y datos de contacto. Los campos que falten no deben quedar ocultos dentro de una respuesta de IA; deben aparecer como tareas o alertas explícitas.

La IA puede ayudar a extraer y clasificar información, pero las validaciones críticas deben ser deterministas. Por ejemplo, si una cotización necesita nombre, correo, servicio y ubicación, la aplicación debe comprobar esos campos con reglas de software.

### 5.3 Preparación del borrador

Cuando la información mínima está completa, Office Flow prepara un borrador utilizando plantillas aprobadas. El borrador puede ser una respuesta comercial, una cotización, un resumen de alcance, un correo de seguimiento o un documento sencillo.

El sistema debe mostrar qué datos utilizó, qué reglas aplicó y qué campos fueron inferidos. Si la IA no tiene suficiente información, debe marcar la incertidumbre y pedir aclaración en vez de inventar precios, fechas, servicios o promesas.

### 5.4 Aprobación humana

Ningún mensaje comercial debe enviarse automáticamente durante el MVP sin una aprobación humana explícita. La bandeja de aprobación debe permitir revisar el contenido, editarlo, aprobarlo, rechazarlo o solicitar cambios.

Cada decisión debe quedar registrada con usuario, fecha, estado anterior, estado nuevo y motivo opcional. Esto protege al cliente y permite investigar por qué una oportunidad avanzó, se detuvo o fue modificada.

### 5.5 Envío y seguimiento

Después de la aprobación, el sistema envía el contenido por el canal autorizado y registra el resultado. Si el proveedor de correo falla, la oportunidad debe quedar en un estado de error recuperable, no como enviada. Si el correo fue aceptado por el proveedor pero falló la sincronización interna, el sistema debe marcar una condición explícita de sincronización pendiente para evitar duplicados.

El seguimiento inicial puede incluir uno o dos recordatorios configurables. El MVP no necesita un sistema avanzado de marketing automation; necesita que cada oportunidad tenga una próxima acción clara y que el equipo pueda ver las que llevan demasiado tiempo detenidas.

## 6. Estados mínimos de una oportunidad

Los estados deben ser pocos, comprensibles y suficientes para operar el primer flujo.

| Estado | Significado |
|---|---|
| `Nueva` | La solicitud entró, pero todavía no fue revisada |
| `Falta información` | El flujo detectó datos necesarios que no están completos |
| `En preparación` | El sistema está preparando un borrador o un operador está trabajando en él |
| `Pendiente de aprobación` | Existe un borrador listo para revisión humana |
| `Aprobada para envío` | Una persona autorizó el siguiente paso |
| `Enviada` | El proveedor confirmó la entrega o aceptación del mensaje |
| `En seguimiento` | La oportunidad requiere respuesta, recordatorio o acción posterior |
| `Ganada` | El cliente aceptó o el objetivo comercial se completó |
| `Perdida` | La oportunidad se cerró sin conversión, con motivo opcional |
| `Error / requiere atención` | Existe un fallo que necesita intervención humana |

Cada oportunidad debe mostrar siempre cuatro elementos: **estado actual, responsable, último evento y próxima acción**.

## 7. Alcance funcional del MVP

### Incluido

El MVP debe incluir un panel de oportunidades, vista de detalle con historial, captura desde un formulario o correo, reglas básicas configurables, plantillas de respuesta, extracción asistida por IA, validación de campos, generación de borradores, aprobación humana, envío por correo, recordatorios, búsqueda, filtros y métricas operativas básicas.

También debe incluir control de duplicados, reintentos seguros, registro de errores, permisos básicos, trazabilidad de acciones y una forma sencilla de pausar o desactivar un flujo. La experiencia debe ser utilizable por una persona no técnica después de una capacitación breve.

### Fuera del MVP

No se debe incluir inicialmente un constructor visual de workflows, marketplace de integraciones, chatbot autónomo, omnicanalidad completa, facturación recurrente, CRM general, ERP, publicación automática en redes sociales, decisiones autónomas sensibles, soporte para decenas de clientes desde el primer día ni una aplicación móvil nativa.

Tampoco se debe prometer que el sistema reemplaza al equipo comercial. Office Flow prepara y organiza; la empresa conserva el control sobre precios, compromisos, excepciones y decisiones importantes.

## 8. Pantallas principales

### Bandeja de oportunidades

Debe mostrar las oportunidades agrupadas por estado, con búsqueda, filtros por responsable y origen, fecha de última actividad, prioridad y próxima acción. La tarjeta de cada oportunidad debe ser breve, pero suficiente para decidir si requiere atención.

### Detalle de oportunidad

Debe presentar los datos estructurados, el estado actual, la próxima acción y una línea de tiempo de eventos. La línea de tiempo debe distinguir eventos automáticos, acciones humanas, mensajes enviados, errores y cambios de estado.

### Cola de aprobación

Debe mostrar los borradores pendientes con una comparación clara entre los datos de entrada, la plantilla utilizada y el contenido generado. Las acciones principales serán editar, aprobar, rechazar y solicitar información.

### Plantillas y reglas

La primera versión puede tener una configuración guiada por Polaris en lugar de un editor complejo. El cliente debe poder revisar los campos requeridos, las plantillas activas, los responsables y las reglas de aprobación, pero Polaris puede encargarse de la configuración inicial.

### Resumen operativo

El panel debe mostrar pocas métricas útiles: oportunidades nuevas, oportunidades sin próxima acción, tiempo hasta el primer borrador, tiempo hasta la primera respuesta, cotizaciones pendientes de aprobación y oportunidades detenidas por error.

## 9. Alcance técnico recomendado

Polaris Flow debe aprovechar el stack que Polaris ya domina: React, TypeScript, Vite, Tailwind, Firebase Auth, Firestore, Storage y funciones backend. Cada cliente debe tener separación lógica de datos desde el inicio, aunque el MVP comience con pocos tenants.

| Capa | Decisión inicial |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind |
| Identidad | Firebase Auth con invitación de usuarios por tenant |
| Datos | Firestore con `tenantId`, reglas de seguridad y eventos inmutables donde corresponda |
| Archivos | Firebase Storage para cotizaciones, documentos y plantillas cargadas |
| Backend | Funciones server-side para integraciones, IA, envío y tareas programadas |
| IA | Uso server-side para extracción y borradores estructurados; nunca exponer claves en el cliente |
| Entrada inicial | Formulario web y/o correo, según el piloto seleccionado |
| Salida inicial | Correo electrónico con plantillas y registro de entrega |
| Automatización | Scheduler o cola de tareas para recordatorios y reintentos |
| Observabilidad | Logs estructurados, eventos de negocio, errores correlacionados e idempotencia |

### Modelo de datos conceptual

Las entidades mínimas son `tenants`, `users`, `opportunities`, `opportunityEvents`, `templates`, `workflowRules`, `approvals`, `outboundMessages`, `reminders` y `integrations`.

Una oportunidad debe guardar únicamente los datos necesarios para el proceso. Los datos personales deben tener reglas de acceso por tenant, política de retención y mecanismo de borrado o anonimización. Los eventos críticos deben conservar quién hizo la acción, cuándo ocurrió y qué cambió.

### Controles de seguridad y robustez

Toda entrada externa debe validarse en el backend. Los endpoints deben aplicar autenticación, autorización por tenant, límites de frecuencia, validación de payload, protección contra duplicados y control de reintentos. Las respuestas de IA deben validarse contra esquemas antes de guardarse o mostrarse como borrador.

El envío debe ser idempotente. El sistema debe distinguir entre “no enviado”, “enviado”, “falló antes de enviar”, “el proveedor aceptó el mensaje” y “se envió, pero la sincronización quedó pendiente”. Esta distinción es esencial para no enviar dos veces una cotización.

## 10. Oferta inicial para validar el producto

La primera oferta no debe vender una cantidad ilimitada de automatizaciones. Debe vender la implementación de **un recorrido operativo prioritario** alrededor de un proceso real del cliente.

| Fase | Resultado para el cliente |
|---|---|
| Diagnóstico | Mapa breve del proceso actual y del punto donde se pierde continuidad |
| Diseño | Flujo propuesto con estados, reglas, responsables y aprobaciones |
| Implementación | Office Flow configurado para un proceso y canales acordados |
| Activación | Pruebas con casos reales, capacitación y documentación breve |
| Operación inicial | Periodo de observación, correcciones y medición de resultados |

Los precios definitivos deben establecerse después de medir el costo de implementación, el soporte y las integraciones. Para el primer piloto conviene ofrecer una tarifa de implementación claramente separada de una tarifa de operación o mantenimiento, evitando vender trabajo ilimitado sin límites definidos.

## 11. Cómo debe venderse

La página y la demostración no deben comenzar con una lista de integraciones. Deben comenzar con una escena reconocible:

> Entra una solicitud. El sistema ordena los datos. Prepara una respuesta. Tú la revisas. El trabajo sigue avanzando.

El CTA principal debe invitar a **mapear un flujo**, no a “crear una cuenta”. El proceso comercial inicial debe ser consultivo y breve:

1. El prospecto describe dónde se detiene el trabajo.
2. Polaris identifica un único recorrido prioritario.
3. Se presenta un mapa sencillo de entrada, reglas, aprobación y salida.
4. El cliente recibe una propuesta de implementación con límites claros.
5. Polaris construye y prueba la primera versión.
6. El cliente opera el flujo con acompañamiento inicial.

## 12. Roadmap de validación

### Días 0–30: demostración y dogfooding

Construir un prototipo funcional de Lead-to-Quote para el propio proceso comercial de Polaris. Debe capturar una solicitud, crear una oportunidad, preparar un borrador, pedir aprobación y registrar el seguimiento. El objetivo no es todavía vender una plataforma, sino demostrar el recorrido completo y descubrir los casos de error.

### Días 31–60: primer piloto externo

Seleccionar un cliente de servicios con un proceso comercial parecido. Configurar un solo canal de entrada, un canal de salida, una plantilla principal y un conjunto pequeño de reglas. Medir tiempo de respuesta, oportunidades sin próxima acción, errores de envío y horas manuales evitadas.

### Días 61–90: estandarización

Convertir lo repetido en componentes reutilizables: onboarding, estados, plantillas, aprobaciones, historial, recordatorios y métricas. Revisar qué partes deben permanecer como servicio personalizado y cuáles pueden convertirse en configuración del producto.

Solo después de esta etapa debe evaluarse Chat Convert, Villa Flow u otros verticales. La expansión debe seguir el principio **un motor, diferentes operaciones**.

## 13. Criterios de éxito

El MVP será considerado exitoso si puede operar un recorrido real de principio a fin sin duplicar envíos y sin requerir intervención técnica constante. Debe permitir que una persona entienda el estado y la próxima acción de cada oportunidad, y que el cliente confirme que el flujo reduce trabajo repetitivo o evita pérdidas visibles.

Las métricas iniciales son:

| Métrica | Objetivo de validación |
|---|---|
| Oportunidades con estado y responsable | 100% |
| Oportunidades con próxima acción clara | Al menos 90% durante el piloto |
| Mensajes enviados sin aprobación | 0 en el flujo comercial inicial |
| Duplicados de envío | 0 |
| Borradores que requieren corrección estructural | Disminuir en cada iteración |
| Tiempo desde entrada hasta primer borrador | Medir línea base y reducirla progresivamente |
| Oportunidades detenidas por error sin alerta | 0 |
| Cliente capaz de operar el flujo tras capacitación | Sí, sin depender de desarrollo |

Los objetivos numéricos son metas internas de validación, no promesas comerciales que deban publicarse sin evidencia.

## 14. Decisión que sigue

La siguiente decisión concreta es elegir el primer proceso real para el dogfooding. Mi recomendación es comenzar con el proceso de cotización de Polaris Web Studio, porque permite validar la propuesta dentro de la propia operación antes de exponerla a un cliente externo.

Después hay que documentar ese proceso con cinco elementos: entrada exacta, campos obligatorios, reglas de clasificación, plantilla de borrador y condiciones de aprobación. Con esa información se puede construir el primer prototipo sin intentar resolver todos los casos de Office Flow.

## 15. Resumen final

Polaris Flow debe comenzar pequeño y demostrar una sola idea con mucha claridad: **el trabajo comercial no se queda detenido entre una solicitud y el siguiente paso**. Office Flow será el primer recorrido de leads, cotizaciones, documentos y seguimiento. La automatización preparará y organizará; una persona aprobará lo importante; el sistema registrará cada decisión.

La marca seguirá siendo una sola. Polaris Flow será el sistema; Office Flow será su primera operación productizada. La prioridad inmediata no es construir una plataforma enorme, sino demostrar un flujo real, medible, seguro y repetible.

## Referencias internas

[1]: [Brief estratégico de Polaris Flow](./polaris-flow-brief.md)

[1] Brief estratégico y guía de producto de Polaris Flow, versión 1.0, repositorio interno de Polaris Web Studio.
