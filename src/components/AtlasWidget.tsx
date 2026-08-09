import { motion } from "framer-motion";
import { Check, Globe, CalendarCheck, CalendarClock, ExternalLink, BookOpen, MessageCircle } from "lucide-react";
import { formatDate } from "../lib/utils";
import type { AtlasWidgetData } from "../hooks/useAtlasChat";

// "Mini UIs" reales dentro del chat -- cada tipo viene de datos que ya
// devolvió una tool real (ver buildWidget en api/quotebot-chat.ts), nunca
// texto libre del modelo, así que el número/fecha/link que se ve acá es
// siempre exacto. Pedido explícito del usuario (inspirado en cómo otros
// chats con IA muestran tablas/tarjetas en vez de solo prosa) -- si se
// agrega un tipo nuevo, agregarlo tanto acá como en buildWidget().

// A diferencia del resto de la app, estos componentes NO usan
// useLanguage()/<T> (que siguen el toggle ES/EN global de la interfaz) --
// reciben `lang` como prop, resuelto por el llamador (AtlasChat.tsx/
// QuoteBot.tsx) a partir del idioma detectado del mensaje del usuario que
// generó este widget puntual (ver AiMessage.lang en useAtlasChat.ts). Así
// una respuesta en inglés (aunque el toggle siga en ES) dibuja su tarjeta
// también en inglés, igual que ya hace el texto de la IA.
function tt(es: string, en: string, lang: "es" | "en"): string {
  return lang === "en" ? en : es;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}

