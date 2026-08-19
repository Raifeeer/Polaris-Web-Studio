# Polaris AI Roadmap & Polaris Agents Lab

> **Estado:** visión y planificación futura. No implementar todavía.
>
> **Propósito:** conservar las ideas aprobadas para retomarlas después de terminar el trabajo actual de Polaris, sin perder el contexto si continúa otra sesión o agente.

## 1. Dirección general

Polaris puede explorar dos líneas distintas pero relacionadas. La primera consiste en incorporar capacidades de búsqueda y conocimiento inteligente dentro del producto actual, especialmente para mejorar Ascenso y facilitar la operación interna. La segunda consiste en crear un proyecto experimental independiente, **Polaris Agents Lab**, donde se prueben ideas más creativas sin obligarlas a convertirse inmediatamente en servicios comerciales.

La prioridad actual no es consumir crédito por consumirlo ni convertir cada experimento en una funcionalidad de producción. La prioridad es aprender qué experiencias de búsqueda fundamentada, exploración de conocimiento y análisis de información podrían convertirse en ventajas reales para Polaris en el futuro.

## 2. Funciones futuras dentro de Polaris

### 2.1 Review Intelligence para Ascenso

**Review Intelligence** sería una capacidad del paquete Ascenso para estudiar las reseñas recientes y convertirlas en un análisis útil para el negocio. No se limitaría a contar estrellas: buscaría patrones, temas repetidos, señales de satisfacción o frustración y oportunidades de mejora.

#### Objetivo

Ayudar a que el cliente entienda qué está diciendo realmente su público y qué acciones deberían priorizarse para mejorar su presencia local.

#### Posibles entradas

- Reseñas recientes obtenidas mediante una fuente legal y autorizada.
- Reseñas aportadas por el cliente en un archivo o mediante una exportación.
- Información pública del negocio, como descripción, categoría, servicios, horarios y sitio web.
- Datos del diagnóstico de Local Lift y del paquete Ascenso.
- Respuestas existentes del negocio, cuando estén disponibles.

#### Posibles resultados

- Resumen ejecutivo de la percepción actual.
- Temas positivos que conviene reforzar.
- Problemas repetidos o señales de fricción.
- Clasificación por temas: servicio, tiempo de respuesta, precio, calidad, limpieza, ubicación, comunicación y otros.
- Detección de diferencias entre la promesa del negocio y la experiencia descrita por clientes.
- Evolución temporal de la percepción, cuando haya suficientes datos.
- Recomendaciones personalizadas de buenas prácticas.
- Ideas de respuestas y mejoras de comunicación, siempre como propuestas revisables.
- Sección de limitaciones y nivel de confianza para evitar presentar conclusiones débiles como hechos.

#### Encaje con Ascenso

Review Intelligence debe aparecer como una parte del informe de Ascenso y no como una herramienta genérica independiente. La experiencia debe explicar qué se encontró, por qué importa y qué puede hacer el negocio con esa información.

#### Límites importantes

La función solo debe analizar datos que Polaris pueda obtener legalmente o que el cliente entregue. No debe prometer acceso ilimitado a todas las reseñas si la fuente utilizada no lo permite. Cada negocio debe permanecer aislado de los demás, y los datos de un cliente nunca deben aparecer en las respuestas de otro.

#### Evolución sugerida

1. Prototipo con archivos de reseñas proporcionados por el usuario.
2. Análisis con un conjunto pequeño y revisión manual de la calidad.
3. Ingesta automatizada desde fuentes autorizadas, si existe una vía viable.
4. Integración con el informe de Ascenso.
5. Medición de utilidad: temas correctos, recomendaciones accionables y errores detectados por revisión humana.

### 2.2 Asistente interno de Polaris

Sería un asistente privado para Cristian y el equipo de Polaris. No sería un chatbot público ni reemplazaría Meridian; su función sería consultar documentación operativa y ayudar a tomar decisiones sobre proyectos.

#### Corpus posible

- Guías y procesos de Polaris.
- Documentación de paquetes y servicios.
- Decisiones de producto.
- Plantillas de correos y documentos.
- Políticas de privacidad, términos y procedimientos.
- Manuales de entrega y soporte.
- Historial de proyectos, con el nivel de acceso correspondiente.
- Documentación técnica seleccionada de repositorios.

#### Preguntas que debería resolver

