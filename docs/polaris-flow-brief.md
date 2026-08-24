# Polaris Flow — Brief estratégico y guía de producto

**Versión:** 1.0  
**Estado:** Guía base para definición, diseño y construcción  
**Marca matriz:** Polaris Web Studio  
**Tagline de trabajo:** *Operations in motion.*

## 1. Definición en una frase

**Polaris Flow convierte trabajo repetitivo y disperso en recorridos operativos visibles, aprobables y medibles.** El producto ayuda a una empresa a recibir solicitudes, ordenar información, preparar documentos o respuestas, obtener aprobación humana y dar seguimiento sin depender de hojas sueltas, conversaciones perdidas o de que una sola persona recuerde todo.

> Polaris Flow no vende automatizaciones aisladas. Diseña una capa operativa alrededor de cómo trabaja realmente cada negocio.

## 2. Problema que resuelve

Muchas pequeñas y medianas empresas no tienen un problema de falta de esfuerzo, sino de falta de continuidad. Los leads llegan por distintos canales, la información queda repartida entre WhatsApp, correo y hojas de cálculo, las cotizaciones se preparan manualmente, los documentos se envían sin un proceso claro y nadie sabe con certeza cuál es el siguiente paso.

El costo aparece como trabajo duplicado, respuestas tardías, oportunidades olvidadas, errores administrativos y dependencia excesiva del dueño o de una persona clave. Polaris Flow hace visible ese recorrido y asigna a cada oportunidad un estado, una responsabilidad y una acción siguiente.

## 3. Posicionamiento

Polaris Flow debe posicionarse como **ingeniería operativa digital para negocios que necesitan que el trabajo avance**, no como una herramienta genérica de automatización ni como un chatbot con muchas integraciones.

Su diferencia principal es combinar automatización con reglas propias del negocio y aprobación humana. El sistema puede clasificar, validar, preparar borradores y recordar tareas, pero no debe enviar una cotización, publicar un documento o tomar una decisión sensible sin autorización cuando el flujo lo requiera.

| Elemento | Definición de Polaris Flow |
|---|---|
| Categoría | Capa operativa y automatización personalizada |
| Promesa | Que ninguna oportunidad se pierda entre la entrada y el siguiente paso |
| Diferenciador | Flujos visibles, reglas del cliente y aprobación humana |
| Enfoque inicial | Empresas de servicios con leads, cotizaciones, documentos y seguimiento repetitivo |
| Modelo inicial | Servicio productizado con configuración personalizada; no comenzar como SaaS autoservicio |
| Resultado que se vende | Continuidad operativa, no una lista de integraciones |

## 4. Público inicial

El cliente ideal es una empresa pequeña o mediana que ya recibe suficientes solicitudes para sentir desorden, pero que todavía opera con procesos manuales. En República Dominicana, el enfoque inicial puede concentrarse en agencias, inmobiliarias, clínicas, proveedores de servicios profesionales, empresas de mantenimiento, negocios de hospitalidad y equipos comerciales que cotizan con frecuencia.

No es necesario que el cliente sea técnicamente avanzado. De hecho, el producto debe ser especialmente valioso para equipos que no quieren aprender una plataforma compleja. Polaris se encarga de mapear el proceso, construir el flujo y presentar una experiencia sencilla para que el equipo solo tenga que revisar, aprobar y actuar.

## 5. Cómo funciona el producto

El lenguaje central de Polaris Flow debe mantenerse alrededor de cuatro etapas. El cliente no compra “triggers”, “webhooks” o “nodos”; compra un recorrido en el que el trabajo entra, se ordena, se prepara y queda listo para una decisión.

| Etapa | Qué ocurre | Ejemplo en Office Flow |
|---|---|---|
| **Recibe** | El sistema captura la solicitud desde el canal autorizado | Nuevo lead desde formulario, correo o WhatsApp |
| **Ordena** | Clasifica, valida y detecta información faltante | Tipo de cliente, urgencia, servicio y datos incompletos |
| **Prepara** | Genera un borrador utilizando reglas aprobadas | Cotización, documento, respuesta o recordatorio |
| **Confirma** | Una persona revisa y aprueba el siguiente paso | Nada se envía sin aprobación humana |

Cada flujo debe mostrar siempre un **estado actual**, una **persona responsable**, un **último evento** y una **siguiente acción**. Esa visibilidad es una parte esencial del producto, no una función secundaria.

## 6. Primer producto: Office Flow

**Office Flow** es el primer flujo productizado de Polaris Flow. Está pensado para equipos que reciben leads, preparan cotizaciones o documentos y necesitan hacer seguimiento hasta cerrar la oportunidad.

Su alcance inicial debe incluir entrada ordenada de leads, plantillas con reglas del negocio, validación de datos, creación de borradores, aprobación humana antes del envío, estados visibles por oportunidad, recordatorios y un historial de decisiones. La primera versión no debe intentar resolver todos los procesos internos del cliente; debe concentrarse en un recorrido de alto valor y fácil de explicar.

