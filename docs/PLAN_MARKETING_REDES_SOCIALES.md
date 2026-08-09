# Plan de Marketing y Crecimiento en Redes Sociales — Polaris Web Studio

**Autor:** Claude (Meridian)
**Fecha:** Julio 2026
**Estatus:** Plan inicial, punto de partida desde 0 seguidores
**Cuenta:** @polariswebstudio (Instagram, recién creada)

---

## 0. Punto de partida real (para no perder de vista el objetivo)

- Instagram con 0 seguidores, cuenta recién creada.
- Sin clientes reales todavía — el portafolio actual son 3 prototipos propios (Lúmina Sky, Nexus Realty, Chroma Tech Store), no proyectos entregados a un cliente pagante.
- Mercado inicial: Punta Cana / República Dominicana. Los servicios son escalables a cualquier lugar, pero el arranque es 100% local — es donde vas a poder generar la primera prueba social real (reuniones en persona, referidos boca a boca, recomendaciones dentro de un mismo sector como hoteles o inmobiliarias).
- 3 paquetes con precio fijo y público: Destello ($299), Constelación ($699), Nova ($1,299+) — esto es una ventaja competitiva real frente a agencias que solo cotizan "a consulta", y debe ser un pilar de contenido, no un secreto.
- WhatsApp real de contacto ya integrado en el sitio (`+1 829 920 0544`) — es el canal de cierre, no Instagram. Instagram es el canal de descubrimiento y confianza; el objetivo de cada publicación es empujar tráfico hacia WhatsApp o `/cotizar`, no acumular likes por sí solos.

**Meta de las primeras 12 semanas:** no es "viralizar" — es construir una cuenta que, si un dueño de negocio de Punta Cana la encuentra buscando referencias, transmita en 15 segundos de scroll que Polaris es una agencia real, activa, con criterio y accesible en precio. Los primeros clientes van a llegar más por WhatsApp/referidos que por Instagram orgánico puro — Instagram construye la credibilidad que hace que esa conversación cierre.

---

## 1. Contexto cultural — Punta Cana / República Dominicana

Esto no es opcional, es lo que separa contenido genérico de contenido que un dueño de negocio local realmente comparte y comenta:

- **El negocio se cierra por WhatsApp, no por formulario.** Cualquier pieza de contenido debe terminar empujando a WhatsApp, con lenguaje directo ("Escríbeme", "Te leo por WhatsApp"), nunca solo "más información en el link de la bio" sin más.
- **Punta Cana vive del turismo y el sector inmobiliario/hotelero.** Los negocios con más presupuesto digital real hoy son: hoteles boutique, excursiones/tour operadores, restaurantes de zona turística, inmobiliarias (mercado de segunda vivienda para extranjeros), y comercios que venden a turistas. Esto encaja exactamente con lo que ya está en el portafolio (Lúmina Sky = hotel, Nexus Realty = inmobiliaria).
- **Bilingüe, pero con jerarquía clara.** El copy del sitio ya sigue esta regla (español como default, inglés como alternativa) — en redes, el feed principal va en español (es el idioma real de quien decide comprar en RD), pero conviene tener subtítulos/caption bilingüe en piezas dirigidas a inmobiliarias o negocios turísticos que le venden a extranjeros — ahí sí hay una audiencia angloparlante real detrás de la cuenta que la sigue (dueños de negocios que atienden expats).
- **Español neutro, sin dominicanismos forzados ni marketing "genérico latino".** No imitar jerga dominicana si no es natural — un negocio local detecta el postureo al instante. Mejor: ser claro, directo, profesional, con un toque cercano (tú, no usted, en redes — a diferencia del resto del sitio que sí usa tú/usted formal; en Instagram el tono puede ser un poco más cercano sin dejar de ser profesional).
- **Estacionalidad real:** temporada alta turística (diciembre-abril) es cuando hoteles/tour operadores tienen más presupuesto y urgencia de tener su web lista antes de la temporada — ideal para contenido dirigido a ese nicho en octubre-noviembre ("Antes de que llegue diciembre, ¿tu web está lista para recibir reservas?"). Fuera de temporada alta (mayo-noviembre) es mejor momento para apuntar a PYMEs/comercio local en general, no solo turismo.
- **La competencia real no son otras agencias de diseño premium — son freelancers de Fiverr y "el sobrino que sabe de computadoras".** El contenido debe justificar por qué pagar $299-$1,299 por algo hecho por una agencia vale más que la opción de $50 — la respuesta real (y verificable) es: código 100% original sin plantillas, entrega en 1-2 semanas con fecha de compromiso real, y ahora también datos de rendimiento verificables (Lighthouse) que un freelancer de Fiverr casi nunca puede mostrar.