- “¿Qué incluye exactamente este paquete?”
- “¿Cuál es el flujo correcto después de que un cliente paga?”
- “¿Qué restricciones tiene Ascenso actualmente?”
- “¿Qué correo se debe enviar en esta etapa?”
- “¿Qué decisiones se tomaron sobre esta funcionalidad?”
- “¿Qué archivos implementan este flujo?”
- “¿Qué pendientes siguen abiertos?”

#### Reglas de comportamiento

El asistente debe citar o enlazar la fuente interna que utilizó, distinguir hechos de recomendaciones y reconocer cuando no encuentra información suficiente. No debe inventar políticas, precios, permisos ni estados de implementación.

### 2.3 Centro de ayuda de Polaris

Sería una experiencia de búsqueda inteligente para clientes, visitantes y usuarios del portal. El centro de ayuda no tendría que ser un simple listado de preguntas frecuentes: permitiría formular preguntas con lenguaje natural y devolver respuestas basadas únicamente en la documentación oficial de Polaris.

#### Áreas posibles

- Cómo funciona cada servicio.
- Qué ocurre después del pago.
- Cómo acceder al portal.
- Cómo leer un diagnóstico.
- Qué incluye cada paquete.
- Cómo solicitar revisiones.
- Cómo usar las guías de implementación.
- Facturación, tiempos y estados del proyecto.
- Privacidad, soporte y canales de contacto.

#### Principios de experiencia

La respuesta debe ser breve primero y ampliable después. Cada respuesta debe ofrecer la fuente o sección relacionada. Si la pregunta requiere una decisión específica del proyecto, el centro de ayuda debe enviar al usuario a soporte en vez de inventar una respuesta.

El centro de ayuda podría comenzar como una sección pública de Polaris y luego tener un modo autenticado para información específica del portal. La separación entre documentación pública e información privada debe diseñarse desde el principio.

### 2.4 Meridian Memory 2.0: opción secundaria

Meridian ya tiene una memoria semántica en funcionamiento. Por eso no conviene duplicarla dentro de Polaris sin una necesidad clara. La idea queda registrada como una posibilidad de expansión, no como prioridad.

Solo tendría sentido avanzar con una versión 2.0 si se identifica una mejora concreta, como mejor indexación de decisiones, navegación por proyectos, recuperación de código o explicación de por qué se tomó una decisión. Si no existe ese problema, se debe evitar crear otra interfaz de memoria que termine sin uso.

## 3. Polaris Agents Lab

### 3.1 Concepto

**Polaris Agents Lab** sería un proyecto independiente de experimentación. No tendría que compartir la experiencia comercial de Polaris ni presentarse inicialmente como un producto terminado. Sería un laboratorio público o semipúblico donde cada experimento explora una forma diferente de organizar conocimiento y conversar con él.

La idea central es agrupar los experimentos por **mundos**. Cada mundo tendría su propia identidad visual, corpus, reglas y tipo de preguntas. Todos podrían compartir una plataforma técnica común, pero deberían sentirse como experiencias distintas.

### 3.2 Mundo: Santo Domingo Conversacional

Un atlas conversacional de República Dominicana que reúna historia, barrios, arquitectura, gastronomía, música, personajes, tradiciones, lugares y relatos.

El visitante no tendría que navegar únicamente por categorías. Podría preguntar: “¿Qué relación hay entre esta zona y la arquitectura colonial?”, “¿Qué lugares puedo visitar en un recorrido de medio día?” o “¿Qué historias están asociadas con este barrio?”.

**Aprendizaje:** curación de fuentes, metadatos geográficos, respuestas culturales y separación entre hechos documentados y relatos populares.

**Potencial:** experiencia educativa, turística, cultural o demostración de tecnología hecha en República Dominicana.

### 3.3 Mundo: ADN de los Negocios Locales

Un sistema que estudie la identidad y percepción de negocios locales a partir de reseñas autorizadas, sitios web, descripciones, menús, servicios y otros datos públicos.

En vez de analizar un negocio de forma aislada, el laboratorio podría mostrar patrones: qué diferencia a un restaurante de otro, qué promesas se repiten, qué problemas generan más comentarios y qué atributos parecen asociarse con mejores experiencias.

**Aprendizaje:** análisis semántico, clasificación de temas, comparación entre negocios y diseño de esquemas estructurados.

**Potencial:** evolución futura de Local Lift, Ascenso, estudios de mercado o herramientas para agencias.

### 3.4 Mundo: Radar de Oportunidades

Un radar que busque necesidades repetidas en distintas fuentes y las convierta en hipótesis de productos o servicios.

