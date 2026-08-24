import {
  LucideIcon,
  Globe,
  Briefcase,
  ShoppingCart,
  ShieldCheck,
  Utensils,
} from "lucide-react";

export interface Project {
  slug: string;
  title: string;
  client: string;
  clientEN?: string;
  isConcept: boolean;
  plan: "Destello" | "Constelación" | "Nova";
  planEN?: string;
  type: string;
  typeEN?: string;
  shortDesc: string;
  shortDescEN?: string;
  keyResult: string;
  keyResultEN?: string;
  resultLabel: string;
  resultLabelEN?: string;
  color: string;
  size: "small" | "wide" | "tall" | "large";
  icon: LucideIcon;
  liveUrl?: string;
  desktopImg?: string;
  mobileImg?: string;
  // Video real (mp4/h264) del scroll del sitio, en vez de un mockup
  // interactivo -- ver la nota junto a "lumina-sky-concept" más abajo.
  // Cuando existe, tiene prioridad sobre desktopImg en la vista de
  // escritorio; desktopImg queda como imagen fija de respaldo (og:image,
  // navegadores sin soporte de video, etc.).
  previewVideo?: string;
  // Frame estático (jpg/png, un solo cuadro real -- no un WebP/GIF
  // animado) del primer instante de previewVideo, mostrado como
  // atributo `poster` del <video>. Sin esto, el recuadro del mockup
  // queda vacío hasta que el navegador decide bajar los bytes reales del
  // video (Safari/iOS es conservador con esto incluso con
  // preload="auto") -- se siente como que el video "aparece de la nada"
  // recién al hacer scroll hasta esa tarjeta. Con el poster, el cuadro
  // ya está ahí desde que carga la página, y el video retoma
  // exactamente esa misma imagen al empezar a reproducirse.
  previewPoster?: string;
  // Mismo patrón que previewVideo/previewPoster, para la vista Mobile del
  // mockup (grabación aparte, viewport de teléfono real -- el sitio
  // renderiza su propio layout responsive de mobile, no es el video de
  // escritorio recortado). Tiene prioridad sobre mobileImg.
  mobileVideo?: string;
  mobilePoster?: string;
  // Proporción real de cada MP4 para que el frame y sus esquinas coincidan
  // con el archivo, aunque los proyectos usen resoluciones distintas.
  desktopVideoAspectRatio?: string;
  mobileVideoAspectRatio?: string;
  cinemaColor?: string;

  // Case Study Details
  challenge: string;
  challengeEN?: string;
  solution: string;
  solutionEN?: string;
  context: string;
  contextEN?: string;
  results: {
    label: string;
    labelEN?: string;
    value: string;
    valueEN?: string;
  }[];
  techStack: string[];
}