---

## 2. Línea gráfica para redes (derivada de la marca real del sitio, no inventada)

Todo sale de `src/index.css` — no hay que diseñar una identidad nueva desde cero, hay que *adaptar* la que ya existe a formato Instagram.

**Paleta:**
- Primario: `#4f46e5` (índigo) — color de acento en casi todo contenido, CTAs, textos destacados.
- Acentos: `#0284c7` (azul) y `#7c3aed` (violeta) — para variar sin salirse de la familia de color.
- Sub-paleta "Nexus Luxury" (dorado `#D4AF37` + verde esmeralda oscuro `#0a1628`/`#040b17`) — reservar exclusivamente para contenido de la vertical inmobiliaria/hotelera premium (ej. posts sobre Nexus Realty o dirigidos a hoteles), no mezclar con el resto del feed.
- Fondo: modo oscuro como default (así es como se ve el sitio real) — el feed de Instagram debe sentirse coherente con esa estética oscura/"glass" en vez de fondos blancos genéricos de agencia.

**Estilo visual:**
- Estética "liquid glass" / paneles translúcidos con blur, ya usada en todo el sitio (`.glass-panel`) — replicar con overlays semitransparentes sobre capturas de pantalla reales del propio trabajo.
- Tipografía display en negrita/black para titulares dentro de las piezas gráficas (igual que `font-display font-black` del sitio), texto de apoyo más liviano.
- Mockups de dispositivos (ya existe `MockupFrame.tsx` en el código — se puede exportar la misma estética de "browser frame"/mockup de laptop y celular para mostrar los sitios reales en redes, en vez de screenshots pelados).
- Nunca stock photos genéricas de "equipo sonriendo en oficina" — no existe ese equipo ni esa oficina todavía, y se nota. Mejor: pantallas reales, código real, procesos reales, o el fundador mostrando su cara (esto último construye más confianza que cualquier gráfico).

**Herramientas de producción (con lo que ya tenés acceso):**
- Canva (ya integrado a las herramientas de Meridian vía MCP) — crear ahí una plantilla de marca una sola vez con esta paleta y tipografía, y reutilizarla para todos los posts de tipo carrusel/estático. Puedo armar esa plantilla base si querés.
- Capturas de pantalla reales del propio código/sitio en VS Code o el navegador — contenido "detrás de cámara" no necesita edición pesada, solo consistencia de color.
- Para Reels: cualquier editor simple (CapCut es gratis y es el estándar de facto en 2026) — no hace falta nada sofisticado, la sustancia importa más que la producción en los primeros meses.

---

## 3. Pilares de contenido (para no quedarte sin qué publicar)

Seis categorías fijas, rotando entre ellas — así nunca hay que pensar "¿qué publico hoy?" desde cero, solo "hoy toca pilar X":

1. **Proceso / detrás de cámara.** Mostrar el trabajo real: escribiendo código, armando un mockup, una reunión de planificación. Es el contenido más fácil de producir (no requiere diseño) y el que más genera confianza porque prueba que hay una persona real detrás, no una plantilla.
2. **Portafolio con datos verificables.** Cada uno de los 3 proyectos (Lúmina Sky, Nexus Realty, Chroma Tech Store) da para varios posts distintos: uno mostrando el diseño, otro mostrando el score real de velocidad (ya tenés los números reales: Lúmina Sky 97/100, Nexus Realty 88/100 en PageSpeed desktop), otro explicando una decisión de UX específica que se tomó y por qué.
3. **Educación para dueños de negocio (no para desarrolladores).** Tips prácticos y cortos: "3 señales de que tu página web te está espantando clientes", "¿Por qué WhatsApp Business no reemplaza tener una web?", "Lo que Google penaliza sin que lo sepas". Esto es lo que más comparte un dueño de PYME porque le sirve incluso si no contrata todavía — construye autoridad.
4. **Oferta / precios / CTA directo.** Recordatorios directos de los 3 paquetes y sus precios, la oferta de lanzamiento (25% de descuento, con fecha límite real: expira el 17 de agosto de 2026 — usar esa fecha como excusa de urgencia real en el arranque de la cuenta).
5. **Contexto local / sectorial.** Contenido dirigido específicamente a hoteles, inmobiliarias, restaurantes de Punta Cana — "Si tienes un negocio de excursiones en Punta Cana y todavía recibes reservas solo por WhatsApp sin web, esto es para ti."
6. **Fundador / cultura de marca.** Quién es Cristian, por qué fundó Polaris, la filosofía de "código 100% original, sin plantillas". Este pilar es el que humaniza todo lo demás — sin él, los pilares 1-5 se sienten corporativos.