Podría explorar preguntas como: “¿Qué problemas mencionan con frecuencia los pequeños negocios y casi nadie resuelve?”, “¿Qué tareas se repiten manualmente en agencias?”, “¿Qué servicios solicitan los negocios después de mejorar su presencia local?” o “¿Qué herramientas faltan para empresas dominicanas?”.

El radar no debe presentar sus resultados como estudios de mercado definitivos. Debe mostrar señales, fuentes, frecuencia aproximada y una explicación de por qué una señal podría representar una oportunidad.

**Aprendizaje:** investigación asistida, deduplicación de problemas, agrupación de señales y evaluación de evidencia.

**Potencial:** convertirse en una máquina interna para descubrir nuevos productos de Polaris.

### 3.5 Mundo: Oráculo de Diseño

Un espacio donde el usuario consulte decisiones de diseño, jerarquía visual, accesibilidad, interacción y branding basándose en un corpus curado de principios y casos.

Podría responder preguntas como: “¿Por qué esta pantalla se siente pesada?”, “¿Qué patrón sería mejor para este flujo?” o “¿Qué contradicciones hay entre esta interfaz y la identidad de la marca?”.

El oráculo debe explicar el razonamiento y mostrar los principios que sustentan la recomendación. No debe fingir que existe una única respuesta correcta para cada problema de diseño.

**Aprendizaje:** convertir criterio de diseño en conocimiento consultable y evaluar la calidad de respuestas subjetivas.

**Potencial:** showroom de la filosofía de diseño de Polaris y base para futuras auditorías de UI/UX.

### 3.6 Mundo: Detector de Contradicciones

Una herramienta que compare documentos y muestre dónde difieren. Podría trabajar con contratos, políticas, manuales, páginas web, propuestas, fichas de producto o versiones distintas de un mismo documento.

La salida debe separar claramente:

- Afirmaciones coincidentes.
- Afirmaciones diferentes.
- Información que aparece en una fuente pero no en otra.
- Posibles contradicciones.
- Fuente y ubicación exacta de cada hallazgo.

**Aprendizaje:** recuperación con evidencia, comparación documental y presentación responsable de incertidumbre.

**Potencial:** auditoría de contenidos, control de calidad, revisión de propuestas y herramienta de apoyo para operaciones.

### 3.7 Mundo: Universo de Ficción Consultable

Un mundo inventado con personajes, mapas, historia, facciones, leyes, economía, mitología y conflictos. El visitante podría preguntarle directamente a ese universo cómo funcionan sus reglas o qué ocurrió en un acontecimiento histórico.

La gracia es que la experiencia no sería un chatbot improvisando una historia diferente en cada respuesta. El mundo tendría una continuidad documentada y el sistema respondería de acuerdo con sus propios archivos.

**Aprendizaje:** diseño de ontologías narrativas, consistencia, relaciones entre entidades y experiencias inmersivas.

**Potencial:** proyecto artístico, juego narrativo, experiencia viral o demostración visual de Agent Search.

### 3.8 Mundo: Máquina del Tiempo de una Marca

Una experiencia que reúna versiones históricas de una marca: sitios web, campañas, textos, catálogos, logotipos, propuestas y cambios de posicionamiento.

El usuario podría preguntar qué cambió, qué se mantuvo, cuándo surgió una idea o cómo evolucionó la personalidad de la marca.

**Aprendizaje:** recuperación temporal, comparación de versiones y narración basada en archivos.

**Potencial:** servicio de auditoría de marca, documentación institucional o herramienta para rediseños.

### 3.9 Mundo: Biblioteca Viva

Una biblioteca de documentación, cursos y materiales permitidos que funcione como un tutor fundamentado. En lugar de responder con conocimiento general, debería trabajar dentro del material seleccionado y explicar de dónde sale cada respuesta.

**Aprendizaje:** diseño de rutas de aprendizaje, preguntas progresivas y control de fuentes.

**Potencial:** capacitación interna, educación especializada o producto de conocimiento para nichos concretos.

### 3.10 Mundo: Simulador de Civilizaciones

Un experimento más ambicioso: varias civilizaciones ficticias con documentos sobre su política, economía, leyes, religión, tecnología y conflictos. El usuario podría comparar cómo reaccionaría cada sociedad ante un mismo problema.

**Aprendizaje:** modelado de sistemas, relaciones complejas y consultas comparativas.

**Potencial:** experiencia educativa, juego de estrategia narrativo o instalación digital.

## 4. Arquitectura conceptual común

La plataforma no debe crear una base de datos improvisada por cada mundo. Debe tener piezas reutilizables:

