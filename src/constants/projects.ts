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
    desktopImg: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0746441136.firebasestorage.app/o/Lum%2FNexusPC.PNG?alt=media&token=5550e8eb-4f3a-4cbd-b468-971651cc033d",
    mobileImg: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0746441136.firebasestorage.app/o/Lum%2FNexusMovil.PNG?alt=media&token=a5b0944c-5d8f-4cb6-b4d8-c7652f5e6e45",
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