function PricingTable({ data, onAction, gridClass, lang }: { data: any; onAction?: (text: string) => void; gridClass?: string; lang: "es" | "en" }) {
  const discount: number = data?.offerDiscountPercent || 0;
  const packages: { id: string; name: string; price: number; timeline: string; highlights: string[] }[] = data?.packages || [];
  return (
    <div className={gridClass || "grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-1"}>
      {packages.map((p) => {
        const discounted = Math.round(p.price * (1 - discount / 100));
        const featured = p.id === "corporate";
        return (
          <Card
            key={p.id}
            className={featured ? "border-[var(--color-primary-base)] shadow-[0_0_0_1px_var(--color-primary-base)]" : ""}
          >
            <div className="p-3.5">
              {featured && (
                <span className="inline-block mb-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-primary-base)] text-white">
                  {tt("Más elegido", "Most popular", lang)}
                </span>
              )}
              <p className="text-sm font-black text-[var(--color-text-primary)]">{p.name}</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black text-[var(--color-primary-base)]">${discounted}</span>
                {discount > 0 && <span className="text-xs text-[var(--color-text-tertiary)] line-through">${p.price}</span>}
              </div>
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{p.timeline}</p>
              <ul className="mt-2.5 space-y-1.5">
                {(p.highlights || []).map((h: string) => (
                  <li key={h} className="flex items-start gap-1.5 text-[11px] text-[var(--color-text-secondary)]">
                    <Check size={12} className="mt-0.5 shrink-0 text-[var(--color-primary-base)]" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onAction?.(tt(`Quiero cotizar el plan ${p.name}`, `I want a quote for the ${p.name} plan`, lang))}
                className="w-full mt-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider bg-[var(--color-primary-muted)] text-[var(--color-primary-base)] hover:bg-[var(--color-primary-base)] hover:text-white transition-colors"
              >
                {tt("Elegir este plan", "Choose this plan", lang)}
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function QuoteSummary({ data, lang }: { data: any; lang: "es" | "en" }) {
  const addons: { label: string; price: number; monthly: boolean }[] = data?.addons || [];
  return (
    <Card className="mt-1 max-w-sm">
      <div className="px-4 py-3 bg-[var(--color-primary-muted)] flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-[var(--color-primary-base)]">{tt("Tu cotización", "Your quote", lang)}</span>
        <span className="text-xs font-bold text-[var(--color-primary-base)]">{data?.package}</span>
      </div>
      <div className="p-4 space-y-1.5">
        <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
          <span>{data?.package}</span>
          <span>${data?.packagePrice}</span>
        </div>
        {addons.map((a) => (
          <div key={a.label} className="flex justify-between text-xs text-[var(--color-text-secondary)]">
            <span>{a.label}</span>
            <span>
              ${a.price}
              {a.monthly && tt(" /mes", "/mo", lang)}
            </span>
          </div>
        ))}
        {data?.discountAmount > 0 && (
          <div className="flex justify-between text-xs font-bold text-emerald-500">
            <span>
              {tt("Oferta de lanzamiento", "Launch offer", lang)} (-{data.offerDiscountPercent}%)
            </span>
            <span>-${data.discountAmount}</span>
          </div>
        )}
        <div className="pt-2 mt-1.5 border-t border-[var(--color-border-subtle)] flex justify-between items-baseline">
          <span className="text-xs font-black text-[var(--color-text-primary)]">{tt("Total", "Total", lang)}</span>
          <span className="text-lg font-black text-[var(--color-primary-base)]">${data?.oneTimeTotal}</span>
        </div>
        {data?.monthlyTotal > 0 && (
          <p className="text-[11px] text-[var(--color-text-tertiary)] text-right">
            + ${data.monthlyTotal}
            {tt(" /mes en addons recurrentes", "/mo in recurring addons", lang)}
          </p>
        )}
      </div>
    </Card>
  );
}

function DomainCheck({ data, lang }: { data: any; lang: "es" | "en" }) {
  if (data?.error) return null;
  return (
    <Card className="mt-1 max-w-xs">
      <div className="p-3.5 flex items-start gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${data.available ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
          <Globe size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black font-mono text-[var(--color-text-primary)] truncate">{data?.domain}</p>
          <p className={`text-[11px] font-bold ${data.available ? "text-emerald-500" : "text-red-500"}`}>
            {data.available ? tt("Disponible", "Available", lang) : tt("No disponible", "Not available", lang)}
            {data.premium && <span className="ml-1 text-[var(--color-text-tertiary)] font-normal">({tt("premium", "premium", lang)})</span>}
          </p>
          {data.available && (
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">
              {tt("1er año", "1st year", lang)} ${data.firstYearPrice} · {tt("renovación", "renewal", lang)} ${data.renewalPrice}
              {tt(" /año", "/yr", lang)}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function ScheduleSlots({ data, onAction, lang }: { data: any; onAction?: (text: string) => void; lang: "es" | "en" }) {
  const slots: string[] = data?.availableSlots || [];
  if (!slots.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1 max-w-sm">
      {slots.slice(0, 6).map((iso) => {
        const label = formatDate(iso, lang, { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
        return (
          <button
            key={iso}
            onClick={() => onAction?.(tt(`Quiero agendar el ${label}`, `I want to book ${label}`, lang))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold border border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-primary-base)] text-[var(--color-text-secondary)] transition-colors"
          >
            <CalendarClock size={12} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// Un solo resultado: tarjeta vertical con la miniatura arriba (mismo lugar
// donde antes no había imagen). 2+ resultados: galería horizontal con
// scroll-snap -- cada tarjeta a ancho fijo, para hojear varios ejemplos sin
// que la lista crezca verticalmente sin límite.
function PortfolioCards({ data, lang }: { data: any; lang: "es" | "en" }) {
  const results: { slug: string; title: string; type: string; plan: string; shortDesc: string; liveUrl?: string; image?: string }[] = data?.results || [];
  if (!results.length) return null;

  const renderCard = (p: (typeof results)[number], fixedWidth: boolean) => (
    <Card key={p.slug} className={fixedWidth ? "w-64 shrink-0 snap-start" : ""}>
      {p.image && (
        <div className="aspect-video w-full overflow-hidden bg-[var(--color-surface-highlight)]">
          <img src={p.image} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-black text-[var(--color-text-primary)]">{p.title}</p>
          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary-muted)] text-[var(--color-primary-base)]">{p.plan}</span>
        </div>
        <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{p.type}</p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">{p.shortDesc}</p>
        {p.liveUrl && (
          <a
            href={p.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-[var(--color-primary-base)] hover:underline"
          >
            {tt("Ver sitio", "View site", lang)}
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    </Card>
  );

  if (results.length === 1) {
    return <div className="mt-1 max-w-sm">{renderCard(results[0], false)}</div>;
  }

  return (
    <div className="flex gap-2.5 mt-1 -mx-1 px-1 overflow-x-auto snap-x snap-mandatory pb-1">
      {results.map((p) => renderCard(p, true))}
    </div>
  );
}

function BookingConfirmed({ data, lang }: { data: any; lang: "es" | "en" }) {
  if (!data?.ok) return null;
  const label = data?.confirmedStart ? formatDate(data.confirmedStart, lang, { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }) : "";
  return (
    <Card className="mt-1 max-w-xs border-emerald-500/40">
      <div className="p-3.5 flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
          <CalendarCheck size={16} />
        </div>
        <div>
          <p className="text-sm font-black text-emerald-500">{tt("Llamada confirmada", "Call confirmed", lang)}</p>
          {label && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 capitalize">{label}</p>}
        </div>
      </div>
    </Card>
  );
}

function BlogArticles({ data, lang }: { data: any; lang: "es" | "en" }) {
  const results: { title: string; summary: string; category: string; url: string }[] = data?.results || [];
  if (!results.length) return null;
  return (
    <div className="flex flex-col gap-2 mt-1 max-w-sm">
      {results.map((a) => (
        <Card key={a.url}>
          <a href={a.url} target="_blank" rel="noopener noreferrer" className="p-3.5 flex items-start gap-2.5 hover:bg-[var(--color-surface-base)] transition-colors">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-muted)] text-[var(--color-primary-base)] flex items-center justify-center shrink-0">
              <BookOpen size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-[var(--color-text-primary)] leading-snug">{a.title}</p>
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{a.category}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">{a.summary}</p>
            </div>
            <ExternalLink size={13} className="shrink-0 text-[var(--color-text-tertiary)] mt-0.5" />
          </a>
        </Card>
      ))}
    </div>
  );
}

function WhatsappHandoff({ data, lang }: { data: any; lang: "es" | "en" }) {
  if (!data?.whatsappUrl) return null;
  return (
    <Card className="mt-1 max-w-xs border-emerald-500/40">
      <a href={data.whatsappUrl} target="_blank" rel="noopener noreferrer" className="p-3.5 flex items-center gap-2.5 hover:bg-[var(--color-surface-base)] transition-colors">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
          <MessageCircle size={16} />
        </div>
        <div>
          <p className="text-sm font-black text-emerald-500">{tt("Hablar con Cristian", "Talk to Cristian", lang)}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{tt("Abre WhatsApp con el contexto ya cargado", "Opens WhatsApp with context pre-filled", lang)}</p>
        </div>
      </a>
    </Card>
  );
}

export default function AtlasWidget({ widget, onAction, lang = "es" }: { widget?: AtlasWidgetData; onAction?: (text: string) => void; lang?: "es" | "en" }) {
  if (!widget) return null;
  switch (widget.type) {
    case "pricing_table":
      return <PricingTable data={widget.data} onAction={onAction} lang={lang} />;
    case "plan_comparison": {
      const count = ((widget.data as any)?.packages || []).length;
      const gridClass = count >= 3 ? "grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-1 max-w-lg" : "grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1 max-w-sm";
      return <PricingTable data={widget.data} onAction={onAction} gridClass={gridClass} lang={lang} />;
    }
    case "quote_summary":
      return <QuoteSummary data={widget.data} lang={lang} />;
    case "domain_check":
      return <DomainCheck data={widget.data} lang={lang} />;
    case "schedule_slots":
      return <ScheduleSlots data={widget.data} onAction={onAction} lang={lang} />;
    case "portfolio_card":
      return <PortfolioCards data={widget.data} lang={lang} />;
    case "booking_confirmed":
      return <BookingConfirmed data={widget.data} lang={lang} />;
    case "blog_articles":
      return <BlogArticles data={widget.data} lang={lang} />;
    case "whatsapp_handoff":
      return <WhatsappHandoff data={widget.data} lang={lang} />;
    default:
      return null;
  }
}
