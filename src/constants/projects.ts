import { LucideIcon, Globe, Briefcase, ShoppingCart, ShieldCheck, Zap } from 'lucide-react';

export interface Project {
  slug: string;
  title: string;
  client: string;
  plan: 'Destello' | 'Constelación' | 'Nova';
  type: string;
  shortDesc: string;
  keyResult: string;
  resultLabel: string;
  color: string;
  size: 'small' | 'wide' | 'tall' | 'large';
  icon: LucideIcon;
  liveUrl?: string;
  
  // Case Study Details
  challenge: string;
  solution: string;
  context: string;
  results: {
    label: string;
    value: string;
  }[];
  techStack: string[];
}

export const projects: Project[] = [
  {
    slug: "luxe-resort-concept",
    title: "Luxe Resort",
    client: "Proyecto de Concepto",
    plan: "Constelación",
    type: "Turismo · Web Corporativa",
    shortDesc: "Prototipo de web para hotel con motor de reservas y experiencia inmersiva para los usuarios.",
    keyResult: "Estética",
    resultLabel: "Atractivo Visual",
    color: "from-cyan-500/20 to-transparent",
    size: "large",
    icon: Globe,
    context: "Luxe Resort es un prototipo creado para demostrar cómo un hotel boutique puede destacar mostrando sus instalaciones y facilitando las reservas a sus clientes.",
    challenge: "Crear una página que muestre fotos de alta calidad sin que se ponga lenta en los celulares, manteniendo al cliente interesado.",
    solution: "Desarrollo de una página web fácil de usar, donde buscar habitaciones y reservar sea un proceso rápido y sencillo.",
    results: [
      { label: "Experiencia", value: "Premium" },
      { label: "Reservas", value: "Más Fáciles" },
      { label: "Navegación", value: "Fluida" }
    ],
    techStack: ["React", "Framer Motion", "Tailwind CSS", "Vite"]
  },
  {
    slug: "nexus-real-estate",
    title: "Nexus Realty",
    client: "Proyecto de Concepto",
    plan: "Constelación",
    type: "Inmobiliario · Plataforma",
    shortDesc: "Modelo de página para bienes raíces con catálogo de propiedades y filtros rápidos.",
    keyResult: "Rápida",
    resultLabel: "Carga al Instante",
    color: "from-amber-500/20 to-transparent",
    size: "tall",
    icon: Briefcase,
    context: "Este proyecto muestra cómo las agencias de bienes raíces pueden presentar sus propiedades de forma organizada para que sus clientes encuentren lo que buscan.",
    challenge: "Lograr que los clientes puedan filtrar propiedades (por precio, tipo, zona) y ver los resultados de inmediato sin tener que esperar.",
    solution: "Una página con catálogo dinámico donde las propiedades se ajustan rápidamente según lo que el usuario busca, ideal para mostrar fotos y precios.",
    results: [
      { label: "Catálogo", value: "Interactivo" },
      { label: "Búsquedas", value: "Al Instante" },
      { label: "Adaptado a", value: "Celulares" }
    ],
    techStack: ["React", "TypeScript", "Tailwind CSS"]
  },
  {
    slug: "chroma-store",
    title: "Chroma Tech Store",
    client: "Proyecto de Concepto",
    plan: "Nova",
    type: "E-commerce · Tecnología",
    shortDesc: "Prototipo de tienda online completa con carrito de compras, pagos seguros y buscador inteligente (IA).",
    keyResult: "Ventas",
    resultLabel: "Tienda Online",
    color: "from-violet-500/20 to-transparent",
    size: "large",
    icon: ShoppingCart,
    context: "Este es un ejemplo de cómo un negocio puede expandirse al internet, teniendo un catálogo completo, cobrando y recibiendo pedidos 24/7 con soporte automatizado.",
    challenge: "Hacer que el proceso de navegar, agregar al carrito y pagar sea tan fácil que el cliente no abandone la compra a la mitad, además de sugerir productos con inteligencia artificial.",
    solution: "Una tienda online clara y atractiva, con un proceso de pago seguro y donde el cliente siempre encuentra fácilmente lo que busca gracias a un asistente virtual de IA.",
    results: [
      { label: "Catálogo", value: "Ilimitado" },
      { label: "Ventas", value: "24 / 7" },
      { label: "Pago", value: "Fácil y Seguro" }
    ],
    techStack: ["Next.js", "Zustand", "Stripe (UI)", "Tailwind"]
  },
  {
    slug: "vitality-clinic",
    title: "Vitality Med",
    client: "Proyecto de Concepto",
    plan: "Destello",
    type: "Salud · Landing Page",
    shortDesc: "Página directa enfocada en conseguir más citas y prospectos para clínicas o consultorios.",
    keyResult: "Pacientes",
    resultLabel: "Más Citas",
    color: "from-emerald-500/20 to-transparent",
    size: "wide",
    icon: ShieldCheck,
    context: "Este diseño está pensado para médicos o clínicas que quieren una página que transmita confianza y permita a los pacientes agendar citas fácilmente.",
    challenge: "Destacar los servicios médicos de forma profesional sin confundir al paciente con demasiada información innecesaria.",
    solution: "Una página clara y directa, con información precisa y botones llamativos para agendar citas o contactar por WhatsApp de inmediato.",
    results: [
      { label: "Estructura", value: "Directa" },
      { label: "Enfoque en", value: "Contactos" },
      { label: "Diseño", value: "Profesional" }
    ],
    techStack: ["React", "Figma", "Tailwind CSS"]
  },
  {
    slug: "sabor-autentico",
    title: "Sabor Auténtico",
    client: "Proyecto de Concepto",
    plan: "Destello",
    type: "Gastronomía · Landing Page",
    shortDesc: "Menú digital interactivo y gestor de reservas perfecto para restaurantes modernos.",
    keyResult: "Celular",
    resultLabel: "Fácil de Usar",
    color: "from-orange-500/20 to-transparent",
    size: "small",
    icon: Zap,
    context: "Pensado para restaurantes, este prototipo muestra cómo los clientes pueden ver el menú desde su celular escaneando un código QR en la mesa.",
    challenge: "Hacer que el menú se vea bien en celulares de todos los tamaños y que la gente encuentre rápido lo que quiere pedir.",
    solution: "Un diseño pensado totalmente para teléfonos móviles, con fotografías grandes, menú categorizado y fácil navegación con el dedo.",
    results: [
      { label: "Pantallas", value: "De Celular" },
      { label: "Navegación", value: "Muy Cómoda" },
      { label: "Experiencia", value: "Súper Rápida" }
    ],
    techStack: ["React", "CSS Modules", "Tailwind CSS"]
  }
];
