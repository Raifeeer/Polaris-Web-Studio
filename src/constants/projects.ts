import {
  LucideIcon,
  Globe,
  Briefcase,
  ShoppingCart,
  ShieldCheck,
  Zap,
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
    previewVideo: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Lum/LuminaPreview-v3.mp4",
    previewPoster: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Lum/LuminaPoster.jpg",
    mobileImg: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0746441136.firebasestorage.app/o/Lum%2FLumina%20Mobile.PNG?alt=media&token=b3e92c71-1467-4e30-bd32-0b1c3417b91e",
    mobileVideo: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Lum/LuminaMobilePreview-v3.mp4",
    mobilePoster: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Lum/LuminaMobilePoster-v3.jpg",
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
    techStack: ["React", "TypeScript", "Tailwind CSS"],
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
    desktopImg: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Nexus/NexusPoster-v10.jpg",
    previewVideo: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Nexus/NexusPreview-v10.mp4",
    previewPoster: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Nexus/NexusPoster-v10.jpg",
    mobileImg: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Nexus/NexusMobilePoster-v10.jpg",
    mobileVideo: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Nexus/NexusMobilePreview-v10.mp4",
    mobilePoster: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Nexus/NexusMobilePoster-v10.jpg",
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
    techStack: ["Next.js", "Zustand", "Stripe (UI)", "Tailwind"],
    liveUrl: "https://chroma-tech-store-azure.vercel.app/",
    desktopImg: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0746441136.firebasestorage.app/o/Lum%2FChromaPC.png?alt=media&token=7071ec72-9030-4227-bb96-c4359ceb3edd",
    mobileImg: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0746441136.firebasestorage.app/o/Lum%2FChromaMobile.png?alt=media&token=4302a794-dad8-4ae7-9946-67144345315a",
  },
  {
    slug: "vitality-clinic",
    title: "Vitality Med",
    client: "Proyecto de Concepto",
    clientEN: "Concept Project",
    isConcept: true,
    plan: "Destello",
    planEN: "Flash",
    type: "Salud · Landing Page",
    typeEN: "Health · Landing Page",
    shortDesc:
      "Página directa enfocada en conseguir más citas y prospectos para clínicas o consultorios.",
    shortDescEN:
      "Direct page focused on getting more appointments and leads for clinics or medical offices.",
    keyResult: "Pacientes",
    keyResultEN: "Patients",
    resultLabel: "Más Citas",
    resultLabelEN: "More Appointments",
    color: "from-emerald-500/20 to-transparent",
    size: "wide",
    icon: ShieldCheck,
    context:
      "Este diseño está pensado para médicos o clínicas que quieren una página que transmita confianza y permita a los pacientes agendar citas fácilmente.",
    contextEN:
      "This design is intended for doctors or clinics that want a page that conveys trust and allows patients to easily book appointments.",
    challenge:
      "Destacar los servicios médicos de forma profesional sin confundir al paciente con demasiada información innecesaria.",
    challengeEN:
      "Highlight medical services professionally without confusing the patient with too much unnecessary information.",
    solution:
      "Una página clara y directa, con información precisa y botones llamativos para agendar citas o contactar por WhatsApp de inmediato.",
    solutionEN:
      "A clear and direct page, with precise info and eye-catching buttons to book appointments or contact via WhatsApp immediately.",
    results: [
      {
        label: "Estructura",
        labelEN: "Structure",
        value: "Directa",
        valueEN: "Direct",
      },
      {
        label: "Enfoque en",
        labelEN: "Focus on",
        value: "Contactos",
        valueEN: "Leads",
      },
      {
        label: "Diseño",
        labelEN: "Design",
        value: "Profesional",
        valueEN: "Professional",
      },
    ],
    techStack: ["React", "TypeScript", "Tailwind CSS"],
    desktopImg: "/screenshots/vitality-clinic-desktop.png",
    mobileImg: "/screenshots/vitality-clinic-mobile.png",
  },
  {
    slug: "sabor-autentico",
    title: "Sabor Auténtico",
    client: "Proyecto de Concepto",
    clientEN: "Concept Project",
    isConcept: true,
    plan: "Destello",
    planEN: "Flash",
    type: "Gastronomía · Landing Page",
    typeEN: "Gastronomy · Landing Page",
    shortDesc:
      "Menú digital interactivo y gestor de reservas perfecto para restaurantes modernos.",
    shortDescEN:
      "Interactive digital menu and reservation manager perfect for modern restaurants.",
    keyResult: "Celular",
    keyResultEN: "Mobile",
    resultLabel: "Fácil de Usar",
    resultLabelEN: "Easy to Use",
    color: "from-orange-500/20 to-transparent",
    size: "small",
    icon: Zap,
    context:
      "Pensado para restaurantes, este prototipo muestra cómo los clientes pueden ver el menú desde su celular escaneando un código QR en la mesa.",
    contextEN:
      "Designed for restaurants, this prototype shows how customers can view the menu from their phones by scanning a QR code on the table.",
    challenge:
      "Hacer que el menú se vea bien en celulares de todos los tamaños y que la gente encuentre rápido lo que quiere pedir.",
    challengeEN:
      "Make the menu look good on phones of all sizes and let people quickly find what they want to order.",
    solution:
      "Un diseño pensado totalmente para teléfonos móviles, con fotografías grandes, menú categorizado y fácil navegación con el dedo.",
    solutionEN:
      "A design meant entirely for mobile phones, with large photographs, a categorized menu, and easy touch navigation.",
    results: [
      {
        label: "Pantallas",
        labelEN: "Screens",
        value: "De Celular",
        valueEN: "Mobile",
      },
      {
        label: "Navegación",
        labelEN: "Navigation",
        value: "Muy Cómoda",
        valueEN: "Very Comfortable",
      },
      {
        label: "Experiencia",
        labelEN: "Experience",
        value: "Súper Rápida",
        valueEN: "Super Fast",
      },
    ],
    techStack: ["React", "CSS Modules", "Tailwind CSS"],
    desktopImg: "/screenshots/sabor-autentico-desktop.png",
    mobileImg: "/screenshots/sabor-autentico-mobile.png",
  },
];
