import {
  DollarSign,
  ShoppingCart,
  Code2,
  Globe,
  LayoutGrid,
  CalendarDays,
  CreditCard,
  Bot,
  Palette,
  FileText,
  ShieldCheck,
  Handshake,
  Rocket,
  Server,
  Mail,
  Phone,
  MessageCircle,
  HelpCircle,
  Star,
  Heart,
  Briefcase,
  Database,
  Cloud,
  Lock,
  KeyRound,
  Settings,
  Wrench,
  Image,
  Video,
  Mic,
  Camera,
  MapPin,
  Flag,
  Trophy,
  Lightbulb,
  Puzzle,
  BookOpen,
  GraduationCap,
  Target,
  BarChart3,
  Users,
  Building2,
  Home,
  Plane,
  Utensils,
  HeartPulse,
  Car,
  Search,
  Wand2,
  Layers,
  Smartphone,
  Monitor,
  Paintbrush,
  Gift,
  Clock,
  TrendingUp,
  Zap,
  Package,
  Truck,
  ClipboardList,
  FileCode2,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

// Pool grande de íconos por tema -- la IA (ver generateSmartTitle en
// useAtlasChat.ts, resuelto server-side en api/quotebot-chat.ts) elige uno de
// estas claves según el tema real de la conversación, en el mismo llamado que
// ya genera el título. Con un pool chico (~14 categorías fijas) el mismo
// puñado de íconos se repetía todo el tiempo -- con ~60 opciones y la IA
// decidiendo (en vez de un match de palabras clave siempre determinista), hay
// mucha más variedad real entre conversaciones parecidas.
export const ICON_MAP: Record<string, LucideIcon> = {
  dollar: DollarSign,
  cart: ShoppingCart,
  code: Code2,
  globe: Globe,
  grid: LayoutGrid,
  calendar: CalendarDays,
  card: CreditCard,
  bot: Bot,
  palette: Palette,
  file: FileText,
  shield: ShieldCheck,
  handshake: Handshake,
  rocket: Rocket,
  server: Server,
  mail: Mail,
  phone: Phone,
  chat: MessageCircle,
  help: HelpCircle,
  star: Star,
  heart: Heart,
  briefcase: Briefcase,
  database: Database,
  cloud: Cloud,
  lock: Lock,
  key: KeyRound,
  settings: Settings,
  wrench: Wrench,
  image: Image,
  video: Video,
  mic: Mic,
  camera: Camera,
  pin: MapPin,
  flag: Flag,
  trophy: Trophy,
  idea: Lightbulb,
  puzzle: Puzzle,
  book: BookOpen,
  graduation: GraduationCap,
  target: Target,
  chart: BarChart3,
  users: Users,
  building: Building2,
  home: Home,
  plane: Plane,
  food: Utensils,
  health: HeartPulse,
  car: Car,
  search: Search,
  wand: Wand2,
  layers: Layers,
  phone2: Smartphone,
  monitor: Monitor,
  brush: Paintbrush,
  gift: Gift,
  clock: Clock,
  trend: TrendingUp,
  zap: Zap,
  package: Package,
  truck: Truck,
  checklist: ClipboardList,
  filecode: FileCode2,
};

export const ICON_KEYS = Object.keys(ICON_MAP) as [string, ...string[]];

// Heurística por palabras clave, usada solo como respaldo (conversaciones
// viejas sin `icon` guardado todavía, o si el llamado a la IA que lo elige
// falló) -- nunca es la fuente principal.
const FALLBACK_CATEGORIES: { key: string; keywords: string[] }[] = [
  { key: "dollar", keywords: ["precio", "plan", "cotiz", "presupuesto", "cuesta", "cuánto", "price", "plans", "quote", "cost", "budget"] },
  { key: "cart", keywords: ["tienda", "ecommerce", "e-commerce", "carrito", "store", "shop"] },
  { key: "code", keywords: ["tecnolog", "stack", "código", "code", "react", "programa", "tech"] },
  { key: "globe", keywords: ["dominio", "domain", ".com"] },
  { key: "grid", keywords: ["portafolio", "ejemplo", "demo", "portfolio", "example"] },
  { key: "calendar", keywords: ["agenda", "llamada", "reunión", "reunion", "horario", "schedule", "call", "meeting", "book"] },
  { key: "card", keywords: ["pago", "factura", "transferencia", "paypal", "payment", "invoice", "billing"] },
  { key: "bot", keywords: ["ia", "chatbot", "bot", "inteligencia artificial", "ai ", "assistant"] },
  { key: "palette", keywords: ["diseño", "branding", "logo", "design", "identidad visual"] },
  { key: "file", keywords: ["contrato", "legal", "privacidad", "términos", "terminos", "contract", "terms", "privacy"] },
  { key: "shield", keywords: ["garantía", "garantia", "seguridad", "warranty", "security"] },
  { key: "handshake", keywords: ["proceso", "trabajar", "contratar", "process", "hire"] },
  { key: "rocket", keywords: ["lanzamiento", "launch", "entrega", "deploy"] },
  { key: "server", keywords: ["mantenimiento", "soporte", "maintenance", "support", "hosting"] },
];

function fallbackIconKey(title: string, text: string): string | null {
  const haystack = `${title} ${text}`.toLowerCase();
  for (const { key, keywords } of FALLBACK_CATEGORIES) {
    if (keywords.some((k) => haystack.includes(k))) return key;
  }
  return null;
}

// `iconKey` es lo que eligió la IA (o `undefined`/una clave inválida, para
// conversaciones viejas o si ese llamado falló) -- siempre resuelve a un
// ícono real, nunca deja el ítem sin ícono.
export function getConversationIcon(iconKey: string | undefined, title: string, text: string): LucideIcon {
  if (iconKey && ICON_MAP[iconKey]) return ICON_MAP[iconKey];
  const fallbackKey = fallbackIconKey(title, text);
  return (fallbackKey && ICON_MAP[fallbackKey]) || MessageSquare;
}
