import {
  DollarSign,
  Code2,
  Globe,
  LayoutGrid,
  CalendarDays,
  CreditCard,
  Server,
  ShoppingCart,
  Bot,
  FileText,
  Palette,
  Handshake,
  Rocket,
  ShieldCheck,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

// Mismo espíritu que el asignado automático de ícono por tema de Manus --
// sin llamar a ningún modelo (no vale la pena el costo/latencia solo para
// un ícono): cada categoría es un grupo de palabras clave ES/EN, se
// devuelve la primera que matchee en el título + contenido de la
// conversación. Puramente cosmético -- si nada matchea, cae al ícono
// genérico de burbuja de siempre.
const CATEGORIES: { icon: LucideIcon; keywords: string[] }[] = [
  { icon: DollarSign, keywords: ["precio", "plan", "cotiz", "presupuesto", "cuesta", "cuánto", "price", "plans", "quote", "cost", "budget"] },
  { icon: ShoppingCart, keywords: ["tienda", "ecommerce", "e-commerce", "carrito", "store", "shop"] },
  { icon: Code2, keywords: ["tecnolog", "stack", "código", "code", "react", "programa", "tech"] },
  { icon: Globe, keywords: ["dominio", "domain", ".com", "hosting"] },
  { icon: LayoutGrid, keywords: ["portafolio", "ejemplo", "demo", "portfolio", "example"] },
  { icon: CalendarDays, keywords: ["agenda", "llamada", "reunión", "reunion", "horario", "schedule", "call", "meeting", "book"] },
  { icon: CreditCard, keywords: ["pago", "factura", "transferencia", "paypal", "payment", "invoice", "billing"] },
  { icon: Bot, keywords: ["ia", "chatbot", "bot", "inteligencia artificial", "ai ", "assistant"] },
  { icon: Palette, keywords: ["diseño", "branding", "logo", "design", "identidad visual"] },
  { icon: FileText, keywords: ["contrato", "legal", "privacidad", "términos", "terminos", "contract", "terms", "privacy"] },
  { icon: ShieldCheck, keywords: ["garantía", "garantia", "seguridad", "warranty", "security"] },
  { icon: Handshake, keywords: ["proceso", "trabajar", "contratar", "process", "hire"] },
  { icon: Rocket, keywords: ["lanzamiento", "launch", "entrega", "deploy"] },
  { icon: Server, keywords: ["mantenimiento", "soporte", "maintenance", "support"] },
];

export function pickConversationIcon(title: string, text: string): LucideIcon {
  const haystack = `${title} ${text}`.toLowerCase();
  for (const { icon, keywords } of CATEGORIES) {
    if (keywords.some((k) => haystack.includes(k))) return icon;
  }
  return MessageSquare;
}