El mensaje comercial recomendado es: **“Cotizaciones, documentos, aprobaciones y seguimiento en un solo recorrido operativo.”** La demostración debe mostrar un caso concreto, desde la llegada de un lead hasta la preparación de una cotización pendiente de aprobación.

## 7. Arquitectura de producto

Polaris Flow debe ser una sola línea de producto con un motor operativo común y diferentes aplicaciones verticales. Esto permite reutilizar arquitectura, estados, permisos, auditoría, notificaciones y componentes de interfaz sin convertir la marca en una colección desordenada de herramientas.

| Producto o módulo | Papel dentro de la arquitectura |
|---|---|
| **Office Flow** | Primer flujo comercial: leads, cotizaciones, documentos y seguimiento |
| **Chat Convert** | Convierte conversaciones de WhatsApp u otros canales en oportunidades con siguiente paso |
| **Villa Flow** | Aplicación vertical para reservas, equipos, mantenimiento y tareas de hospitalidad |
| **Review Intelligence** | Módulo de análisis de reseñas; puede vivir inicialmente dentro de Local Lift/Ascenso y después conectarse al motor Flow |
| **Asistente interno de Polaris** | Producto interno de conocimiento; no debe mezclarse comercialmente con Flow en la primera etapa |
| **Polaris Agents Lab** | Línea experimental separada; no debe presentarse como parte de la oferta operativa inicial |

La regla es: **un motor, diferentes operaciones**. Cada vertical puede tener su propio onboarding, vocabulario y resultado, pero comparte el mismo lenguaje de estados, aprobaciones, historial y siguiente acción.

## 8. Flujo comercial y de implementación

Polaris Flow no debería comenzar con una pantalla que obligue al cliente a elegir entre decenas de integraciones. La primera conversación debe descubrir dónde se pierde el trabajo y qué debería ocurrir después.

El recorrido recomendado es el siguiente: primero se identifica el proceso repetitivo y se documenta el flujo actual; luego se selecciona un único recorrido prioritario; después Polaris presenta un mapa simple con entradas, reglas, aprobaciones y salidas; con la aprobación del cliente se construye una primera versión; finalmente se prueba con casos reales, se entrega al equipo y se mide durante un periodo inicial.

El onboarding debe ser acompañado al principio. La empresa cliente no debería tener que construir por sí misma un sistema complejo. La configuración puede incluir formularios, correo, WhatsApp u otras integraciones autorizadas, pero las integraciones son medios, no el producto principal.

## 9. Modelo de oferta recomendado

La oferta inicial debe ser un **servicio productizado de implementación**, no una suscripción de software genérica. Esto reduce la complejidad técnica y permite aprender qué flujos tienen mayor valor antes de convertirlos en módulos más estandarizados.

| Fase comercial | Entregable |
|---|---|
| Diagnóstico | Mapa del proceso actual y punto principal de pérdida |
| Diseño | Flujo propuesto con estados, reglas, responsables y aprobaciones |
| Implementación | Automatización configurada alrededor del proceso aprobado |
| Activación | Prueba con casos reales y capacitación breve |
| Operación | Ajustes, seguimiento y mejoras según el plan contratado |

Los precios y paquetes deben definirse después de validar el costo real de implementación y el valor económico del problema para cada vertical. La comunicación inicial debe vender claridad y continuidad, no horas de desarrollo ni cantidad de automatizaciones.

## 10. Principios de producto

Polaris Flow debe cumplir cinco principios. Primero, **visibilidad antes que complejidad**: el usuario debe saber qué está ocurriendo sin entender la infraestructura. Segundo, **aprobación donde importa**: automatizar la preparación no significa eliminar el criterio humano. Tercero, **reglas del cliente**: cada flujo se adapta a políticas reales y no a una plantilla arbitraria. Cuarto, **historial y responsabilidad**: cada decisión importante debe poder rastrearse. Quinto, **comenzar pequeño**: el primer flujo debe resolver un problema específico antes de expandirse.

## 11. Voz y lenguaje

La comunicación debe ser clara, precisa y segura. Polaris Flow debe sonar como un socio de operaciones que entiende el negocio, no como una herramienta técnica que presume automatizaciones.

Se recomienda usar expresiones como **“el trabajo sigue avanzando”**, **“un siguiente paso claro”**, **“nada se envía sin aprobación”**, **“hecho alrededor de tus reglas”** y **“empieza con un flujo, no con una plataforma”**. Deben evitarse promesas absolutas como “automatiza todo”, “cero trabajo humano” o “inteligencia artificial que maneja tu negocio sola”.

## 12. Logo y arquitectura de marca

La recomendación es utilizar **un único sistema de marca: Polaris Flow**, con el logo de Polaris Flow como identidad principal, usando la tipografía oficial de Polaris y una firma cromática índigo que lo diferencie de Local Lift. No conviene crear un logo completamente distinto para Office Flow, Chat Convert o Villa Flow en esta etapa. Logos independientes harían que cada módulo pareciera un producto sin relación y aumentarían innecesariamente el trabajo de marca, diseño y reconocimiento.