Regla de mezcla sugerida por semana (ver calendario abajo): más peso a Proceso + Educación al inicio (son los que no dependen de tener clientes reales), y aumentar el peso de Portafolio/Oferta a medida que haya casos reales que mostrar.

---

## 4. Formato por tipo de contenido

- **Reels (prioridad #1 en 2026, es lo que el algoritmo de Instagram distribuye a no-seguidores):** el formato que más debe usarse para crecer desde 0. Ideal para pilares 1 (proceso, timelapse de código/diseño) y 3 (educación, cara a cámara hablando directo).
- **Carruseles:** ideal para pilares 2 (portafolio, mostrar 3-5 slides de un mismo proyecto) y 3 (educación en formato de lista, "5 señales de que...").
- **Posts estáticos (feed):** el formato de menor prioridad de alcance, reservarlo para anuncios puntuales (oferta, nuevo proyecto lanzado) más que para contenido regular.
- **Stories diarias:** no cuentan para el crecimiento de seguidores nuevos tanto como Reels, pero son las que mantienen "caliente" a quien ya te sigue — encuestas, detrás de cámara sin editar, contador regresivo de la oferta de lanzamiento.

---

## 5. Frecuencia realista desde 0

Publicar todos los días desde el día 1 sin sistema lleva al burnout en 2 semanas. Mejor una cadencia sostenible que se pueda mantener 3+ meses seguidos:

| Tipo | Frecuencia |
|---|---|
| Reels | 3 por semana (lunes, miércoles, viernes) |
| Carrusel o post estático | 1-2 por semana (relleno los días sin Reel) |
| Stories | Todos los días que se publique algo — mínimo 3-4 stories esos días, aunque sea resubiendo el propio post con un sticker o encuesta |
| Reels con audio de tendencia | Al menos 1 de los 3 semanales, usando un audio que esté sonando esa semana (aumenta muchísimo el alcance a no-seguidores) |

**Esto ya está semi-automatizado del lado de Meridian**: el pendiente #20 de `plan.md` (`weekly-trends-report`) manda cada lunes por Telegram tendencias de Google reales de RD con un ángulo de contenido sugerido — usar eso como input real para decidir el Reel del lunes, en vez de improvisar.

---

## 6. Agenda paso a paso — primeras 12 semanas

### Semana 0 — Preparación (antes del primer post)
- [ ] Completar el perfil de Instagram: foto de perfil (logo de Polaris, no una persona sola — la marca debe ser reconocible), bio con propuesta de valor clara + link a `/cotizar` (usar un link-in-bio simple o directo a la web), categoría de negocio "Agencia de diseño y desarrollo web".
- [ ] Armar 3 Highlights fijos: "Servicios" (los 3 paquetes con precio), "Portafolio" (los 3 proyectos), "Contacto" (WhatsApp directo).
- [ ] Preparar un banco de 12-15 piezas de contenido antes de publicar la primera — así las primeras 4 semanas no dependen de producir en tiempo real bajo presión.
- [ ] Armar la plantilla de marca en Canva (paleta + tipografía, ver sección 2) para no rediseñar cada post desde cero.

### Semanas 1-2 — Arranque con pilares "seguros" (no dependen de clientes)
- Enfoque: 80% pilar Proceso + Educación, 20% Fundador.
- Objetivo real de esta etapa: no es crecer rápido, es establecer el ritmo de publicación y que la cuenta deje de verse "vacía" (mínimo 8-10 posts en el feed antes de empezar a invitar gente a seguirla).
- Ejemplo de semana tipo:
  - Lunes: Reel — "Así se ve por dentro el código de una web 100% hecha a medida" (timelapse de VS Code).
  - Miércoles: Reel — cara a cámara, pilar Educación ("3 señales de que tu web te está espantando clientes").
  - Viernes: Reel — Fundador, por qué existe Polaris.
  - Carrusel intermedio: los 3 paquetes con precios claros.

### Semanas 3-4 — Portafolio + primer empuje de oferta
- Enfoque: introducir pilar Portafolio (los 3 proyectos existentes) y pilar Oferta (25% de descuento, con countdown real hacia el 17 de agosto).
- Empezar a etiquetar ubicación "Punta Cana, República Dominicana" en cada post (mejora el alcance local real).
- Empezar a seguir/interactuar activamente (no solo publicar) con cuentas de negocios reales de Punta Cana — hoteles chicos, inmobiliarias, restaurantes — comentando de forma genuina, no genérica. Esto es tan importante como publicar: en cuentas nuevas, el crecimiento real de los primeros 500 seguidores viene más de interacción activa que de publicar y esperar.

### Semanas 5-8 — Ritmo sostenido + contenido sectorial
- Mantener cadencia de la sección 5.
- Introducir pilar Contexto local: contenido dirigido específicamente a 1-2 nichos por semana (ej. semana dedicada a hoteles/tour operadores, semana dedicada a inmobiliarias).
- Primer intento real de contacto directo: usar el contenido como excusa para escribirle por WhatsApp a 5-10 negocios reales de Punta Cana por semana ("vi tu Instagram, no tienes web, esto es lo que te ofrezco") — el contenido de Instagram sirve de respaldo/prueba cuando esa conversación empiece.
- Revisar métricas cada 2 semanas (ver sección 7) y ajustar qué pilar está funcionando mejor.

### Semanas 9-12 — Consolidación
- Si ya hay al menos 1 cliente real cerrado: empezar a incorporar contenido de cliente real (con su permiso) — esto es infinitamente más valioso que seguir mostrando solo los 3 prototipos propios, y debe priorizarse en cuanto exista.
- Evaluar pauta paga (Meta Ads) recién en este punto, no antes — sin oferta validada ni contenido probado, pautar es quemar presupuesto (esto ya está alineado con la decisión ya tomada en `plan.md` #25, Fase 4: "condición explícita para arrancar: oferta validada + presupuesto asignado").
- Auditoría de qué contenido tuvo mejor alcance/guardados/comentarios en las primeras 12 semanas, y doblar la apuesta en ese formato específico para el próximo trimestre.

---

## 7. Métricas para revisar cada 2 semanas (no cada día — obsesionarse día a día genera ansiedad, no mejores decisiones)

- **Alcance de Reels a no-seguidores** (métrica de descubrimiento — el objetivo real en esta etapa).
- **Guardados y compartidos** por encima de likes — son la señal real de que el contenido resuena (un like es gratis, guardar/compartir cuesta más esfuerzo).
- **Clics al link de la bio / mensajes de WhatsApp iniciados desde Instagram.** Esta es la métrica que de verdad importa para el negocio — seguidores sin conversación real no valen nada.
- **Tasa de crecimiento de seguidores por semana**, solo como termómetro general, nunca como objetivo en sí mismo.

---

## 8. Banco inicial de 15 ideas de contenido (para no arrancar en blanco)

1. Reel: timelapse armando una landing page desde cero hasta el diseño final.
2. Reel: "¿Cuánto cuesta REALMENTE una página web en 2026?" — desglose honesto de los 3 paquetes.
3. Carrusel: antes/después visual de un mockup mal hecho (genérico, de plantilla) vs. uno hecho a medida.
4. Reel cara a cámara: "3 señales de que tu página web te está espantando clientes".
5. Carrusel: recorrido del portafolio — Lúmina Sky, con foco en el motor de reservas.
6. Post: "97/100 en velocidad de carga, verificado con Google PageSpeed" — captura real del resultado de Lúmina Sky.
7. Reel: "Por qué NO uso plantillas de Wordpress/Wix para ningún proyecto" — pilar Fundador + diferenciación real.
8. Carrusel: recorrido del portafolio — Nexus Realty, foco en el filtrado rápido de propiedades.
9. Reel educativo: "SEO no es un plugin que se instala después" (reusar el ángulo real del blog ya escrito sobre SEO Core).
10. Post: anuncio de la oferta de lanzamiento con countdown real hacia el 17 de agosto.
11. Reel: "Así integro IA real (no un chatbot genérico) en las webs que hago" — mostrar Atlas Assistant o el chatbot con IA.
12. Carrusel dirigido a hoteles/tour operadores: "Antes de que llegue diciembre, ¿tu web está lista para recibir reservas?".
13. Reel: recorrido del proceso completo en 60 segundos — planificas, diseñamos, lanzamos (los 3 pasos reales ya descritos en la web).
14. Post educativo: "WhatsApp Business no reemplaza tener una web — esto es lo que sí hace tu web por ti".
15. Reel Fundador: quién es Cristian, por qué fundó Polaris, qué lo diferencia.

---

## 9. Lo que este plan explícitamente NO incluye (y por qué)

- **No incluye pauta paga (Meta Ads).** Ya hay una decisión tomada al respecto en `plan.md` #25 — arranca recién con oferta validada, no antes.
- **No incluye TikTok ni otras redes todavía.** Mejor dominar un solo canal con un sistema sostenible que dispersar el mismo esfuerzo en 3 redes a la vez sin ninguna funcionando bien. Se puede reevaluar sumar TikTok una vez que el sistema de Instagram esté funcionando solo (mes 4-6).
- **No incluye testimonios de clientes** porque todavía no existen — no fabricarlos. En cuanto exista el primer cliente real, ese testimonio (aunque sea uno solo) vale más que cualquier otra pieza de contenido de este plan.