1. **Corpus:** documentos, páginas, datos estructurados y metadatos.
2. **Mundo:** identidad, reglas, fuentes permitidas y tipo de experiencia.
3. **Búsqueda:** recuperación semántica, filtros y consultas.
4. **Respuesta:** síntesis fundamentada, citas y nivel de confianza.
5. **Interfaz:** búsqueda libre, preguntas sugeridas, navegación temática y visualización de fuentes.
6. **Observabilidad:** consultas, errores, costes, tiempos de respuesta y preguntas sin respuesta.
7. **Control de acceso:** separar experimentos públicos, privados y datos de clientes.
8. **Panel de aprendizaje:** registrar qué funcionó, qué falló y qué preguntas revelaron nuevas oportunidades.

Se debe utilizar el modelo general de Agent Search para experimentar y evitar activar precios configurables sin una razón clara. El crédito es específico para esta familia de productos y no debe confundirse con crédito general para Compute Engine, Firestore, BigQuery o Gemini API.

## 5. Orden de experimentación recomendado

### Fase 0: laboratorio vacío

Crear únicamente la estructura visual, el selector de mundos, una pantalla de consulta y una pantalla de fuentes. En esta fase no se necesita indexar grandes cantidades de información.

### Fase 1: tres mundos contrastantes

Comenzar con:

- **Santo Domingo Conversacional**, por su valor cultural y local.
- **ADN de los Negocios Locales**, por su conexión con el conocimiento de Polaris.
- **Universo de Ficción**, por ser el experimento más libre y visual.

Estos tres mundos prueban tres tipos de corpus: factual, analítico y narrativo.

### Fase 2: descubrimiento y verificación

Añadir:

- **Radar de Oportunidades**, para investigación.
- **Detector de Contradicciones**, para evidencia y control de calidad.

### Fase 3: showroom

Crear una presentación pública pulida con casos de uso, preguntas de ejemplo, fuentes visibles y una explicación clara de que son experimentos de Polaris.

### Fase 4: decisión

Después de observar consultas reales, decidir qué mundo merece convertirse en producto, servicio, demo comercial o simplemente experimento archivado.

## 6. Criterios de éxito

Un mundo no se considera exitoso solo porque responda preguntas. Debe cumplir al menos con estas condiciones:

- Las respuestas se apoyan en el corpus correcto.
- El sistema reconoce cuando no tiene evidencia.
- Las fuentes son visibles y comprensibles.
- La experiencia resulta interesante incluso para una persona que no conoce la tecnología.
- Las preguntas sin respuesta producen aprendizajes útiles.
- El coste por consulta y el coste de almacenamiento se pueden observar.
- El mundo tiene una identidad diferenciada, no parece una copia de otro chatbot.

## 7. Seguridad y límites

Los datos de clientes no deben mezclarse con mundos públicos. Review Intelligence debe usar únicamente datos obtenidos de forma autorizada. El Radar de Oportunidades debe diferenciar señales de hipótesis y no presentar conclusiones débiles como investigación definitiva. El Detector de Contradicciones debe mostrar diferencias documentales, no acusar automáticamente a una fuente de mentir.

Los experimentos narrativos y culturales también necesitan reglas: separar hechos, interpretación, ficción y folklore. La interfaz debe comunicar el tipo de fuente utilizada y evitar una falsa sensación de autoridad.

## 8. Decisión registrada

Por ahora, **no se implementa Polaris Agents Lab ni las funciones internas de IA**. Este documento queda como memoria de producto para retomarlo después de terminar el trabajo actual de Polaris.

La primera propuesta para retomar en el futuro es:

> Construir Polaris Agents Lab como un laboratorio de mundos consultables, comenzando con Santo Domingo Conversacional, ADN de los Negocios Locales y Universo de Ficción; después incorporar Radar de Oportunidades y Detector de Contradicciones.

Dentro de Polaris, las prioridades futuras son Review Intelligence para Ascenso, el Asistente Interno de Polaris y el Centro de Ayuda de Polaris. Meridian Memory 2.0 queda como opción secundaria porque ya existe una memoria semántica y no conviene duplicarla sin una necesidad concreta.

## Referencias técnicas

[1]: https://cloud.google.com/generative-ai-app-builder/pricing "Precios oficiales de Agent Search"
[2]: https://docs.cloud.google.com/generative-ai-app-builder/docs "Documentación oficial de Agent Search"
[3]: https://docs.cloud.google.com/generative-ai-app-builder/docs/enable-configurable-pricing "Precios configurables de Agent Search"