export const projects: Project[] = [
  {
    slug: "lumina-sky-concept",
    title: "Lúmina Sky",
    cinemaColor: "#D4AF37",
    client: "Proyecto de Concepto",
    clientEN: "Concept Project",
    isConcept: true,
    plan: "Constelación",
    planEN: "Constellation",
    type: "Turismo · Web Corporativa",
    typeEN: "Tourism · Corporate Web",
    liveUrl: "https://lumina-sky-demo.vercel.app/",
    // Historial real de esta tarjeta, por si hace falta retomar el hilo:
    // (1) mockup interactivo real (MockupFrame.tsx) -- descartado por un
    //     bug real de esquinas cuadradas en WebKit/iOS, ver la nota en
    //     VERIFIED_INTERACTIVE_SLUGS de MockupFrame.tsx (21 de julio);
    // (2) GIF, luego WebP animado a distintas resoluciones/fps -- WebP a
    //     1600x1000@30fps codificaba bien (verificado leyendo los bytes
    //     crudos de duración de cada chunk ANMF, 33ms/frame) pero el
    //     dispositivo real no daba abasto decodificando 299 frames a esa
    //     resolución en tiempo real -- se sentía "a los trompicones" pese
    //     a que el archivo era correcto;
    // (3) video real (mp4/h264, ver previewVideo abajo) -- decodificado
    //     por hardware en cualquier iPhone, a diferencia de WebP/GIF que
    //     decodifican por software cuadro a cuadro. Mismo contenido
    //     (scroll real grabado del sitio en vivo, 30fps reales, capturado
    //     con screenshots por-paso porque el screencast de video de
    //     Chromium tiene un techo real de ~25fps), 1200x750, 1.8 MB --
    //     mucho más liviano Y mucho más fluido que cualquier intento con
    //     GIF/WebP.
    // desktopImg queda con la versión WebP como respaldo (og:image,
    // navegadores sin soporte de <video>, etc.) -- previewVideo tiene
    // prioridad real en la tarjeta.
    // v2 del video: intento de muestrear el fundido real (whileInView) en
    // varios frames comparando opacity+transform entre capturas -- técnicamente
    // funcionaba (verificado con capturas de frames intermedios) pero el
    // usuario lo siguió viendo como un salto en el video final. Nunca se
    // llegó a confirmar visualmente que el fundido se percibiera bien.
    // v3 (21 de julio, mismo día): en vez de perseguir capturar el
    // fundido en curso, se evita por completo -- las secciones usan
    // viewport={{once:true}}, así que se recorre TODO el scroll una vez
    // antes de la grabación real (sin grabar nada, ~4s reales) para que
    // cada whileInView se dispare y asiente de antemano. Cuando arranca
    // la grabación real, todo ya está en su estado final -- nada aparece
    // "de golpe" dentro del video, sin importar la fidelidad del muestreo.
    // El sitio real (Home.tsx) sigue con sus animaciones intactas para
    // cualquier visitante -- este truco es solo para la grabación.
    desktopImg: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Lum/LuminaPreviewHD-v2.webp",
    previewVideo: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Lum/LuminaPreview-v4.mp4",
    previewPoster: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Lum/LuminaPoster-v4.jpg",
    mobileImg: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0746441136.firebasestorage.app/o/Lum%2FLumina%20Mobile.PNG?alt=media&token=b3e92c71-1467-4e30-bd32-0b1c3417b91e",
    mobileVideo: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Lum/LuminaMobilePreview-v4.mp4",
    mobilePoster: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Lum/LuminaMobilePoster-v4.jpg",
    shortDesc:
      "Prototipo de web para Lúmina Sky, un hotel de ciudad de lujo en Piantini, Santo Domingo, con motor de reservas y experiencia inmersiva.",
    shortDescEN:
      "Website prototype for Lúmina Sky, a luxury city hotel in Piantini, Santo Domingo, featuring a booking engine and immersive experience.",
    keyResult: "Estética",
    keyResultEN: "Aesthetics",
    resultLabel: "Atractivo Visual",
    resultLabelEN: "Visual Appeal",
    color: "from-cyan-500/20 to-transparent",
    size: "large",
    icon: Globe,
    context:
      "Lúmina Sky es un prototipo creado para demostrar cómo un hotel boutique de ciudad de lujo en Piantini, Santo Domingo, puede destacar mostrando sus instalaciones de élite y facilitando una reserva perfecta.",
    contextEN:
      "Lúmina Sky is a prototype created to showcase how a luxury boutique city hotel in Piantini, Santo Domingo, can stand out by displaying their elite facilities and enabling a seamless booking experience.",
    challenge:
      "Crear una página que muestre fotos de alta calidad sin que se ponga lenta en los celulares, manteniendo al cliente interesado.",
    challengeEN:
      "Create a page that displays high-quality photos without slowing down on mobile phones, keeping the client interested.",
    solution:
      "Desarrollo de una página web fácil de usar, donde buscar habitaciones y reservar sea un proceso rápido y sencillo.",
    solutionEN:
      "Development of an easy-to-use website, where searching for rooms and booking is a quick and simple process.",
    results: [
      {
        label: "Experiencia",
        labelEN: "Experience",
        value: "Premium",
        valueEN: "Premium",
      },
      {
        label: "Reservas",
        labelEN: "Bookings",
        value: "Más Fáciles",
        valueEN: "Easier",
      },
      {
        label: "Navegación",
        labelEN: "Navigation",
        value: "Fluida",
        valueEN: "Fluid",
      },
    ],
    techStack: ["React", "Framer Motion", "Tailwind CSS", "Vite"],
  },
  {
    slug: "nexus-real-estate",
    title: "Nexus Realty",
    cinemaColor: "#1e3a5f",
    client: "Proyecto de Concepto",
    clientEN: "Concept Project",
    isConcept: true,
    plan: "Constelación",
    planEN: "Constellation",
    type: "Inmobiliario · Plataforma",
    typeEN: "Real Estate · Platform",
    shortDesc:
      "Modelo de página para bienes raíces con catálogo de propiedades y filtros rápidos.",
    shortDescEN:
      "Real estate page model with property catalog and quick filters.",
    keyResult: "Rápida",
    keyResultEN: "Fast",
    resultLabel: "Carga al Instante",
    resultLabelEN: "Instant Loading",
    color: "from-amber-500/20 to-transparent",
    size: "tall",
    icon: Briefcase,
    context:
      "Este proyecto muestra cómo las agencias de bienes raíces pueden presentar sus propiedades de forma organizada para que sus clientes encuentren lo que buscan.",
    contextEN:
      "This project shows how real estate agencies can present their properties in an organized way so their clients find what they want.",
    challenge:
      "Lograr que los clientes puedan filtrar propiedades (por precio, tipo, zona) y ver los resultados de inmediato sin tener que esperar.",
    challengeEN:
      "Enable clients to filter properties (by price, type, zone) and see results immediately without waiting.",
    solution:
      "Una página con catálogo dinámico donde las propiedades se ajustan rápidamente según lo que el usuario busca, ideal para mostrar fotos y precios.",
    solutionEN:
      "A page with a dynamic catalog where properties quickly adjust according to what the user searches, ideal for showing photos and prices.",
    results: [
      {
        label: "Catálogo",
        labelEN: "Catalog",
        value: "Interactivo",
        valueEN: "Interactive",
      },
      {
        label: "Búsquedas",
        labelEN: "Searches",
        value: "Al Instante",
        valueEN: "Instantly",
      },
      {
        label: "Adaptado a",
        labelEN: "Adapted for",
        value: "Celulares",
        valueEN: "Mobiles",
      },
    ],
    techStack: ["React", "TypeScript", "Tailwind CSS", "Firebase"],
    liveUrl: "https://nexus-realty-demo.vercel.app/",
    // Mismo pipeline de video real que Lúmina Sky (v3, técnica exacta:
    // captura cuadro a cuadro, no context.recordVideo -- el webm de
    // recordVideo queda capado a ~25fps y con más artefactos de
    // compresión, por eso la v1 de este video se sentía menos nítida y
    // fluida que la de Lúmina). Recorrido de pre-calentamiento sin grabar
    // (whileInView/once:true ya asentado) + grabación real con scroll
    // suavizado (easeInOutSine), 150 pasos ida y 150 vuelta, con ráfaga
    // de cuadros extra si sigue habiendo una transición en curso
    // (shotWithAnimationBurst). Desktop y mobile, ambos capturados vía
    // CDP (Page.captureScreenshot) en vez de page.screenshot() -- en
    // este entorno sandboxeado sin red externa, page.screenshot() se
    // queda colgado esperando "fonts to load" indefinidamente incluso en
    // desktop (no solo mobile). Ensamblado a 30fps (desktop) para
    // igualar el resultado real de Lúmina.
    // Bug real de la v1 (imágenes rotas en el video): la caché de
    // imágenes se armó apuntando a Firebase Storage
    // (storage.googleapis.com), asumiendo que el catálogo en vivo
    // (Firestore) cargaría ahí -- pero dentro del navegador headless de
    // Playwright, el fetch a Firestore REST falla (mismo límite de red
    // sandboxeado), así que `useProperties` cae al catálogo estático de
    // respaldo (`src/data/properties.ts`), que usa fotos de
    // images.unsplash.com. La caché apuntaba al dominio equivocado, y
    // como la ruta interceptada no tenía nada cacheado, se abortaban
    // todas las imágenes -> se veían rotas en el video final. Fix: caché
    // nueva de las URLs reales de Unsplash, indexada por ID de foto
    // (ignorando el query string de tamaño, ya que la misma foto se pide
    // en varios anchos distintos según el componente) en vez de por hash
    // de URL completa.
    // v4: el hero (HeroSection.tsx) rota 4 imágenes de fondo cada 5s vía
    // setInterval, sin relación con el scroll -- en la v3 se veía como
    // un salto abrupto de foto en medio del recorrido de la grabación.
    // Único setInterval real de todo el repo (confirmado por grep), así
    // que en el script de captura se anula por completo
    // (`page.addInitScript(() => { window.setInterval = () => 0; })`
    // antes de goto) para que quede fija la primera imagen del hero
    // durante toda la grabación -- no toca el comportamiento real del
    // sitio, solo el navegador headless usado para grabar.
    // v5: dos transiciones reales corren por CSS/clases de Tailwind, no
    // por framer-motion, así que el detector de animaciones del script
    // de captura (que solo vigila estilos inline opacity+transform) no
    // las esperaba a que asentaran: (1) LazyImage.tsx hace un fundido
    // con blur al "cargar" cada foto -- se veía como si la imagen
    // apareciera de la nada en vez de estar ya ahí; (2) la barra
    // flotante de CTA (scrollY>800) se desliza con
    // translate-y-full/translate-y-0 -- causaba un parpadeo justo al
    // terminar el scroll de vuelta hacia arriba. Fix: forzar
    // `transition-duration`/`animation-duration` globales a ~0 durante
    // la captura (`page.addStyleTag`) -- el movimiento ya se controla
    // muestreando posiciones de scroll discretas, no hace falta que el
    // navegador anime nada en tiempo real.
    // v6: las últimas tarjetas del catálogo ("Venta de Legado") seguían
    // apareciendo con una animación de entrada real, al revés que el
    // resto ya asentado. Causa: ScrollReveal.tsx usa `useInView`
    // (IntersectionObserver real, `once:true`) -- async de verdad, no
    // sincronizado con los `scrollTo()` discretos del script. Esas
    // tarjetas, más cerca del borde inferior del rango capturado, a
    // veces no llegaban a disparar el observer durante el
    // pre-calentamiento y terminaban disparándose recién durante la
    // captura real. Fix: parchear `window.IntersectionObserver` (antes
    // de `goto`) para que reporte "100% visible" de inmediato en cuanto
    // algo lo observa -- sin esperar ninguna posición de scroll real,
    // todo el contenido queda asentado desde el primer frame.
    // v7: el fix de v5 (matar transition-duration global) resolvió
    // LazyImage/CTA-bar pero rompió el propio fundido de 300ms del
    // navbar (id="nexus-navbar", Navbar.tsx, scrollY>30) -- un intento
    // de excluirlo con una regla más específica no cambió nada en la
    // práctica (verificado con un diff de píxeles frame a frame: mismo
    // resultado exacto con duration 0.01s o 300ms -- en este método de
    // captura, sin un loop de render real corriendo mientras Node espera
    // entre pasos, el navegador headless no interpola una transición CSS
    // de forma confiable entre los cuadros discretos que efectivamente
    // capturamos). Fix real: eliminar el cruce de umbral del todo --
    // `window.scrollY` sobrescrito (antes de `goto`) para que siempre
    // reporte muy por encima de scrollY>30 (navbar) y scrollY>800 (CTA
    // bar), así ninguno de los dos vuelve a cambiar de estado en ningún
    // momento de la captura. La posición real de scroll (lo que se ve en
    // el video) no se toca.
    // v8: el pestañeo persistía igual, siempre al terminar de subir --
    // causa real, distinta de las tres anteriores: `index.css` tiene
    // `scroll-behavior: smooth` global, así que cada `window.scrollTo()`
    // heredaba esa animación en vez de saltar instantáneo. El "reset a
    // scroll=0" tras el pre-calentamiento en realidad deslizaba con una
    // animación real de ~1.2s -- con solo 600ms de espera, el primer
    // frame capturado del video quedaba a mitad de ese deslizamiento
    // (~187px reales, no 0), mientras que el ÚLTIMO frame del video (que
    // acumulaba más tiempo de espera por los pasos previos) sí llegaba a
    // 0 real. Como el `<video loop>` salta del último frame de vuelta al
    // primero en cada ciclo, esa diferencia real de posición entre
    // ambos se veía como un parpadeo cada vez que el video reiniciaba --
    // justo "al terminar de subir", el único momento donde el loop se
    // nota. Fix: `scroll-behavior: auto !important` durante toda la
    // captura. Verificado con un diff de píxeles exacto entre el primer
    // y el último frame capturado: 0 (idénticos).
    // Mobile v9: la primera versión del mobile usaba 150 pasos por
    // pasada (301 frames), la mitad de resolución temporal real del
    // mobile de Lúmina (`record_lumina_mobile_slow2.mjs`, 350 pasos por
    // pasada, 701 frames, 30fps reales, escalado final a 560x1212) -- se
    // sentía "poca calidad, pocos fps, scroll muy rápido" en comparación.
    // Corregido a los mismos 350 pasos/701 frames/30fps/560x1212, mismo
    // criterio de captura vía CDP que ya usa el resto de este video
    // (Playwright screenshot() se cuelga esperando fuentes en este
    // entorno sandboxeado). Duración final idéntica a la de Lúmina:
    // 23.37s.
    // v10: el mobile a 350 pasos/23.37s seguía sintiéndose rápido -- la
    // página real de Nexus (scrollHeight ~13929px) es bastante más alta
    // que la de Lúmina, así que igualar solo el número de pasos no
    // igualaba la velocidad percibida real. Subido a 600 pasos por
    // pasada (1201 frames, ~40s a 30fps) -- pedido explícito del usuario
    // ("hazlo más lento aunque dure más").
    // De paso, en la misma ronda: la barra flotante de CTA (App.tsx,
    // scrollY>800) se veía "sobresaliendo mucho" en el video comparado
    // con el sitio real -- causa real, el fix de v7/v8 forzaba
    // `window.scrollY` siempre por encima de ese umbral para eliminar el
    // parpadeo, así que el CTA terminaba visible en TODO el video
    // (incluso en el hero, donde nunca se ve en el sitio real) en vez de
    // aparecer solo al bajar. Revertido: `window.scrollY` vuelve a
    // reportar la posición real, y `#nexus-navbar`/la barra de CTA se
    // excluyen de la neutralización de transiciones (duración cercana a
    // la real, 400ms, en vez de 0.01s) -- con `scroll-behavior:auto` ya
    // arreglado (v8), esto no reintroduce el parpadeo del loop (mismo
    // diff de píxeles exacto 0 entre primer/último frame, verificado de
    // nuevo) y el CTA vuelve a aparecer solo cuando corresponde, como en
    // el sitio real -- con un único salto suave (no repetido) al cruzar
    // el umbral, en vez de una transición perfecta cuadro a cuadro (este
    // método de captura por pasos discretos no interpola transiciones
    // CSS en tiempo real con total fidelidad, pero un salto único ya no
    // se percibe como parpadeo).
    // v11: la caché de imágenes de la captura solo tenía las URLs de
    // Unsplash de `src/data/properties.ts` -- TeamSection.tsx usa 4 fotos
    // de agentes con IDs de Unsplash propios, nunca descargadas, así que
    // esos avatares salían vacíos/rotos en el video. Fix: grep de TODAS
    // las URLs images.unsplash.com de todo `src/` (no solo
    // properties.ts) antes de armar la caché -- 4 IDs faltantes
    // descargados.
    // Corrección real sobre el comentario anterior: se había asumido que
    // el desktop de Lúmina tampoco llega a su footer (para justificar
    // que el de Nexus tampoco) -- falso, comprobado revisando el video
    // real de Lúmina cuadro a cuadro: sí llega, porque el tope de 2450px
    // (heredado tal cual del script de Lúmina) cubre por casualidad la
    // página COMPLETA de Lúmina, que es más corta. La de Nexus mide
    // ~7497px real, casi el triple, así que el mismo tope numérico deja
    // el desktop de Nexus a un tercio del camino. Pedido explícito del
    // usuario: dejar el desktop tal cual está (con ese tope, sin
    // alcanzar el footer) en vez de extenderlo -- en su lugar, se acortó
    // el mobile (ver v12 más abajo) para no depender de un video más
    // largo.
    desktopImg: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Nexus/NexusPoster-v12.jpg",
    previewVideo: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Nexus/NexusPreview-v12.mp4",
    previewPoster: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Nexus/NexusPoster-v12.jpg",
    // Mobile v12: recortado a 11000px de scroll real (de ~13929px
    // totales) para no llegar hasta el footer -- acorta la duración
    // final (949 frames/~31.6s en vez de 1201/~40s), con los pasos
    // recalculados (474 en vez de 600) para conservar el mismo ritmo de
    // scroll por frame que ya se había ajustado, no solo menos
    // distancia con el mismo número de pasos. De paso, calidad de
    // encoding subida (crf 24→20, preset slow→slower, sin el downscale
    // agresivo a 560x1212 -- ese mismo tamaño se mantuvo, pero con menor
    // pérdida por cuadro) tras notar que se veía menos nítido que el de
    // Lúmina.
    // v13/v14: dos pedidos del usuario en la misma ronda.
    // (1) "que solo llegue hasta después de las propiedades, tal como en
    // el de pc" -- el tope de 11000px (v12) todavía dejaba el mobile
    // bastante más allá del listado de propiedades. Medido en vivo con
    // Playwright el `bottom` real del <main> (filtros + listado +
    // mapa) en cada viewport: desktop termina su video dentro de esa
    // misma sección (con su tope ya fijo de 2450px, sin tocar), mobile
    // recalculado a 6059px (bottom real del <main> a 390px de ancho,
    // menos innerHeight) -- mismo punto lógico de la página, no el mismo
    // número de píxeles (los viewports miden distinto). Pasos
    // recalculados a 261 (de 261≈6059/23.2) para conservar el mismo
    // ritmo de scroll ya aprobado como "lento". Video final: 523
    // frames/~17.4s.
    // (2) "sigo sin notar buena calidad... en Lúmina se ve espectacular"
    // -- causa raíz real, no de crf/preset: el mobile de Nexus capturaba
    // cada cuadro con `cdp.send('Page.captureScreenshot')`, que devuelve
    // el frame a tamaño CSS del viewport (390x844) e IGNORA
    // `deviceScaleFactor` -- el video entero se venía escalando desde una
    // fuente de baja resolución sin que ningún ajuste de crf pudiera
    // arreglarlo. El script real de Lúmina
    // (`record_lumina_mobile_slow2.mjs`) usa `page.screenshot()` de
    // Playwright en su lugar, que sí respeta `deviceScaleFactor:2` y
    // captura a la resolución física real (780x1688) -- confirmado
    // comparando el tamaño real de los PNG de ambos scripts antes de
    // tocar nada más. Cambiado el mobile de Nexus a `page.screenshot()`
    // también (el desktop no tiene este bug -- `deviceScaleFactor:1`, CSS
    // px y físicos coinciden). Con la fuente ya nítida, encoding final a
    // 560x1212 (mismo tamaño de salida que Lúmina) con
    // `scale=...:flags=lanczos`, crf 20/preset slower.
    // v15: "bájale la velocidad al scroll" -- mismo tope de 6059px (fin
    // real del <main>, sin cambios), pasos subidos de 261 a 450 (~1.7x,
    // mismo factor ya usado la vez anterior que se pidió más lento) para
    // repartir la misma distancia en más frames. Video final: 901
    // frames/30.0s (antes 523/~17.4s).
    // v16/v18: dos pedidos más del usuario, solo sobre mobile (el
    // desktop no se tocó en ninguno de los dos).
    // (1) "sigue siendo muy rápido" -- comparado el ritmo real contra
    // Lúmina (medido en vivo con Playwright): Lúmina mueve ~10.1px por
    // frame (scrollHeight real 3538px / 350 pasos), Nexus en v15 se
    // movía a ~13.46px por frame (6059px / 450 pasos) -- de ahí la
    // sensación de más rápido pese a la ronda anterior. Pasos subidos a
    // 600 para igualar exactamente el ritmo por frame de Lúmina
    // (6059/600 ≈ 10.1px/frame). Video final: 1201 frames/40.0s.
    // (2) bug real encontrado de paso, reportado por el usuario: el botón
    // "HABLAR CON UN ESPECIALISTA" de la CTA bar salía partido en 3
    // líneas en el video, contra 2 líneas en su teléfono real. Causa
    // real, dos capas: primero se intentó servir la fuente real
    // (Plus Jakarta Sans) vía route.fulfill() -- no tuvo efecto, porque
    // el propio pipeline de dev de Vite/Tailwind de Nexus-Realty-Demo
    // DESCARTA por completo el `@import url(fonts.googleapis.com...)` de
    // `index.css` en este entorno sandboxeado (sin red en build-time
    // para resolverlo) -- confirmado con un diagnóstico aparte
    // (`document.fonts.size` daba 0, y ninguna petición a
    // fonts.googleapis.com llegaba a salir del navegador headless), así
    // que el CSS que la página recibe ni siquiera menciona la fuente y
    // ningún interceptor de red podía llegar a activarse. Sin la fuente
    // real, el navegador caía a una de reemplazo más ancha, partiendo el
    // botón en 3 líneas en vez de 2. Fix real: los 16 archivos woff2
    // reales (descargados de antemano vía curl, que sí tiene red -- el
    // navegador headless de Playwright no) se embeben como `data:` URI
    // dentro de un bloque de `@font-face` inyectado directo con
    // `page.addStyleTag()` justo después de `goto()`, evitando el
    // pipeline de Vite por completo. Verificado en vivo con un
    // diagnóstico dedicado (`document.fonts.size` pasó de 0 a 69) y una
    // captura de pantalla puntual antes de recapturar el video completo:
    // el botón ya queda en 2 líneas, igual que en un teléfono real.
    mobileImg: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Nexus/NexusMobilePoster-v19.jpg",
    mobileVideo: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Nexus/NexusMobilePreview-v19.mp4",
    mobilePoster: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Nexus/NexusMobilePoster-v19.jpg",
  },
  {
    slug: "chroma-store",
    title: "Chroma Tech Store",
    cinemaColor: "#FF3366",
    client: "Proyecto de Concepto",
    clientEN: "Concept Project",
    isConcept: true,
    plan: "Nova",
    planEN: "Nova",
    type: "E-commerce · Tecnología",
    typeEN: "E-commerce · Technology",
    shortDesc:
      "Prototipo de tienda online completa con carrito de compras, pagos seguros y buscador inteligente (IA).",
    shortDescEN:
      "Complete online store prototype with shopping cart, secure payments, and smart search (AI).",
    keyResult: "Ventas",
    keyResultEN: "Sales",
    resultLabel: "Tienda Online",
    resultLabelEN: "Online Store",
    color: "from-violet-500/20 to-transparent",
    size: "large",
    icon: ShoppingCart,
    context:
      "Este es un ejemplo de cómo un negocio puede expandirse al internet, teniendo un catálogo completo, cobrando y recibiendo pedidos 24/7 con soporte automatizado.",
    contextEN:
      "This is an example of how a business can expand to the internet, having a complete catalog, charging and receiving orders 24/7 with automated support.",
    challenge:
      "Hacer que el proceso de navegar, agregar al carrito y pagar sea tan fácil que el cliente no abandone la compra a la mitad, además de sugerir productos con inteligencia artificial.",
    challengeEN:
      "Make browsing, adding to cart, and paying so easy that the client doesn't abandon the purchase halfway, while also suggesting products with AI.",
    solution:
      "Una tienda online clara y atractiva, con un proceso de pago seguro y donde el cliente siempre encuentra fácilmente lo que busca gracias a un asistente virtual de IA.",
    solutionEN:
      "A clear and attractive online store, with a secure checkout process and where the client always easily finds what they are looking for thanks to an AI virtual assistant.",
    results: [
      {
        label: "Catálogo",
        labelEN: "Catalog",
        value: "Ilimitado",
        valueEN: "Unlimited",
      },
      { label: "Ventas", labelEN: "Sales", value: "24 / 7", valueEN: "24 / 7" },
      {
        label: "Pago",
        labelEN: "Payment",
        value: "Fácil y Seguro",
        valueEN: "Easy and Secure",
      },
    ],
    techStack: ["React", "TypeScript", "Vite", "Firebase", "Stripe", "PayPal"],
    liveUrl: "https://chroma-tech-store-azure.vercel.app/",
    desktopImg: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Chroma/ChromaPoster-v5.jpg",
    previewVideo: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Chroma/ChromaPreview-v5.mp4",
    previewPoster: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Chroma/ChromaPoster-v5.jpg",
    mobileImg: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Chroma/ChromaMobilePoster-v6.jpg",
    mobileVideo: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Chroma/ChromaMobilePreview-v6.mp4",
    mobilePoster: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Chroma/ChromaMobilePoster-v6.jpg",
    desktopVideoAspectRatio: "1600/900",
    mobileVideoAspectRatio: "780/1688",
  },
  {
    slug: "vitality-clinic",
    title: "Vitality Med",
    cinemaColor: "#1A6B4A",
    client: "Proyecto de Concepto",
    clientEN: "Concept Project",
    isConcept: true,
    plan: "Constelación",
    planEN: "Constellation",
    type: "Salud · Portal de Citas",
    typeEN: "Health · Appointment Portal",
    shortDesc:
      "Clínica multidisciplinaria con perfiles de médicos, blog de salud, agendado real de citas y panel administrativo propio.",
    shortDescEN:
      "Multi-specialty clinic with doctor profiles, health blog, real appointment booking, and its own admin panel.",
    keyResult: "Pacientes",
    keyResultEN: "Patients",
    resultLabel: "Citas Automatizadas",
    resultLabelEN: "Automated Bookings",
    color: "from-emerald-500/20 to-transparent",
    size: "wide",
    icon: ShieldCheck,
    context:
      "Este diseño está pensado para clínicas y consultorios con varios médicos que necesitan transmitir confianza, mostrar la trayectoria de cada especialista y dejar de depender de llamadas para agendar citas.",
    contextEN:
      "This design is intended for clinics and medical offices with several doctors who need to convey trust, showcase each specialist's background, and stop relying on phone calls to book appointments.",
    challenge:
      "Dar de baja el agendado manual por teléfono y ofrecer contenido propio (perfiles de médicos, blog de salud) sin sumar la complejidad de un portal de pacientes completo.",
    challengeEN:
      "Replace manual phone scheduling and offer real content (doctor profiles, health blog) without the complexity of a full patient portal.",
    solution:
      "Un selector de fecha/hora real basado en el horario de atención real de la clínica (con confirmación automática por correo), páginas de perfil por médico, un blog de salud con artículos reales, y un panel administrativo con login propio para que el staff gestione las citas entrantes en tiempo real.",
    solutionEN:
      "A real date/time picker based on the clinic's actual business hours (with automatic email confirmation), per-doctor profile pages, a health blog with real articles, and an admin panel with its own login for staff to manage incoming appointments in real time.",
    results: [
      {
        label: "Agendado",
        labelEN: "Booking",
        value: "Automatizado",
        valueEN: "Automated",
      },
      {
        label: "Contenido",
        labelEN: "Content",
        value: "Blog + Perfiles",
        valueEN: "Blog + Profiles",
      },
      {
        label: "Gestión",
        labelEN: "Management",
        value: "Panel Propio",
        valueEN: "Own Panel",
      },
    ],
    techStack: [
      "React",
      "TypeScript",
      "React Router",
      "Tailwind CSS",
      "Firebase",
    ],
    liveUrl: "https://vitality-med-five.vercel.app/",
    desktopImg: "/screenshots/vitality-clinic-desktop.png",
    mobileImg: "/screenshots/vitality-clinic-mobile.png",
    previewVideo:
      "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Vitality/VitalityPreview.mp4",
    previewPoster:
      "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Vitality/VitalityPoster.jpg",
    mobileVideo:
      "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Vitality/VitalityMobilePreview.mp4",
    mobilePoster:
      "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Vitality/VitalityMobilePoster.jpg",
    desktopVideoAspectRatio: "1600/1000",
  },
  {
    slug: "sabor-autentico",
    title: "La Reja",
    cinemaColor: "#C0552C",
    client: "Proyecto de Concepto",
    clientEN: "Concept Project",
    isConcept: true,
    plan: "Destello",
    planEN: "Flash",
    liveUrl: "https://la-reja-rd.vercel.app/",
    type: "Gastronomía · Experiencia Digital",
    typeEN: "Gastronomy · Digital Experience",
    shortDesc:
      "Experiencia digital premium para un restaurante dominicano de cocina contemporánea, con carta viva, rutas de degustación y menú a medida por presupuesto.",
    shortDescEN:
      "Premium digital experience for a contemporary Dominican restaurant, with a live menu, tasting routes, and budget-based menu planning.",
    keyResult: "Carta Viva",
    keyResultEN: "Live Menu",
    resultLabel: "45 Platos Reales",
    resultLabelEN: "45 Real Dishes",
    color: "from-orange-500/20 to-transparent",
    size: "small",
    icon: Utensils,
    context:
      "La Reja es un prototipo funcional para un restaurante dominicano de cocina criolla contemporánea en la Zona Colonial. La experiencia combina una dirección editorial premium con una carta digital viva y herramientas para ayudar al visitante a decidir qué comer, beber y reservar.",
    contextEN:
      "La Reja is a functional prototype for a contemporary Dominican restaurant in the Colonial Zone. The experience combines a premium editorial direction with a live digital menu and tools that help visitors decide what to eat, drink, and reserve.",
    challenge:
      "Convertir una carta extensa en una experiencia clara, atractiva y útil en móvil, sin reducir la cocina dominicana de autor a un menú estático ni obligar al visitante a decidir sin orientación.",
    challengeEN:
      "Turn an extensive menu into a clear, attractive, mobile-friendly experience without reducing contemporary Dominican cuisine to a static menu or leaving visitors without guidance.",
    solution:
      "Una landing bilingüe con 45 platos organizados por categorías, rutas de degustación, selector DOP/USD, modo nocturno editorial y un planificador que arma propuestas según presupuesto y cantidad de personas. Incluye el modo Sorpréndeme, generación de PDF/compartir y una reserva guiada; la carta se alimenta desde Firestore con respaldo local.",
    solutionEN:
      "A bilingual landing with 45 dishes organized by category, tasting routes, DOP/USD selection, editorial night mode, and a planner that builds proposals based on budget and party size. It includes a Surprise Me mode, PDF/share output, and guided reservations; the menu is powered by Firestore with a local fallback.",
    results: [
      {
        label: "Carta",
        labelEN: "Menu",
        value: "45 Platos",
        valueEN: "45 Dishes",
      },
      {
        label: "Planificador",
        labelEN: "Planner",
        value: "Presupuesto + Personas",
        valueEN: "Budget + Party Size",
      },
      {
        label: "Experiencia",
        labelEN: "Experience",
        value: "Bilingüe · DOP/USD",
        valueEN: "Bilingual · DOP/USD",
      },
    ],
    techStack: ["React", "TypeScript", "Vite", "Tailwind CSS", "Firebase/Firestore", "Vercel", "jsPDF"],
    desktopImg: "/images/portfolio/la-reja-landing-poster-hd.jpg",
    previewVideo: "/videos/portfolio/la-reja-landing-preview-hd.mp4",
    previewPoster: "/images/portfolio/la-reja-landing-poster-hd.jpg",
    desktopVideoAspectRatio: "1600/900",
    mobileVideo: "/videos/portfolio/la-reja-mobile-preview-hd.mp4",
    mobilePoster: "/images/portfolio/la-reja-mobile-poster-hd.jpg",
    mobileVideoAspectRatio: "780/1688",
  },
];
