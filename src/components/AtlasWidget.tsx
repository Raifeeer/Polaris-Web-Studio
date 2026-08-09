import { motion } from "framer-motion";
import { Check, Globe, CalendarCheck, CalendarClock, ExternalLink } from "lucide-react";
import { useLanguage, T } from "../context/LanguageContext";
import { formatDate } from "../lib/utils";
import type { AtlasWidgetData } from "../hooks/useAtlasChat";

// "Mini UIs" reales dentro del chat -- cada tipo viene de datos que ya
// devolvió una tool real (ver buildWidget en api/quotebot-chat.ts), nunca
// texto libre del modelo, así que el número/fecha/link que se ve acá es
// siempre exacto. Pedido explícito del usuario (inspirado en cómo otros
// chats con IA muestran tablas/tarjetas en vez de solo prosa) -- si se
// agrega un tipo nuevo, agregarlo tanto acá como en buildWidget().

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

function PricingTable({ data, onAction, gridClass }: { data: any; onAction?: (text: string) => void; gridClass?: string }) {
  const { translate } = useLanguage();
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
                  <T en="Most popular">Más elegido</T>
                </span>
              )}
              <p className="text-sm font-black text-[var(--color-text-primary)]">{p.name}</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-black text-[var(--color-primary-base)]">${discounted}</span>
                {discount > 0 && <span className="text-xs text-[var(--color-text-tertiary)] line-through">${p.price}</span>}
              </div>
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{p.timeline}</p>
              <ul className="mt-2.5 space-y-1.5">
                {(p.highlights || []).map((h) => (
                  <li key={h} className="flex items-start gap-1.5 text-[11px] text-[var(--color-text-secondary)]">
                    <Check size={12} className="mt-0.5 shrink-0 text-[var(--color-primary-base)]" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onAction?.(translate(`Quiero cotizar el plan ${p.name}`, `I want a quote for the ${p.name} plan`))}
                className="w-full mt-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider bg-[var(--color-primary-muted)] text-[var(--color-primary-base)] hover:bg-[var(--color-primary-base)] hover:text-white transition-colors"
              >
                <T en="Choose this plan">Elegir este plan</T>
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function QuoteSummary({ data }: { data: any }) {
  const addons: { label: string; price: number; monthly: boolean }[] = data?.addons || [];
  return (
    <Card className="mt-1 max-w-sm">
      <div className="px-4 py-3 bg-[var(--color-primary-muted)] flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-[var(--color-primary-base)]">
          <T en="Your quote">Tu cotización</T>
        </span>
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
              {a.monthly && <T en="/mo"> /mes</T>}
            </span>
          </div>
        ))}
        {data?.discountAmount > 0 && (
          <div className="flex justify-between text-xs font-bold text-emerald-500">
            <span>
              <T en="Launch offer">Oferta de lanzamiento</T> (-{data.offerDiscountPercent}%)
            </span>
            <span>-${data.discountAmount}</span>
          </div>
        )}
        <div className="pt-2 mt-1.5 border-t border-[var(--color-border-subtle)] flex justify-between items-baseline">
          <span className="text-xs font-black text-[var(--color-text-primary)]">
            <T en="Total">Total</T>
          </span>
          <span className="text-lg font-black text-[var(--color-primary-base)]">${data?.oneTimeTotal}</span>
        </div>
        {data?.monthlyTotal > 0 && (
          <p className="text-[11px] text-[var(--color-text-tertiary)] text-right">
            + ${data.monthlyTotal}
            <T en="/mo in recurring addons"> /mes en addons recurrentes</T>
          </p>
        )}
      </div>
    </Card>
  );
}

function DomainCheck({ data }: { data: any }) {
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
            {data.available ? <T en="Available">Disponible</T> : <T en="Not available">No disponible</T>}
            {data.premium && (
              <span className="ml-1 text-[var(--color-text-tertiary)] font-normal">
                (<T en="premium">premium</T>)
              </span>
            )}
          </p>
          {data.available && (
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">
              <T en="1st year">1er año</T> ${data.firstYearPrice} · <T en="renewal">renovación</T> ${data.renewalPrice}
              <T en="/yr"> /año</T>
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function ScheduleSlots({ data, onAction }: { data: any; onAction?: (text: string) => void }) {
  const { language, translate } = useLanguage();
  const slots: string[] = data?.availableSlots || [];
  if (!slots.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1 max-w-sm">
      {slots.slice(0, 6).map((iso) => {
        const label = formatDate(iso, language, { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
        return (
          <button
            key={iso}
            onClick={() => onAction?.(translate(`Quiero agendar el ${label}`, `I want to book ${label}`))}
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
function PortfolioCards({ data }: { data: any }) {
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
            <T en="View site">Ver sitio</T>
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

function BookingConfirmed({ data }: { data: any }) {
  const { language } = useLanguage();
  if (!data?.ok) return null;
  const label = data?.confirmedStart ? formatDate(data.confirmedStart, language, { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }) : "";
  return (
    <Card className="mt-1 max-w-xs border-emerald-500/40">
      <div className="p-3.5 flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
          <CalendarCheck size={16} />
        </div>
        <div>
          <p className="text-sm font-black text-emerald-500">
            <T en="Call confirmed">Llamada confirmada</T>
          </p>
          {label && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 capitalize">{label}</p>}
        </div>
      </div>
    </Card>
  );
}

export default function AtlasWidget({ widget, onAction }: { widget?: AtlasWidgetData; onAction?: (text: string) => void }) {
  if (!widget) return null;
  switch (widget.type) {
    case "pricing_table":
      return <PricingTable data={widget.data} onAction={onAction} />;
    case "plan_comparison": {
      const count = ((widget.data as any)?.packages || []).length;
      const gridClass = count >= 3 ? "grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-1 max-w-lg" : "grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1 max-w-sm";
      return <PricingTable data={widget.data} onAction={onAction} gridClass={gridClass} />;
    }
    case "quote_summary":
      return <QuoteSummary data={widget.data} />;
    case "domain_check":
      return <DomainCheck data={widget.data} />;
    case "schedule_slots":
      return <ScheduleSlots data={widget.data} onAction={onAction} />;
    case "portfolio_card":
      return <PortfolioCards data={widget.data} />;
    case "booking_confirmed":
      return <BookingConfirmed data={widget.data} />;
    default:
      return null;
  }
}