El asset principal recomendado es:

`/brand/polaris-flow-lockup-horizontal-dark.svg`

Para fondos claros debe utilizarse la variante:

`/brand/polaris-flow-lockup-horizontal-light.svg`

El isotipo independiente debe utilizarse en favicons, avatares, tarjetas de flujo, estados compactos y espacios donde el lockup horizontal no quepa:

`/brand/polaris-flow-mark.svg`

| Uso | Tratamiento recomendado |
|---|---|
| Página principal de Polaris Flow | Lockup horizontal Polaris Flow |
| Favicon o avatar | Isotipo Polaris Flow |
| Office Flow | Nombre tipográfico dentro del sistema Polaris Flow; sin logo nuevo |
| Chat Convert y Villa Flow | Nombre del módulo + etiqueta de categoría o vertical |
| Presentaciones comerciales | Lockup Polaris Flow y, debajo, nombre del flujo |
| Producto futuro totalmente independiente | Evaluar una nueva identidad solo si alcanza mercado, equipo y operación propios |

La identidad actual usa un fondo azul profundo `#0F172A`, el índigo oficial de Polaris `#4F46E5` con hover `#4338CA`, y el teal operativo `#2DD4BF` con teal claro `#99F6E4`. Como Local Lift ya utiliza el teal como color principal, Polaris Flow debe apropiarse del índigo como su color de acción y navegación. El teal queda como acento secundario para movimiento, conexiones, estados activos y señales de continuidad; no debe dominar el logo ni los CTA principales de Flow.

## 13. Recomendación final de marca

**Polaris Flow debe ser la marca paraguas. Office Flow debe ser el primer producto, no una marca separada.** La forma correcta de presentarlo sería:

> **Polaris Flow**  
> **Office Flow**  
> Cotizaciones, documentos, aprobaciones y seguimiento en un solo recorrido operativo.

De esta manera, el cliente reconoce primero la plataforma y luego entiende el flujo específico que está comprando. El nombre Office Flow puede tener una firma visual propia —por ejemplo, un color secundario o una etiqueta “First build”—, pero debe seguir dependiendo claramente de Polaris Flow.

## 14. Métricas de éxito

Durante la primera etapa se deben medir resultados operativos, no únicamente registros de usuarios. Las métricas más importantes son el tiempo desde la entrada del lead hasta el primer borrador, la cantidad de oportunidades sin siguiente acción, el porcentaje de cotizaciones aprobadas, el tiempo promedio de respuesta, la reducción de tareas manuales repetidas y la cantidad de decisiones que pueden rastrearse de principio a fin.

También debe medirse el aprendizaje comercial: qué vertical solicita más el servicio, qué flujo tiene mayor retorno, cuánto cuesta implementarlo y qué partes pueden convertirse en componentes reutilizables.

## 15. Roadmap recomendado

La primera fase debe concentrarse en definir y demostrar Office Flow con un único recorrido completo. La segunda debe convertir los componentes repetidos —estados, aprobaciones, plantillas, historial y notificaciones— en un motor reutilizable. La tercera puede probar Chat Convert con una empresa que reciba oportunidades por conversación. La cuarta debe explorar una vertical concreta como Villa Flow. Solo después de validar demanda y operación conviene decidir si Polaris Flow se convierte en una plataforma más autoservicio.

Review Intelligence puede continuar como una capacidad de Local Lift/Ascenso mientras se valida su valor. Polaris Agents Lab debe permanecer separado como laboratorio experimental y no diluir el posicionamiento comercial de Polaris Flow.

## 16. Decisiones que todavía deben cerrarse

Antes de construir una versión comercial completa hay que definir el primer vertical objetivo, el flujo exacto de Office Flow, las integraciones mínimas permitidas, el nivel de soporte incluido, la forma de cobrar implementación y operación, el tratamiento de datos del cliente y los límites de aprobación humana.

La decisión más importante es no construir una plataforma grande antes de tener un caso de uso repetible. El siguiente paso correcto es seleccionar un flujo real, documentarlo con entradas y salidas, construir una demostración controlada y medir si el cliente percibe una mejora concreta.

## Resumen ejecutivo

**Polaris Flow es la línea de automatización y operaciones de Polaris Web Studio.** Su propósito es convertir procesos repetitivos y dispersos en recorridos visibles, aprobables y medibles. El primer producto será Office Flow, enfocado en leads, cotizaciones, documentos y seguimiento. La marca debe mantenerse unificada: Polaris Flow será el logo y sistema principal; Office Flow y los futuros verticales funcionarán como nombres de productos o módulos, no como marcas independientes. Esta arquitectura permite aprender con implementaciones reales, reutilizar el motor operativo y expandirse sin perder claridad.
