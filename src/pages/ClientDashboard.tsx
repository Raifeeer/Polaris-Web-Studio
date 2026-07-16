import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  FileText,
  CheckCircle2,
  Clock,
  Calendar,
  Download,
  Plus,
  Trash2,
  Check,
  Copy,
  X,
  ExternalLink,
  PlusCircle,
  TrendingUp,
  Briefcase,
  Users,
  Settings,
  DollarSign,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  MessageCircle,
  RefreshCw,
  Send,
  UserPlus,
  Eye,
  EyeOff,
  Lock,
  ChevronDown,
  Archive,
  Inbox,
  Receipt,
  Sparkles,
  Mail,
  Loader2
} from "lucide-react";
import AISparkleIcon from "../components/AISparkleIcon";
import { T, useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { collection, doc, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const formatTimeTo12h = (timeStr: string) => {
  if (!timeStr) return "";
  if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
  
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:${m} ${ampm}`;
  }
  return timeStr;
};

// Combina fecha ("YYYY-MM-DD") + hora (24h "HH:MM" o ya formateada "h:mm AM/PM",
// las reuniones antiguas quedaron guardadas así) en un Date real, para poder
// distinguir reuniones pasadas de próximas en vez de mostrar siempre "Upcoming".
const parseMeetingDateTime = (dateStr: string, timeStr: string): Date | null => {
  if (!dateStr) return null;
  let hours = 0;
  let minutes = 0;
  const ampmMatch = timeStr?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (ampmMatch) {
    hours = parseInt(ampmMatch[1], 10) % 12;
    minutes = parseInt(ampmMatch[2], 10);
    if (ampmMatch[3].toUpperCase() === "PM") hours += 12;
  } else {
    const parts = (timeStr || "").split(":");
    hours = parseInt(parts[0], 10) || 0;
    minutes = parseInt(parts[1], 10) || 0;
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, hours, minutes);
};

const isMeetingPast = (meet: { date: string; time: string }): boolean => {
  const dt = parseMeetingDateTime(meet.date, meet.time);
  return !!dt && dt.getTime() < Date.now();
};

interface CustomSelectOption {
  id: string;
  label: string;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
}

function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  className = "",
  buttonClassName = ""
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "top">("bottom");
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Estimar la altura real del dropdown según el número de opciones.
      // Cada opción mide aproximadamente 36px, más 16px de padding/borde. Máximo de 240px (max-h-60).
      const estimatedHeight = Math.min(options.length * 36 + 16, 240);

      const position = spaceBelow < estimatedHeight && spaceAbove > spaceBelow ? "top" : "bottom";
      setDropdownPosition(position);
      setDropdownRect({
        top: position === "top" ? rect.top - 6 : rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();
    // El dropdown se renderiza en un portal fuera del árbol del formulario, así que
    // su posición se recalcula ante scroll/resize en vez de depender del layout local.
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, options.length]);

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName || "glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none flex items-center justify-between cursor-pointer hover:bg-[var(--color-surface-hover)] transition-all select-none text-left"}
      >
        <span className={value ? "truncate text-[var(--color-text-primary)]" : "truncate text-[var(--color-text-tertiary)]/50"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-[var(--color-text-tertiary)] transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && dropdownRect && createPortal(
        <AnimatePresence>
          <motion.ul
            initial={{ opacity: 0, y: dropdownPosition === "top" ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropdownPosition === "top" ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              top: dropdownPosition === "top" ? undefined : dropdownRect.top,
              bottom: dropdownPosition === "top" ? window.innerHeight - dropdownRect.top : undefined,
              left: dropdownRect.left,
              width: dropdownRect.width,
            }}
            className="z-30 max-h-60 overflow-y-auto rounded-lg bg-[var(--color-surface-base)]/95 border border-[var(--color-border-subtle)] shadow-xl backdrop-blur-md focus:outline-none scrollbar-thin"
          >
            {options.map((opt) => {
              const isSelected = opt.id === value;
              return (
                <li
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`px-4 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-indigo-500/10 text-indigo-400 font-bold"
                      : "text-[var(--color-text-secondary)] hover:bg-indigo-500/10 hover:text-indigo-400"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={12} className="text-indigo-400 flex-shrink-0 ml-2" />}
                </li>
              );
            })}
          </motion.ul>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );

}

function CopyInvoiceButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar al portapapeles:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-1.5 p-0.5 rounded hover:bg-indigo-500/20 text-indigo-400/70 hover:text-indigo-400 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
      title="Copiar código"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center"
          >
            <Check size={11} className="text-emerald-400" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center"
          >
            <Copy size={11} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function CustomDatePicker({ value, onChange, placeholder = "Seleccionar fecha", className = "" }: { value: string, onChange: (val: string) => void, placeholder?: string, className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentMonth, setCurrentMonth] = useState(() => value ? new Date(value + 'T00:00:00') : new Date());
  const [view, setView] = useState<"days" | "months" | "years">("days");
  const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "top">("bottom");
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const position = spaceBelow < 300 && spaceAbove > spaceBelow ? "top" : "bottom";
      setDropdownPosition(position);
      setDropdownRect({
        top: position === "top" ? rect.top - 6 : rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i); 

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(year, month - 1, 1));
  };
  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const shortMonthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const dayNames = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
  const startYear = Math.floor(year / 10) * 10;
  const years = Array.from({ length: 12 }, (_, i) => startYear - 1 + i);

  const handleSelectDate = (day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    onChange(`${year}-${formattedMonth}-${formattedDay}`);
    setIsOpen(false);
  };

  const handleSelectMonth = (m: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(year, m, 1));
    setView("days");
  };

  const handleSelectYear = (y: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(y, month, 1));
    setView("months");
  };

  const formattedValue = value ? new Date(value + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : placeholder;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none flex items-center justify-between cursor-pointer hover:bg-[var(--color-surface-hover)] transition-all select-none text-left"
      >
        <span className={value ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-tertiary)]/50"}>
          {formattedValue}
        </span>
        <Calendar size={14} className="text-[var(--color-text-tertiary)] flex-shrink-0 ml-2" />
      </button>

      {isOpen && dropdownRect && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: dropdownPosition === "top" ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropdownPosition === "top" ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              top: dropdownPosition === "top" ? undefined : dropdownRect.top,
              bottom: dropdownPosition === "top" ? window.innerHeight - dropdownRect.top : undefined,
              left: dropdownRect.left,
              width: Math.max(dropdownRect.width, 260),
            }}
            className="z-30 min-w-[260px] p-3 rounded-xl bg-[var(--color-surface-base)]/95 border border-[var(--color-border-subtle)] shadow-xl backdrop-blur-md focus:outline-none"
          >
            {view === "days" && (
              <>
                 <div className="flex items-center justify-between mb-3">
                   <button type="button" onClick={handlePrevMonth} className="p-1 rounded-md hover:bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)]"><ChevronDown size={14} className="rotate-90" /></button>
                   <button type="button" onClick={(e) => { e.stopPropagation(); setView("months"); }} className="text-xs font-bold text-[var(--color-text-primary)] hover:text-indigo-400 transition-colors">
                     {monthNames[month]} {year}
                   </button>
                   <button type="button" onClick={handleNextMonth} className="p-1 rounded-md hover:bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)]"><ChevronDown size={14} className="-rotate-90" /></button>
                 </div>
                 <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                   {dayNames.map(d => <div key={d} className="text-[10px] font-bold text-[var(--color-text-tertiary)] p-1">{d}</div>)}
                 </div>
                 <div className="grid grid-cols-7 gap-1 text-center">
                   {blanks.map(b => <div key={`blank-${b}`} className="p-1.5"></div>)}
                   {days.map(d => {
                     const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                     const isSelected = value === dStr;
                     const isToday = new Date().toISOString().split('T')[0] === dStr;
                     return (
                       <button 
                         key={d} 
                         type="button"
                         onClick={() => handleSelectDate(d)}
                         className={`p-1.5 text-xs rounded-md flex items-center justify-center cursor-pointer transition-colors ${isSelected ? 'bg-indigo-600 text-white font-bold' : isToday ? 'text-indigo-400 font-bold hover:bg-indigo-500/10 hover:text-indigo-400' : 'text-[var(--color-text-secondary)] hover:bg-indigo-500/10 hover:text-indigo-400'}`}
                       >
                         {d}
                       </button>
                     );
                   })}
                 </div>
              </>
            )}

            {view === "months" && (
              <>
                <div className="flex items-center justify-between mb-3">
                   <button type="button" onClick={(e) => { e.stopPropagation(); setCurrentMonth(new Date(year - 1, month, 1)); }} className="p-1 rounded-md hover:bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)]"><ChevronDown size={14} className="rotate-90" /></button>
                   <button type="button" onClick={(e) => { e.stopPropagation(); setView("years"); }} className="text-xs font-bold text-[var(--color-text-primary)] hover:text-indigo-400 transition-colors">
                     {year}
                   </button>
                   <button type="button" onClick={(e) => { e.stopPropagation(); setCurrentMonth(new Date(year + 1, month, 1)); }} className="p-1 rounded-md hover:bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)]"><ChevronDown size={14} className="-rotate-90" /></button>
                 </div>
                 <div className="grid grid-cols-3 gap-2 text-center">
                   {shortMonthNames.map((m, i) => (
                     <button 
                       key={m} 
                       type="button"
                       onClick={(e) => handleSelectMonth(i, e)}
                       className={`p-2 text-xs rounded-md flex items-center justify-center cursor-pointer transition-colors ${i === month ? 'bg-indigo-600 text-white font-bold' : 'text-[var(--color-text-secondary)] hover:bg-indigo-500/10 hover:text-indigo-400'}`}
                     >
                       {m}
                     </button>
                   ))}
                 </div>
              </>
            )}

            {view === "years" && (
              <>
                <div className="flex items-center justify-between mb-3">
                   <button type="button" onClick={(e) => { e.stopPropagation(); setCurrentMonth(new Date(startYear - 10, month, 1)); }} className="p-1 rounded-md hover:bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)]"><ChevronDown size={14} className="rotate-90" /></button>
                   <span className="text-xs font-bold text-[var(--color-text-primary)]">
                     {startYear} - {startYear + 9}
                   </span>
                   <button type="button" onClick={(e) => { e.stopPropagation(); setCurrentMonth(new Date(startYear + 10, month, 1)); }} className="p-1 rounded-md hover:bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)]"><ChevronDown size={14} className="-rotate-90" /></button>
                 </div>
                 <div className="grid grid-cols-3 gap-2 text-center">
                   {years.map(y => (
                     <button 
                       key={y} 
                       type="button"
                       onClick={(e) => handleSelectYear(y, e)}
                       className={`p-2 text-xs rounded-md flex items-center justify-center cursor-pointer transition-colors ${y === year ? 'bg-indigo-600 text-white font-bold' : y < startYear || y > startYear + 9 ? 'text-[var(--color-text-tertiary)] hover:bg-indigo-500/10 hover:text-indigo-400' : 'text-[var(--color-text-secondary)] hover:bg-indigo-500/10 hover:text-indigo-400'}`}
                     >
                       {y}
                     </button>
                   ))}
                 </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}


// Reloj en vivo aislado: tiene su propio estado/intervalo para que el tick de
// cada segundo re-renderice SOLO este componente y no todo el dashboard.
function LiveClock() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const formattedTime = new Intl.DateTimeFormat('es-DO', {
    timeZone: 'America/Santo_Domingo',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(currentTime);

  const capitalizedTime = formattedTime.charAt(0).toUpperCase() + formattedTime.slice(1);

  return (
    <div className="text-xs text-[var(--color-text-secondary)] font-medium font-sans flex items-center gap-2 glass-panel border border-[var(--color-border-subtle)] px-3 py-1.5 rounded-lg self-start">
      <div className="w-2 h-2 rounded-full overflow-hidden bg-emerald-500 animate-[pulse_1.5s_infinite]" />
      <span>{capitalizedTime}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Resumen IA Skeleton */}
      <div className="p-5 rounded-[var(--radius-bento)] bg-[var(--color-surface-soft)]/50 border border-[var(--color-border-subtle)]/45 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-hover)] shrink-0" />
        <div className="flex-1 space-y-2 mt-1">
          <div className="h-3 w-1/4 bg-[var(--color-surface-hover)] rounded" />
          <div className="h-4 w-3/4 bg-[var(--color-surface-hover)] rounded" />
        </div>
      </div>

      {/* Bento Layout Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main large card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="h-48 rounded-[var(--radius-bento)] bg-[var(--color-surface-soft)]/50 border border-[var(--color-border-subtle)]/45 p-6 space-y-4">
            <div className="h-4 bg-[var(--color-surface-hover)] rounded w-1/3" />
            <div className="h-8 bg-[var(--color-surface-hover)] rounded w-2/3" />
            <div className="space-y-2">
              <div className="h-3 bg-[var(--color-surface-hover)] rounded w-full" />
              <div className="h-3 bg-[var(--color-surface-hover)] rounded w-5/6" />
            </div>
          </div>

          <div className="h-32 rounded-[var(--radius-bento)] bg-[var(--color-surface-soft)]/50 border border-[var(--color-border-subtle)]/45 p-6 space-y-4">
            <div className="h-4 bg-[var(--color-surface-hover)] rounded w-1/4" />
            <div className="h-3 bg-[var(--color-surface-hover)] rounded w-full" />
            <div className="h-3 bg-[var(--color-surface-hover)] rounded w-4/5" />
          </div>
        </div>

        {/* Sidebar cards */}
        <div className="space-y-8">
          <div className="h-40 rounded-[var(--radius-bento)] bg-[var(--color-surface-soft)]/50 border border-[var(--color-border-subtle)]/45 p-6 space-y-4">
            <div className="h-4 bg-[var(--color-surface-hover)] rounded w-1/2" />
            <div className="h-3 bg-[var(--color-surface-hover)] rounded w-full" />
            <div className="h-10 bg-[var(--color-surface-hover)] rounded w-full" />
          </div>

          <div className="h-40 rounded-[var(--radius-bento)] bg-[var(--color-surface-soft)]/50 border border-[var(--color-border-subtle)]/45 p-6 space-y-4">
            <div className="h-4 bg-[var(--color-surface-hover)] rounded w-1/3" />
            <div className="h-3 bg-[var(--color-surface-hover)] rounded w-full" />
            <div className="h-3 bg-[var(--color-surface-hover)] rounded w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, logout, token } = useAuth();
  const isAdmin = user?.role === "admin";
  // Ref sincronizado en cada render: generateClientSummary se dispara desde un
  // useEffect automático al cargar el proyecto del cliente, y si ese efecto
  // llega a ejecutarse con un closure de un render donde `token` aún era null
  // (justo tras el login), la petición sale como "Bearer null" y el servidor
  // la rechaza con 403. Leer siempre tokenRef.current evita ese closure obsoleto.
  const tokenRef = useRef(token);
  tokenRef.current = token;

  // Redirect if not authenticated
  useEffect(() => {
    if (!user && !localStorage.getItem("portal_token")) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Tab State
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "invoices" | "meetings" | "updates" | "admin-clients" | "admin-config">("overview");

  // Scroll to top when changing tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);
  const [deploys, setDeploys] = useState<any[]>([]);
  const [editVercelId, setEditVercelId] = useState("");
  const [generatedSecret, setGeneratedSecret] = useState("");
  const [secretCopied, setSecretCopied] = useState(false);

  const generateWebhookSecret = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const array = new Uint8Array(20);
    crypto.getRandomValues(array);
    const random = Array.from(array)
      .map(b => chars[b % chars.length])
      .join("");
    const year = new Date().getFullYear();
    const secret = `pk_polaris_${year}_${random}`;
    setGeneratedSecret(secret);
    setSecretCopied(false);
  };

  const copySecret = async () => {
    if (!generatedSecret) return;
    await navigator.clipboard.writeText(generatedSecret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  // Dashboard Data State
  const [data, setData] = useState<{
    clients?: any[];
    projects: any[];
    tasks: any[];
    invoices: any[];
    meetings: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [firestoreArchivedTasks, setFirestoreArchivedTasks] = useState<any[]>([]);

  // Custom Confirmation Dialog States
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    isDanger: boolean = true,
    confirmText?: string,
    cancelText?: string
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
      isDanger,
      confirmText: confirmText || (language === "es" ? "Confirmar" : "Confirm"),
      cancelText: cancelText || (language === "es" ? "Cancelar" : "Cancel"),
    });
  };

  useEffect(() => {
    let active = true;
    const fetchArchivedFromFirestore = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "archived_tasks"));
        const archivedList: any[] = [];
        querySnapshot.forEach((doc) => {
          archivedList.push({ id: doc.id, ...doc.data() });
        });
        if (active) {
          setFirestoreArchivedTasks(archivedList);
        }
      } catch (error) {
        console.error("Error loading archived tasks from Firestore:", error);
      }
    };
    fetchArchivedFromFirestore();
    return () => { active = false; };
  }, [refreshTrigger, data]);

  // Password Visibility State for client creation
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Pagination States (5 items per page)
  const [tasksPage, setTasksPage] = useState(1);
  const [archivedTasksPage, setArchivedTasksPage] = useState(1);
  const [showArchivedTasks, setShowArchivedTasks] = useState(false);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [selectedInvoiceFilterProject, setSelectedInvoiceFilterProject] = useState("all");
  const [openInvoiceStatusDropdown, setOpenInvoiceStatusDropdown] = useState<string | null>(null);
  const [openRefundDetails, setOpenRefundDetails] = useState<string | null>(null);
  const [meetingsPage, setMeetingsPage] = useState(1);
  const [projectsPage, setProjectsPage] = useState(1);
  const itemsPerPage = 5;

  // Invoice Checkout Modal States
  const [payingInvoice, setPayingInvoice] = useState<any | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const paypalButtonsContainerRef = useRef<HTMLDivElement | null>(null);

  // Forms / Management States
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [feedbackTaskId, setFeedbackTaskId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Client Form
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPassword, setNewClientPassword] = useState("");
  const [newClientCompany, setNewClientCompany] = useState("");
  const [newClientProjectName, setNewClientProjectName] = useState("");
  const [newClientProjectDesc, setNewClientProjectDesc] = useState("");
  const [aiLoadingProjectDesc, setAiLoadingProjectDesc] = useState(false);

  // New Deliverable Form
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskLink, setNewTaskLink] = useState("");
  const [aiLoadingTaskTitle, setAiLoadingTaskTitle] = useState(false);
  const [aiLoadingTaskDesc, setAiLoadingTaskDesc] = useState(false);

  // New Invoice Form -- lista de productos/conceptos, para poder facturar varios
  // addons/items separados (ej: 2 addons de un cliente) en una sola factura.
  const [newInvoiceItems, setNewInvoiceItems] = useState<{ description: string; price: string; quantity: string }[]>([
    { description: "", price: "", quantity: "1" },
  ]);
  const [aiLoadingItemIndex, setAiLoadingItemIndex] = useState<number | null>(null);
  const newInvoiceTotal = newInvoiceItems.reduce(
    (sum, it) => sum + (parseFloat(it.price) || 0) * (parseFloat(it.quantity) || 0),
    0
  );
  const [dopExchangeRate, setDopExchangeRate] = useState<string>("59.35");
  const [loadingDopRate, setLoadingDopRate] = useState(false);
  // Generación de PDF de facturas: id de la factura en curso/recién terminada, para
  // mostrar spinner/check en el botón de descarga sin bloquear las demás filas.
  const [pdfGeneratingId, setPdfGeneratingId] = useState<string | null>(null);
  const [pdfSuccessId, setPdfSuccessId] = useState<string | null>(null);

  const handleFetchDopRate = async () => {
    setLoadingDopRate(true);
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 1000));
    try {
      const res = await fetch("/api/exchange-rate/usd-dop");
      if (res.ok) {
        const data = await res.json();
        if (data.rate) {
          setDopExchangeRate(Number(data.rate).toFixed(2));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      await minLoadTime;
      setLoadingDopRate(false);
    }
  };

  // AI Progress form
  const [aiLoadingProgress, setAiLoadingProgress] = useState<string | null>(null);

  // New Meeting Form
  const [newMeetTitle, setNewMeetTitle] = useState("");
  const [newMeetDate, setNewMeetDate] = useState("");
  const [newMeetTime, setNewMeetTime] = useState("");
  const [newMeetLink, setNewMeetLink] = useState("");

  const [selectedClientProjectId, setSelectedClientProjectId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: "user"|"assistant", text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [mobileTabDropdownOpen, setMobileTabDropdownOpen] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [deliverableFormOpen, setDeliverableFormOpen] = useState(false);
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [meetingFormOpen, setMeetingFormOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const deliverableHeaderRef = useRef<HTMLButtonElement>(null);
  const invoiceHeaderRef = useRef<HTMLButtonElement>(null);
  const meetingHeaderRef = useRef<HTMLButtonElement>(null);
  const mobileTabDropdownRef = useRef<HTMLDivElement | null>(null);
  const mobileActionsDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: TouchEvent | MouseEvent) {
      if (mobileTabDropdownOpen && mobileTabDropdownRef.current && !mobileTabDropdownRef.current.contains(event.target as Node)) {
        setMobileTabDropdownOpen(false);
      }
      if (mobileActionsOpen && mobileActionsDropdownRef.current && !mobileActionsDropdownRef.current.contains(event.target as Node)) {
        setMobileActionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [mobileTabDropdownOpen, mobileActionsOpen]);

  const clientProject = !isAdmin && data?.projects && data.projects.length > 0
    ? (data.projects.find((p: any) => p.id === selectedClientProjectId) || data.projects[0])
    : null;

  // Sync client selected project when data loads
  useEffect(() => {
    if (!isAdmin && data?.projects && data.projects.length > 0 && !selectedClientProjectId) {
      setSelectedClientProjectId(data.projects[0].id);
    }
  }, [data, isAdmin, selectedClientProjectId]);

  // Synchronize chat with localStorage for the active project
  useEffect(() => {
    if (clientProject?.id) {
      const saved = localStorage.getItem(`portal_chat_${clientProject.id}`);
      if (saved) {
        try {
          setChatMessages(JSON.parse(saved));
        } catch (e) {
          setChatMessages([]);
        }
      } else {
        // Default welcoming message if no history exists yet
        setChatMessages([
          {
            role: "assistant",
            text: `¡Hola, ${user?.name || "cliente"}! Soy Atlas, tu asistente de IA en Polaris Web Studio. ¿En qué puedo ayudarte hoy con tu proyecto "${clientProject.name}"?`
          }
        ]);
      }
    }
  }, [clientProject?.id]);

  // Persist chat helper
  const saveChatMessages = (messages: typeof chatMessages) => {
    setChatMessages(messages);
    if (clientProject?.id) {
      localStorage.setItem(`portal_chat_${clientProject.id}`, JSON.stringify(messages));
    }
  };

  // Automatically trigger summary regeneration when client project changes
  useEffect(() => {
    if (clientProject && !isAdmin) {
      setAiSummary(null);
      generateClientSummary(clientProject);
    }
  }, [clientProject?.id, isAdmin]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  // Change Password Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

  // Auto-hide notifications
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Compute next project display ID
  const nextProjectDisplayId = React.useMemo(() => {
    return data?.nextProjectDisplayId || "000001";
  }, [data]);

  // Fetch data
  useEffect(() => {
    if (!token) return;
    let active = true;
    if (!data) setLoading(true);
    fetch("/api/portal/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        // Sesión expirada o inválida: cerrar sesión en vez de fallar en silencio.
        if (res.status === 401 || res.status === 403) {
          logout();
          throw new Error("session-expired");
        }
        if (!res.ok) throw new Error("No se pudo cargar el dashboard");
        return res.json();
      })
      .then((resData) => {
        if (!active) return;

        setData(resData);
        // Default select first project for admin tasks
        if (resData.projects && resData.projects.length > 0) {
          setSelectedProjectId((prev) => prev || resData.projects[0].id);
          if (!isAdmin) {
            setSelectedClientProjectId((prev) => prev || resData.projects[0].id);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!active || err?.message === "session-expired") return;
        console.error("Dashboard fetch error:", err);
        setLoading(false);
        setErrorMsg(
          language === "es"
            ? "No se pudo cargar el panel. Verifica tu conexión y pulsa «Sincronizar» para reintentar."
            : "Could not load the dashboard. Check your connection and press “Sync” to retry."
        );
      });
    return () => { active = false; };
  }, [token, refreshTrigger]);

  // Fetch deploys when selectedProjectId changes
  useEffect(() => {
    if (!token || !selectedProjectId) return;
    const controller = new AbortController();
    fetch(`/api/portal/deploys/${selectedProjectId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar los despliegues");
        return res.json();
      })
      .then((d) => {
        if (Array.isArray(d)) {
          setDeploys(d);
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error("Error fetching deploys:", err);
      });
    return () => controller.abort();
  }, [token, selectedProjectId, refreshTrigger]);

  // Carga el SDK de botones de PayPal y los renderiza cada vez que se abre
  // el modal de pago de una factura nueva. `paymentSuccess` se excluye de las
  // deps a propósito: no queremos re-renderizar los botones al mostrar la
  // pantalla de éxito, solo al cambiar de factura.
  useEffect(() => {
    if (!payingInvoice || paymentSuccess) return;

    let cancelled = false;
    setPaypalReady(false);

    (async () => {
      try {
        const clientIdRes = await fetch("/api/portal/paypal/client-id", {
          headers: { Authorization: `Bearer ${tokenRef.current}` },
        });
        if (!clientIdRes.ok) throw new Error("No se pudo obtener la configuración de PayPal.");
        const { clientId } = await clientIdRes.json();
        if (cancelled) return;

        const currency = payingInvoice.currency || "USD";
        const existingScript = document.getElementById("paypal-sdk") as HTMLScriptElement | null;
        if (existingScript && existingScript.dataset.currency !== currency) {
          existingScript.remove();
          delete (window as any).paypal;
        }

        if (!(window as any).paypal) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.id = "paypal-sdk";
            script.dataset.currency = currency;
            script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture`;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("No se pudo cargar el SDK de PayPal."));
            document.body.appendChild(script);
          });
        }
        if (cancelled || !paypalButtonsContainerRef.current) return;

        paypalButtonsContainerRef.current.innerHTML = "";
        (window as any).paypal
          .Buttons({
            style: { layout: "vertical", color: "blue", shape: "pill", label: "pay" },
            createOrder: async () => {
              const res = await fetch(`/api/portal/invoices/${payingInvoice.id}/paypal/create-order`, {
                method: "POST",
                headers: { Authorization: `Bearer ${tokenRef.current}` },
              });
              const orderData = await res.json();
              if (!res.ok) throw new Error(orderData.error || "No se pudo iniciar el pago.");
              return orderData.orderId;
            },
            onApprove: async (approveData: { orderID: string }) => {
              setPaymentProcessing(true);
              setErrorMsg(null);
              try {
                const res = await fetch(`/api/portal/invoices/${payingInvoice.id}/paypal/capture-order`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokenRef.current}`,
                  },
                  body: JSON.stringify({ orderId: approveData.orderID }),
                });
                const captureData = await res.json();
                if (!res.ok) throw new Error(captureData.error || "No se pudo confirmar el pago.");
                setPaymentSuccess(true);
                setRefreshTrigger((p) => p + 1);
              } catch (err: any) {
                setErrorMsg(err.message || "Fallo al procesar el pago.");
              } finally {
                setPaymentProcessing(false);
              }
            },
            onError: () => {
              setErrorMsg("Ocurrió un error con PayPal. Intenta de nuevo.");
            },
          })
          .render(paypalButtonsContainerRef.current);

        setPaypalReady(true);
      } catch (err: any) {
        if (!cancelled) setErrorMsg(err.message || "No se pudo cargar PayPal.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payingInvoice?.id]);

  const handleLogout = () => {
    // Limpia los datos del panel además del token/usuario: si se deja el
    // `data` (proyectos, etc.) de la sesión anterior, por un instante
    // `isAdmin` ya es false (user === null) pero `data.projects` sigue
    // teniendo los proyectos viejos, así que `clientProject` resuelve a un
    // proyecto real y dispara el resumen de IA con el token ya vacío
    // (pedido con "Bearer null", rechazado con 403).
    setData(null);
    setSelectedClientProjectId(null);
    logout();
    navigate("/login");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordValue || newPasswordValue.length < 6) {
      setPasswordChangeError(language === "es" ? "La contraseña debe tener al menos 6 caracteres." : "Password must be at least 6 characters.");
      return;
    }

    setPasswordChangeLoading(true);
    setPasswordChangeError(null);
    setPasswordChangeSuccess(null);

    try {
      const { auth } = await import("../lib/firebase");
      const currentUser = auth.currentUser;
      if (currentUser) {
        const { updatePassword } = await import("firebase/auth");
        await updatePassword(currentUser, newPasswordValue);
        setPasswordChangeSuccess(language === "es" ? "¡Contraseña actualizada con éxito en Firebase!" : "Password updated successfully in Firebase Auth!");
        setNewPasswordValue("");
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordChangeSuccess(null);
        }, 2200);
      } else {
        setPasswordChangeError(
          language === "es" 
            ? "No se pudo cambiar la contraseña. Asegúrate de estar autenticado a través de Firebase Auth." 
            : "Could not change password. Make sure you are authenticated with Firebase Auth."
        );
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/requires-recent-login") {
        setPasswordChangeError(
          language === "es" 
            ? "Por seguridad, para cambiar su contraseña debe haber iniciado sesión recientemente. Por favor, cierre e inicie sesión de nuevo." 
            : "For security, changing password requires a recent login. Please log out and log back in."
        );
      } else {
        setPasswordChangeError(err.message || "Error al actualizar contraseña.");
      }
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const callAI = async (endpoint: string, body: object): Promise<string> => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Error ${res.status}`);
    }
    if (!data.text && !data.suggestedProgress) {
      throw new Error("La IA no devolvió respuesta. Verifica que GEMINI_API_KEY esté configurada en los Secrets de AI Studio.");
    }
    return data.text || JSON.stringify(data);
  };

  const askAIFrontend = async (payload: { prompt?: string; projectId?: string; message?: string; action?: string }): Promise<string> => {
    // Todas las llamadas de IA pasan por el servidor, que custodia las API keys
    // (Gemini + Grok). Nunca se expone ninguna clave en el bundle del cliente.
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenRef.current}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error de IA");
    if (!data.text) throw new Error("Sin respuesta de IA");
    return data.text;
  };

  const generateClientSummary = async (project: any) => {
    if (isAdmin || !project) return;
    setAiSummaryLoading(true);
    try {
      const text = await askAIFrontend({
        projectId: project.id,
        action: "summary"
      });
      setAiSummary(text);
    } catch (e) {
      setAiSummary(null);
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewClientPassword(password);
    setShowRegPassword(true);
  };

  // ----------------------------------------------------
  // ADMIN MUTATIONS
  // ----------------------------------------------------

  // 1. Create client and initial setup
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail || !newClientPassword || !newClientCompany || !newClientProjectName) {
      setErrorMsg(language === "es" ? "Por favor, rellene todos los campos obligatorios." : "Please fill in all required fields.");
      return;
    }

    try {
      const response = await fetch("/api/portal/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newClientEmail,
          password: newClientPassword,
          name: newClientName,
          companyName: newClientCompany,
          projectName: newClientProjectName,
          projectDescription: newClientProjectDesc,
        }),
      });

      const resData = await response.json();
      if (response.ok) {
        // Register user in Firebase Auth dynamically in background so they have immediate Auth credentials without admin logout
        try {
          const { initializeApp, deleteApp } = await import("firebase/app");
          const { getAuth, createUserWithEmailAndPassword, signOut } = await import("firebase/auth");
          const firebaseConfig = (await import("../../firebase-applet-config.json")).default;

          const tempApp = initializeApp(firebaseConfig, `TempApp-${Date.now()}`);
          const tempAuth = getAuth(tempApp);
          
          await createUserWithEmailAndPassword(tempAuth, newClientEmail.trim().toLowerCase(), newClientPassword);
          await signOut(tempAuth);
          await deleteApp(tempApp);
          console.log("Pre-creación de cuenta Firebase Auth del cliente completada con éxito.");
        } catch (fbCreateErr: any) {
          console.warn("No se pudo pre-crear la cuenta de Firebase del cliente (se creará de forma dinámica en su primer inicio de sesión):", fbCreateErr);
        }

        setSuccessMsg(
          language === "es"
            ? "¡Cliente registrado con éxito! Se ha generado su proyecto de forma automática con fases, entregable y factura de inicio."
            : "Client registered successfully! A project has been automatically generated with phases, deliverable and initial invoice."
        );
        // Clear inputs
        setNewClientName("");
        setNewClientEmail("");
        setNewClientPassword("");
        setNewClientCompany("");
        setNewClientProjectName("");
        setNewClientProjectDesc("");
        // Refresh data
        setRefreshTrigger((prev) => prev + 1);
        setActiveTab("overview");
      } else {
        setErrorMsg(resData.error || (language === "es" ? "No se pudo registrar." : "Could not register."));
      }
    } catch (err) {
      setErrorMsg(language === "es" ? "Ocurrió un error." : "An error occurred.");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const title = language === "es" ? "¿Eliminar Proyecto?" : "Delete Project?";
    const msg = language === "es"
      ? "¿Seguro que deseas eliminar este proyecto? Pasará a la papelera por 30 días."
      : "Are you sure you want to delete this project? It will go to the Recycle Bin for 30 days.";
    showConfirmation(title, msg, async () => {
      try {
        const response = await fetch(`/api/portal/projects/${projectId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setRefreshTrigger((prev) => prev + 1);
        } else {
          const errorText = await response.text();
          console.error("Delete project failed:", response.status, errorText);
          setErrorMsg(`Error: ${errorText}`);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg(`Error: ${err}`);
      }
    });
  };

  // 2. Delete Client Account
  const handleDeleteClient = async (clientId: string) => {
    const title = language === "es" ? "¿Eliminar Cuenta?" : "Delete Account?";
    const msg = language === "es"
      ? "¿Seguro que deseas eliminar esta cuenta y proyecto? Pasará a la papelera por 30 días, en donde luego se borrará permanentemente."
      : "Are you sure you want to delete this account and project? It will go to the Recycle Bin for 30 days, after which it will be permanently deleted.";
    showConfirmation(title, msg, async () => {
      console.log("Delete client clicked for ID:", clientId);
      try {
        const response = await fetch(`/api/portal/clients/${clientId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Delete client response:", response.status);
        if (response.ok) {
          setRefreshTrigger((prev) => prev + 1);
        } else {
          const errorText = await response.text();
          console.error("Delete client failed:", response.status, errorText);
          setErrorMsg(`Error: ${errorText}`);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg(`Error: ${err}`);
      }
    });
  };

  const handleRestoreClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/portal/clients/${clientId}/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/portal/projects/${projectId}/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Update Project Progress
  const handleUpdateProjectProgress = async (projectId: string, progress: number, currentPhase: string, phases: any[]) => {
    try {
      await fetch(`/api/portal/projects/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          progress,
          currentPhase,
          phases,
        }),
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle active phase item with linear sequential behavior (much simpler and intuitive)
  const togglePhaseStatus = (project: any, phaseIndex: number) => {
    const updatedPhases = project.phases.map((ph: any) => ({ ...ph }));
    const clickedPhase = updatedPhases[phaseIndex];
    const currentStatus = clickedPhase.status;

    let nextStatus: "pending" | "active" | "completed" = "active";

    if (currentStatus === "pending") {
      // If it was pending, it becomes the active phase (In Progress)
      nextStatus = "active";
      // Auto-complete all previous phases
      for (let i = 0; i < phaseIndex; i++) {
        updatedPhases[i].status = "completed";
      }
      updatedPhases[phaseIndex].status = "active";
      // Mark all subsequent phases as pending
      for (let i = phaseIndex + 1; i < updatedPhases.length; i++) {
        updatedPhases[i].status = "pending";
      }
    } else if (currentStatus === "active") {
      // If it was already active, clicking it marks it as completed (Listo)
      nextStatus = "completed";
      for (let i = 0; i <= phaseIndex; i++) {
        updatedPhases[i].status = "completed";
      }
      for (let i = phaseIndex + 1; i < updatedPhases.length; i++) {
        updatedPhases[i].status = "pending";
      }
    } else {
      // If it was completed, clicking it rolls back to make it the active phase
      nextStatus = "active";
      for (let i = 0; i < phaseIndex; i++) {
        updatedPhases[i].status = "completed";
      }
      updatedPhases[phaseIndex].status = "active";
      for (let i = phaseIndex + 1; i < updatedPhases.length; i++) {
        updatedPhases[i].status = "pending";
      }
    }

    // Auto set current active phase description text
    const activePhase = updatedPhases.find((p: any) => p.status === "active") || updatedPhases[updatedPhases.length - 1];

    // Compute progress percentage: each completed phase counts as 1, active phase counts as 0.5.
    const total = updatedPhases.length || 1;
    const completedCount = updatedPhases.filter((p: any) => p.status === "completed").length;
    const hasActive = updatedPhases.some((p: any) => p.status === "active");
    const nextProgress = Math.min(
      100,
      Math.round(((completedCount + (hasActive ? 0.5 : 0)) / total) * 100)
    );

    handleUpdateProjectProgress(project.id, nextProgress, activePhase.name, updatedPhases).then(() => {
      const phaseLabels = language === "es"
        ? { completed: "Listo", active: "En Curso", pending: "Pendiente" }
        : { completed: "Done", active: "In Progress", pending: "Pending" };
      setSuccessMsg(`${language === "es" ? "Fase actualizada a:" : "Phase updated to:"} ${phaseLabels[nextStatus as keyof typeof phaseLabels]}`);
    });
  };

  // 4. Create deliverable
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newTaskTitle) return;

    try {
      const response = await fetch("/api/portal/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          title: newTaskTitle,
          description: newTaskDesc,
          link: newTaskLink,
        }),
      });
      if (response.ok) {
        setNewTaskTitle("");
        setNewTaskDesc("");
        setNewTaskLink("");
        setDeliverableFormOpen(false);
        setRefreshTrigger((prev) => prev + 1);
        setSuccessMsg(language === "es" ? "¡Entregable creado con éxito y notificado!" : "Deliverable created successfully and notified!");
        setTimeout(() => {
          deliverableHeaderRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const title = language === "es" ? "¿Eliminar Entregable?" : "Delete Deliverable?";
    const msg = language === "es" 
      ? "¿Seguro que deseas eliminar este entregable permanentemente? Se eliminará de la base de datos y del historial de Firestore." 
      : "Are you sure you want to permanently delete this deliverable? It will be removed from the database and Firestore archives.";
    showConfirmation(title, msg, async () => {
      try {
        await fetch(`/api/portal/tasks/${taskId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        // Eliminar de Firestore
        try {
          const docRef = doc(db, "archived_tasks", taskId);
          await deleteDoc(docRef);
        } catch (firestoreErr) {
          console.error("Firestore Error in deleting task:", firestoreErr);
        }

        setRefreshTrigger((prev) => prev + 1);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleArchiveTask = async (taskId: string, archived: boolean) => {
    try {
      await fetch(`/api/portal/tasks/${taskId}/archive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ archived }),
      });

      // Guardar en Firestore
      try {
        const docRef = doc(db, "archived_tasks", taskId);
        if (archived) {
          const taskToArchive = data?.tasks?.find((t: any) => t.id === taskId);
          if (taskToArchive) {
            await setDoc(docRef, {
              id: taskToArchive.id,
              projectId: taskToArchive.projectId,
              title: taskToArchive.title,
              description: taskToArchive.description || "",
              status: taskToArchive.status,
              archived: true,
              archivedAt: new Date().toISOString()
            });
          }
        } else {
          await deleteDoc(docRef);
        }
      } catch (firestoreErr) {
        console.error("Firestore Error in archiving task:", firestoreErr);
        handleFirestoreError(firestoreErr, OperationType.WRITE, `archived_tasks/${taskId}`);
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = newInvoiceItems
      .filter((it) => it.description.trim() && parseFloat(it.price) > 0)
      .map((it) => ({
        description: it.description.trim(),
        price: parseFloat(it.price) || 0,
        quantity: parseFloat(it.quantity) || 1,
      }));
    if (!selectedProjectId || validItems.length === 0) return;

    try {
      const response = await fetch("/api/portal/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          items: validItems,
          exchangeRate: dopExchangeRate && !isNaN(parseFloat(dopExchangeRate)) ? parseFloat(dopExchangeRate) : undefined,
        }),
      });
      if (response.ok) {
        const resData = await response.json();
        setNewInvoiceItems([{ description: "", price: "", quantity: "1" }]);
        setRefreshTrigger((prev) => prev + 1);
        setSuccessMsg(`¡Factura ${resData.invoiceNumber} creada y registrada exitosamente!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, status: string) => {
    try {
      const res = await fetch(`/api/portal/invoices/${invoiceId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      const resData = await res.json();
      if (!res.ok) {
        setErrorMsg(resData.error || "No se pudo actualizar el estado de la factura.");
        return;
      }
      if (status === "void") {
        if (resData.refunded) {
          setSuccessMsg("Factura invalidada y reembolsada al cliente vía PayPal.");
        } else if (resData.manualPayment) {
          setSuccessMsg("Factura invalidada. Se había marcado pagada manualmente, así que no se generó ningún reembolso automático.");
        }
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de conexión al actualizar la factura.");
    }
  };

  // 6. Schedule Meeting
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newMeetTitle || !newMeetDate || !newMeetTime) return;

    try {
      const response = await fetch("/api/portal/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          title: newMeetTitle,
          date: newMeetDate,
          time: newMeetTime,
          meetLink: newMeetLink,
        }),
      });
      if (response.ok) {
        setNewMeetTitle("");
        setNewMeetDate("");
        setNewMeetTime("");
        setNewMeetLink("");
        setRefreshTrigger((prev) => prev + 1);
        setSuccessMsg(language === "es" ? "¡Reunión agendada!" : "Meeting scheduled!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    const title = language === "es" ? "¿Eliminar Reunión?" : "Delete Meeting?";
    const msg = language === "es" ? "¿Eliminar esta reunión de la agenda?" : "Delete this meeting from the schedule?";
    showConfirmation(title, msg, async () => {
      try {
        await fetch(`/api/portal/meetings/${meetingId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setRefreshTrigger((prev) => prev + 1);
      } catch (err) {
        console.error(err);
      }
    });
  };

  // ----------------------------------------------------
  // CLIENT ACTIONS
  // ----------------------------------------------------
  const handleClientRespondTask = async (taskId: string, status: "approved" | "rejected") => {
    try {
      const response = await fetch(`/api/portal/tasks/${taskId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          feedback: feedbackText,
        }),
      });

      if (response.ok) {
        setFeedbackTaskId(null);
        setFeedbackText("");
        setRefreshTrigger((prev) => prev + 1);
        setSuccessMsg(
          status === "approved"
            ? (language === "es" 
                ? "¡Entregable aprobado de forma oficial! Tu manager ha sido notificado para avanzar al siguiente módulo."
                : "Deliverable officially approved! Your manager has been notified to advance to the next module.")
            : (language === "es" ? "Feedback registrado. Revisaremos tus observaciones." : "Feedback registered. We will review your observations.")
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helpers
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-US", { style: "currency", currency: "USD" }).format(amount);
  };

  if (!user) {
    return (
      <div className="fixed inset-0 bg-[var(--color-surface-base)] flex flex-col items-center justify-center gap-4 z-50">
        <div className="w-12 h-12 rounded-full border-2 border-[var(--color-primary-base)] border-t-transparent animate-spin" />
        <p className="text-xs text-[var(--color-text-secondary)] font-medium tracking-wider">
          <T en="Loading your workspace...">Cargando tu área de trabajo por favor espera...</T>
        </p>
      </div>
    );
  }

  const printInvoice = async (inv: any) => {
    if (pdfGeneratingId) return;
    setPdfGeneratingId(inv.id);
    try {
      // jsPDF se carga solo al descargar una factura, no en el bundle inicial del
      // dashboard. Genera el PDF con texto vectorial real (seleccionable/copiable) en
      // vez de capturar una imagen con html2canvas -- solo el isotipo se rasteriza,
      // como en cualquier factura real.
      const { default: jsPDF } = await import("jspdf");

      const project = data?.projects.find((p: any) => p.id === inv.projectId);
      const clientUser = isAdmin
        ? data?.clients?.find((c: any) => c.id === project?.clientUserId)
        : null;
      const clientName = isAdmin ? (clientUser?.name || "—") : (user?.name || "—");
      const clientEmail = isAdmin ? clientUser?.email : user?.email;
      const clientPhone = isAdmin ? (clientUser as any)?.phone : (user as any)?.phone;

      const payment = inv.status === "paid" && inv.paypalCaptureId
        ? { label: "PayPal", detail: `Ref: ${inv.paypalCaptureId}` }
        : inv.status === "paid"
        ? { label: "Transferencia bancaria / Efectivo", detail: "Pago confirmado manualmente" }
        : inv.status === "void"
        ? {
            label: "Factura invalidada",
            detail: inv.paypalRefundId ? `Reembolsada vía PayPal (Ref: ${inv.paypalRefundId})` : "Sin cobro asociado",
          }
        : { label: "PayPal", detail: "Pendiente — disponible para pagar en el portal del cliente" };

      const statusLabel = (inv.status === "paid" ? "Pagada" : inv.status === "void" ? "Invalidada" : "Pendiente").toUpperCase();
      const statusColors = inv.status === "paid"
        ? { bg: [220, 252, 231], text: [6, 95, 70] }
        : inv.status === "void"
        ? { bg: [254, 226, 226], text: [185, 28, 28] }
        : { bg: [254, 243, 199], text: [146, 64, 14] };

      // Varios productos/conceptos en una misma factura (ej: 2 addons separados);
      // las facturas antiguas sin "items" caen a la única línea description/amount.
      const invoiceItems: { description: string; price: number; quantity: number }[] =
        Array.isArray(inv.items) && inv.items.length > 0
          ? inv.items
          : [{ description: inv.description || "Servicios de desarrollo web.", price: Number(inv.amount), quantity: 1 }];

      // Lockup vertical oficial (public/brand/lockup-vertical-color.svg), inlineado a
      // mano -- se incrusta como SVG vectorial real (vía svg2pdf.js), no como imagen
      // rasterizada, para que no se vea pixelado al hacer zoom en el PDF.
      const polarisLockupSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="96" zoomAndPan="magnify" viewBox="0 0 1500 1499.999933" height="96" preserveAspectRatio="xMidYMid meet" version="1.0"><defs><g/><clipPath id="851e9d6437"><rect x="0" width="1382" y="0" height="408"/></clipPath><clipPath id="39b9e7ec69"><rect x="0" width="1423" y="0" height="201"/></clipPath><clipPath id="d5ef3e5f0d"><path d="M 254 10 L 1243 10 L 1243 996.75 L 254 996.75 Z M 254 10 " clip-rule="nonzero"/></clipPath><clipPath id="abcf7419e7"><path d="M 677.078125 425.464844 L 822.921875 425.464844 L 822.921875 571.308594 L 677.078125 571.308594 Z M 677.078125 425.464844 " clip-rule="nonzero"/></clipPath><clipPath id="848a88a2c9"><path d="M 750 425.464844 C 709.726562 425.464844 677.078125 458.113281 677.078125 498.386719 C 677.078125 538.660156 709.726562 571.308594 750 571.308594 C 790.273438 571.308594 822.921875 538.660156 822.921875 498.386719 C 822.921875 458.113281 790.273438 425.464844 750 425.464844 Z M 750 425.464844 " clip-rule="nonzero"/></clipPath><clipPath id="bad4aa786d"><path d="M 0.078125 0.464844 L 145.921875 0.464844 L 145.921875 146.308594 L 0.078125 146.308594 Z M 0.078125 0.464844 " clip-rule="nonzero"/></clipPath><clipPath id="d943719314"><path d="M 73 0.464844 C 32.726562 0.464844 0.078125 33.113281 0.078125 73.386719 C 0.078125 113.660156 32.726562 146.308594 73 146.308594 C 113.273438 146.308594 145.921875 113.660156 145.921875 73.386719 C 145.921875 33.113281 113.273438 0.464844 73 0.464844 Z M 73 0.464844 " clip-rule="nonzero"/></clipPath><clipPath id="81833ce384"><rect x="0" width="146" y="0" height="147"/></clipPath></defs><g transform="matrix(1, 0, 0, 1, 65, 983)"><g clip-path="url(#851e9d6437)"><g fill="#0f172a" fill-opacity="1"><g transform="translate(0.467454, 298.625601)"><g><path d="M 79.390625 0 L 14.4375 0 L 14.4375 -241.78125 L 116.5625 -241.78125 C 137.007812 -241.78125 155.289062 -238.769531 171.40625 -232.75 C 187.519531 -226.738281 200.269531 -217.175781 209.65625 -204.0625 C 219.039062 -190.957031 223.734375 -173.578125 223.734375 -151.921875 C 223.734375 -130.265625 219.101562 -112.820312 209.84375 -99.59375 C 200.582031 -86.363281 187.890625 -76.738281 171.765625 -70.71875 C 155.648438 -64.707031 137.25 -61.703125 116.5625 -61.703125 L 79.390625 -61.703125 Z M 117.28125 -184.03125 L 79.390625 -184.03125 L 79.390625 -119.4375 L 117.28125 -119.4375 C 142.539062 -119.4375 155.171875 -130.265625 155.171875 -151.921875 C 155.171875 -173.328125 142.539062 -184.03125 117.28125 -184.03125 Z M 117.28125 -184.03125 "/></g></g></g><g fill="#0f172a" fill-opacity="1"><g transform="translate(206.117533, 298.625601)"><g><path d="M 133.515625 2.890625 C 115.234375 2.890625 98.453125 -0.296875 83.171875 -6.671875 C 67.898438 -13.046875 54.726562 -21.882812 43.65625 -33.1875 C 32.59375 -44.5 24.050781 -57.671875 18.03125 -72.703125 C 12.019531 -87.742188 9.015625 -103.925781 9.015625 -121.25 C 9.015625 -138.570312 12.019531 -154.75 18.03125 -169.78125 C 24.050781 -184.820312 32.59375 -197.992188 43.65625 -209.296875 C 54.726562 -220.609375 67.898438 -229.453125 83.171875 -235.828125 C 98.453125 -242.203125 115.234375 -245.390625 133.515625 -245.390625 C 152.035156 -245.390625 168.875 -242.203125 184.03125 -235.828125 C 199.1875 -229.453125 212.296875 -220.609375 223.359375 -209.296875 C 234.429688 -197.992188 242.972656 -184.820312 248.984375 -169.78125 C 255.003906 -154.75 258.015625 -138.570312 258.015625 -121.25 C 258.015625 -103.925781 255.003906 -87.742188 248.984375 -72.703125 C 242.972656 -57.671875 234.429688 -44.5 223.359375 -33.1875 C 212.296875 -21.882812 199.1875 -13.046875 184.03125 -6.671875 C 168.875 -0.296875 152.035156 2.890625 133.515625 2.890625 Z M 133.515625 -60.265625 C 152.285156 -60.265625 166.300781 -66.035156 175.5625 -77.578125 C 184.820312 -89.128906 189.453125 -103.6875 189.453125 -121.25 C 189.453125 -138.8125 184.820312 -153.363281 175.5625 -164.90625 C 166.300781 -176.457031 152.285156 -182.234375 133.515625 -182.234375 C 114.753906 -182.234375 100.738281 -176.457031 91.46875 -164.90625 C 82.207031 -153.363281 77.578125 -138.8125 77.578125 -121.25 C 77.578125 -103.6875 82.207031 -89.128906 91.46875 -77.578125 C 100.738281 -66.035156 114.753906 -60.265625 133.515625 -60.265625 Z M 133.515625 -60.265625 "/></g></g></g><g fill="#0f172a" fill-opacity="1"><g transform="translate(447.848382, 298.625601)"><g><path d="M 195.953125 0 L 14.4375 0 L 14.4375 -241.78125 L 79.390625 -241.78125 L 79.390625 -57.734375 L 195.953125 -57.734375 Z M 195.953125 0 "/></g></g></g><g fill="#0f172a" fill-opacity="1"><g transform="translate(622.108149, 298.625601)"><g><path d="M 71.09375 0 L 1.796875 0 L 87.328125 -241.78125 L 177.90625 -241.78125 L 263.421875 0 L 192.34375 0 L 177.546875 -45.109375 L 85.890625 -45.109375 Z M 115.46875 -134.59375 L 103.921875 -99.234375 L 159.5 -99.234375 L 147.953125 -134.59375 L 131.71875 -195.21875 Z M 115.46875 -134.59375 "/></g></g></g><g fill="#0f172a" fill-opacity="1"><g transform="translate(862.034891, 298.625601)"><g><path d="M 79.390625 0 L 14.4375 0 L 14.4375 -241.78125 L 130.265625 -241.78125 C 149.035156 -241.78125 165.695312 -239.191406 180.25 -234.015625 C 194.800781 -228.847656 206.226562 -220.671875 214.53125 -209.484375 C 222.832031 -198.296875 226.984375 -183.800781 226.984375 -166 C 226.984375 -150.601562 223.796875 -137.851562 217.421875 -127.75 C 211.046875 -117.644531 202.382812 -110.003906 191.4375 -104.828125 C 180.488281 -99.660156 168.160156 -96.472656 154.453125 -95.265625 C 166.960938 -92.140625 176.582031 -86.96875 183.3125 -79.75 C 190.050781 -72.53125 196.425781 -64.109375 202.4375 -54.484375 L 237.078125 0 L 163.109375 0 L 123.046875 -64.59375 C 118.234375 -72.53125 113.0625 -78.179688 107.53125 -81.546875 C 102 -84.921875 94.300781 -86.609375 84.4375 -86.609375 L 79.390625 -86.609375 Z M 130.984375 -184.03125 L 79.390625 -184.03125 L 79.390625 -138.5625 L 130.984375 -138.5625 C 149.273438 -138.5625 158.421875 -146.140625 158.421875 -161.296875 C 158.421875 -176.453125 149.273438 -184.03125 130.984375 -184.03125 Z M 130.984375 -184.03125 "/></g></g></g><g fill="#0f172a" fill-opacity="1"><g transform="translate(1077.426698, 298.625601)"><g><path d="M 79.390625 0 L 14.4375 0 L 14.4375 -241.78125 L 79.390625 -241.78125 Z M 79.390625 0 "/></g></g></g><g fill="#0f172a" fill-opacity="1"><g transform="translate(1145.970115, 298.625601)"><g><path d="M 126.296875 3.609375 C 102.960938 3.609375 80.832031 0.117188 59.90625 -6.859375 C 38.976562 -13.835938 21.65625 -24.539062 7.9375 -38.96875 L 48.359375 -91.296875 C 58.460938 -79.023438 71.09375 -69.757812 86.25 -63.5 C 101.40625 -57.25 115.957031 -54.125 129.90625 -54.125 C 138.332031 -54.125 144.945312 -55.207031 149.75 -57.375 C 154.5625 -59.539062 156.96875 -63.148438 156.96875 -68.203125 C 156.96875 -74.453125 153.597656 -79.320312 146.859375 -82.8125 C 140.128906 -86.300781 128.707031 -89.609375 112.59375 -92.734375 L 88.40625 -97.4375 C 74.695312 -100.082031 62.066406 -104.109375 50.515625 -109.515625 C 38.972656 -114.929688 29.710938 -122.507812 22.734375 -132.25 C 15.753906 -142 12.265625 -154.453125 12.265625 -169.609375 C 12.265625 -185.960938 16.535156 -199.734375 25.078125 -210.921875 C 33.617188 -222.109375 45.164062 -230.523438 59.71875 -236.171875 C 74.269531 -241.828125 90.453125 -244.65625 108.265625 -244.65625 C 131.835938 -244.65625 152.820312 -240.925781 171.21875 -233.46875 C 189.625 -226.019531 204.84375 -216.28125 216.875 -204.25 L 176.828125 -152.640625 C 167.203125 -162.742188 155.351562 -170.984375 141.28125 -177.359375 C 127.207031 -183.734375 113.675781 -186.921875 100.6875 -186.921875 C 94.425781 -186.921875 89.25 -185.835938 85.15625 -183.671875 C 81.070312 -181.515625 79.03125 -178.269531 79.03125 -173.9375 C 79.03125 -167.195312 82.394531 -162.265625 89.125 -159.140625 C 95.863281 -156.015625 105.128906 -153.128906 116.921875 -150.484375 L 145.421875 -143.984375 C 171.890625 -137.972656 191.554688 -129.128906 204.421875 -117.453125 C 217.296875 -105.785156 223.734375 -89.96875 223.734375 -70 C 223.734375 -53.644531 219.460938 -39.992188 210.921875 -29.046875 C 202.378906 -18.097656 190.769531 -9.914062 176.09375 -4.5 C 161.425781 0.902344 144.828125 3.609375 126.296875 3.609375 Z M 126.296875 3.609375 "/></g></g></g></g></g><g transform="matrix(1, 0, 0, 1, 57, 1299)"><g clip-path="url(#39b9e7ec69)"><g fill="#4f46e5" fill-opacity="1"><g transform="translate(11.007912, 163.100306)"><g><path d="M 38.5 0 L 2.4375 -120.1875 L 29.890625 -120.1875 L 45.640625 -68.0625 C 46.722656 -64.476562 47.75 -60.710938 48.71875 -56.765625 C 49.695312 -52.816406 50.675781 -47.863281 51.65625 -41.90625 C 52.625 -47.863281 53.59375 -52.789062 54.5625 -56.6875 C 55.539062 -60.582031 56.570312 -64.375 57.65625 -68.0625 L 72.4375 -120.1875 L 101.84375 -120.1875 L 115.96875 -68.0625 C 116.945312 -64.375 117.921875 -60.523438 118.890625 -56.515625 C 119.867188 -52.515625 120.898438 -47.644531 121.984375 -41.90625 C 123.171875 -47.96875 124.25 -52.921875 125.21875 -56.765625 C 126.195312 -60.609375 127.226562 -64.265625 128.3125 -67.734375 L 144.390625 -120.1875 L 171.1875 -120.1875 L 134.484375 0 L 108.828125 0 L 86.890625 -78.9375 L 64.3125 0 Z M 38.5 0 "/></g></g></g><g fill="#4f46e5" fill-opacity="1"><g transform="translate(219.565379, 163.100306)"><g><path d="M 88.84375 0 L 12.5 0 L 12.5 -120.1875 L 88.84375 -120.1875 L 88.84375 -95.828125 L 38.8125 -95.828125 L 38.8125 -72.28125 L 83.15625 -72.28125 L 83.15625 -49.21875 L 38.8125 -49.21875 L 38.8125 -24.359375 L 88.84375 -24.359375 Z M 88.84375 0 "/></g></g></g><g fill="#4f46e5" fill-opacity="1"><g transform="translate(352.43127, 163.100306)"><g><path d="M 12.5 0 L 12.5 -120.1875 L 62.53125 -120.1875 C 74.65625 -120.1875 84.15625 -117.207031 91.03125 -111.25 C 97.90625 -105.300781 101.34375 -97.179688 101.34375 -86.890625 C 101.34375 -73.796875 95.769531 -64.8125 84.625 -59.9375 C 96.75 -55.925781 102.8125 -46.992188 102.8125 -33.140625 C 102.8125 -22.523438 99.34375 -14.347656 92.40625 -8.609375 C 85.476562 -2.867188 75.519531 0 62.53125 0 Z M 59.765625 -97.125 L 38.8125 -97.125 L 38.8125 -70.984375 L 59.765625 -70.984375 C 69.515625 -70.984375 74.390625 -75.421875 74.390625 -84.296875 C 74.390625 -92.847656 69.515625 -97.125 59.765625 -97.125 Z M 61.078125 -48.890625 L 38.8125 -48.890625 L 38.8125 -23.0625 L 61.078125 -23.0625 C 70.921875 -23.0625 75.84375 -27.5 75.84375 -36.375 C 75.84375 -44.71875 70.921875 -48.890625 61.078125 -48.890625 Z M 61.078125 -48.890625 "/></g></g></g><g fill="#4f46e5" fill-opacity="1"><g transform="translate(495.367686, 163.100306)"><g/></g></g><g fill="#4f46e5" fill-opacity="1"><g transform="translate(573.332816, 163.100306)"><g><path d="M 5.84375 -85.265625 C 5.84375 -92.523438 7.738281 -98.941406 11.53125 -104.515625 C 15.320312 -110.097656 20.546875 -114.484375 27.203125 -117.671875 C 33.859375 -120.867188 41.46875 -122.46875 50.03125 -122.46875 C 58.6875 -122.46875 66.15625 -120.953125 72.4375 -117.921875 C 78.71875 -114.890625 83.5625 -110.609375 86.96875 -105.078125 C 90.382812 -99.554688 92.09375 -93.007812 92.09375 -85.4375 L 65.9375 -85.4375 C 65.9375 -89.65625 64.472656 -92.984375 61.546875 -95.421875 C 58.628906 -97.859375 54.679688 -99.078125 49.703125 -99.078125 C 44.398438 -99.078125 40.148438 -97.9375 36.953125 -95.65625 C 33.753906 -93.382812 32.15625 -90.25 32.15625 -86.25 C 32.15625 -82.5625 33.128906 -79.742188 35.078125 -77.796875 C 37.023438 -75.847656 40.113281 -74.441406 44.34375 -73.578125 L 62.375 -69.84375 C 73.09375 -67.675781 81.050781 -63.910156 86.25 -58.546875 C 91.445312 -53.191406 94.046875 -45.75 94.046875 -36.21875 C 94.046875 -28.53125 92.148438 -21.789062 88.359375 -16 C 84.566406 -10.207031 79.234375 -5.738281 72.359375 -2.59375 C 65.484375 0.539062 57.441406 2.109375 48.234375 2.109375 C 39.359375 2.109375 31.585938 0.589844 24.921875 -2.4375 C 18.265625 -5.46875 13.125 -9.769531 9.5 -15.34375 C 5.875 -20.925781 4.0625 -27.453125 4.0625 -34.921875 L 30.203125 -34.921875 C 30.203125 -30.585938 31.769531 -27.226562 34.90625 -24.84375 C 38.050781 -22.46875 42.550781 -21.28125 48.40625 -21.28125 C 54.351562 -21.28125 59.0625 -22.390625 62.53125 -24.609375 C 66 -26.828125 67.734375 -29.832031 67.734375 -33.625 C 67.734375 -36.976562 66.890625 -39.570312 65.203125 -41.40625 C 63.523438 -43.25 60.6875 -44.550781 56.6875 -45.3125 L 38.328125 -49.046875 C 16.671875 -53.484375 5.84375 -65.554688 5.84375 -85.265625 Z M 5.84375 -85.265625 "/></g></g></g><g fill="#4f46e5" fill-opacity="1"><g transform="translate(707.173148, 163.100306)"><g><path d="M 3.25 -95.828125 L 3.25 -120.1875 L 97.78125 -120.1875 L 97.78125 -95.828125 L 63.671875 -95.828125 L 63.671875 0 L 37.359375 0 L 37.359375 -95.828125 Z M 3.25 -95.828125 "/></g></g></g><g fill="#4f46e5" fill-opacity="1"><g transform="translate(843.125112, 163.100306)"><g><path d="M 11.6875 -45.15625 L 11.6875 -120.1875 L 38 -120.1875 L 38 -46.9375 C 38 -39.363281 40.003906 -33.570312 44.015625 -29.5625 C 48.023438 -25.550781 53.710938 -23.546875 61.078125 -23.546875 C 68.546875 -23.546875 74.304688 -25.601562 78.359375 -29.71875 C 82.421875 -33.832031 84.453125 -39.570312 84.453125 -46.9375 L 84.453125 -120.1875 L 110.765625 -120.1875 L 110.765625 -45.15625 C 110.765625 -35.625 108.734375 -27.335938 104.671875 -20.296875 C 100.617188 -13.265625 94.851562 -7.796875 87.375 -3.890625 C 79.90625 0.00390625 71.140625 1.953125 61.078125 1.953125 C 51.109375 1.953125 42.414062 0.0273438 35 -3.8125 C 27.582031 -7.65625 21.84375 -13.125 17.78125 -20.21875 C 13.71875 -27.3125 11.6875 -35.625 11.6875 -45.15625 Z M 11.6875 -45.15625 "/></g></g></g><g fill="#4f46e5" fill-opacity="1"><g transform="translate(1000.517653, 163.100306)"><g><path d="M 59.609375 0 L 12.5 0 L 12.5 -120.1875 L 57.984375 -120.1875 C 69.785156 -120.1875 80.148438 -117.640625 89.078125 -112.546875 C 98.015625 -107.460938 105.023438 -100.375 110.109375 -91.28125 C 115.203125 -82.1875 117.75 -71.679688 117.75 -59.765625 C 117.75 -48.078125 115.285156 -37.738281 110.359375 -28.75 C 105.429688 -19.757812 98.609375 -12.71875 89.890625 -7.625 C 81.179688 -2.539062 71.085938 0 59.609375 0 Z M 55.390625 -95.828125 L 38.8125 -95.828125 L 38.8125 -24.359375 L 57.015625 -24.359375 C 67.410156 -24.359375 75.503906 -27.472656 81.296875 -33.703125 C 87.085938 -39.929688 89.984375 -48.617188 89.984375 -59.765625 C 89.984375 -71.140625 86.953125 -79.992188 80.890625 -86.328125 C 74.828125 -92.660156 66.328125 -95.828125 55.390625 -95.828125 Z M 55.390625 -95.828125 "/></g></g></g><g fill="#4f46e5" fill-opacity="1"><g transform="translate(1159.047177, 163.100306)"><g><path d="M 38.8125 -120.1875 L 38.8125 0 L 12.5 0 L 12.5 -120.1875 Z M 38.8125 -120.1875 "/></g></g></g><g fill="#4f46e5" fill-opacity="1"><g transform="translate(1245.296081, 163.100306)"><g><path d="M 123.609375 -60.265625 C 123.609375 -48.023438 121.113281 -37.222656 116.125 -27.859375 C 111.144531 -18.492188 104.210938 -11.179688 95.328125 -5.921875 C 86.453125 -0.671875 76.171875 1.953125 64.484375 1.953125 C 52.898438 1.953125 42.691406 -0.671875 33.859375 -5.921875 C 25.035156 -11.179688 18.160156 -18.46875 13.234375 -27.78125 C 8.304688 -37.09375 5.84375 -47.863281 5.84375 -60.09375 C 5.84375 -72.332031 8.332031 -83.132812 13.3125 -92.5 C 18.300781 -101.863281 25.207031 -109.171875 34.03125 -114.421875 C 42.851562 -119.671875 53.054688 -122.296875 64.640625 -122.296875 C 76.335938 -122.296875 86.597656 -119.671875 95.421875 -114.421875 C 104.242188 -109.171875 111.144531 -101.890625 116.125 -92.578125 C 121.113281 -83.265625 123.609375 -72.492188 123.609375 -60.265625 Z M 95.828125 -60.265625 C 95.828125 -71.734375 93.066406 -80.71875 87.546875 -87.21875 C 82.023438 -93.71875 74.445312 -96.96875 64.8125 -96.96875 C 55.0625 -96.96875 47.425781 -93.71875 41.90625 -87.21875 C 36.382812 -80.71875 33.625 -71.734375 33.625 -60.265625 C 33.625 -48.785156 36.382812 -39.769531 41.90625 -33.21875 C 47.425781 -26.664062 55.0625 -23.390625 64.8125 -23.390625 C 74.445312 -23.390625 82.023438 -26.691406 87.546875 -33.296875 C 93.066406 -39.898438 95.828125 -48.890625 95.828125 -60.265625 Z M 95.828125 -60.265625 "/></g></g></g></g></g><g clip-path="url(#d5ef3e5f0d)"><path fill="#4f46e5" d="M 861.589844 575.617188 L 1242.59375 505.332031 L 859.125 439.984375 L 963.929688 288.320312 L 817.199219 393.128906 L 748.152344 10.890625 L 682.800781 395.59375 L 532.375 288.320312 L 635.945312 439.984375 L 254.945312 505.332031 L 635.945312 575.617188 L 532.375 721.113281 L 682.800781 617.539062 L 748.152344 998.542969 L 818.433594 620.003906 L 963.929688 721.113281 Z M 861.589844 575.617188 " fill-opacity="1" fill-rule="nonzero"/></g><g clip-path="url(#abcf7419e7)"><g clip-path="url(#848a88a2c9)"><g transform="matrix(1, 0, 0, 1, 677, 425)"><g clip-path="url(#81833ce384)"><g clip-path="url(#bad4aa786d)"><g clip-path="url(#d943719314)"><path fill="#ffffff" d="M 0.078125 0.464844 L 145.921875 0.464844 L 145.921875 146.308594 L 0.078125 146.308594 Z M 0.078125 0.464844 " fill-opacity="1" fill-rule="nonzero"/></g></g></g></g></g></g></svg>`;
      const logoSvgEl = new DOMParser().parseFromString(polarisLockupSvg, "image/svg+xml").documentElement as unknown as SVGElement;

      // --- Construcción del PDF (coordenadas en px, unit:'px' con el hotfix "px_scaling" ---
      // sin ese hotfix jsPDF interpreta 'px' como si fuera a 72dpi en vez de 96dpi, y la
      // página termina con dimensiones físicas totalmente distintas a las pedidas (bug
      // real encontrado en vivo: una factura corta salía "cuadrada" en vez de tamaño Carta).
      const PAGE_W = 816; // 8.5in a 96dpi
      const PAGE_H = 1056; // 11in a 96dpi -- tamaño Carta fijo, como cualquier factura real
      const MARGIN = 56;
      const RIGHT = PAGE_W - MARGIN;
      const FOOTER_H = 64;
      const pt = (px: number) => px * 0.75; // jsPDF setFontSize() siempre toma puntos, aunque el documento use px.
      const INK = [15, 23, 42];
      const MUTED = [107, 101, 96];
      const INDIGO = [79, 70, 229];

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [PAGE_W, PAGE_H],
        hotfixes: ["px_scaling"],
      });
      pdf.setProperties({ title: `Factura ${inv.invoiceNumber}` });

      // Fondo general de la página (gris muy claro, como la plantilla original)
      pdf.setFillColor(237, 235, 233);
      pdf.rect(0, 0, PAGE_W, PAGE_H, "F");

      // --- Encabezado ---
      const { svg2pdf } = await import("svg2pdf.js");
      await svg2pdf(logoSvgEl, pdf, { x: MARGIN, y: MARGIN, width: 84, height: 84 });

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(pt(32));
      pdf.setTextColor(INK[0], INK[1], INK[2]);
      pdf.text("FACTURA", RIGHT, MARGIN + 26, { align: "right" });

      pdf.setFontSize(pt(14));
      pdf.setTextColor(INDIGO[0], INDIGO[1], INDIGO[2]);
      pdf.text(`N° ${inv.invoiceNumber}`, RIGHT, MARGIN + 46, { align: "right" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(pt(10));
      pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      pdf.text("NCF: 123456789", RIGHT, MARGIN + 62, { align: "right" });

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(pt(10));
      const pillTextW = pdf.getTextWidth(statusLabel);
      const pillW = pillTextW + 32;
      const pillH = 22;
      const pillY = MARGIN + 74;
      pdf.setFillColor(statusColors.bg[0], statusColors.bg[1], statusColors.bg[2]);
      pdf.roundedRect(RIGHT - pillW, pillY, pillW, pillH, pillH / 2, pillH / 2, "F");
      pdf.setTextColor(statusColors.text[0], statusColors.text[1], statusColors.text[2]);
      pdf.text(statusLabel, RIGHT - pillW / 2, pillY + pillH / 2 + 3.5, { align: "center" });

      // --- Datos del cliente / fecha / empresa ---
      const infoY = pillY + pillH + 32;
      const col1X = MARGIN;
      const col2X = MARGIN + 264;
      const col3X = RIGHT;

      const label = (text: string, x: number, y: number, align: "left" | "right" = "left") => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(pt(9));
        pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        pdf.text(text.toUpperCase(), x, y, { align });
      };

      let c1y = infoY;
      label("Datos del cliente", col1X, c1y);
      c1y += 16;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(pt(13));
      pdf.setTextColor(INK[0], INK[1], INK[2]);
      pdf.text(clientName, col1X, c1y);
      c1y += 15;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(pt(10));
      pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      if (clientEmail) { pdf.text(clientEmail, col1X, c1y); c1y += 13; }
      if (clientPhone) { pdf.text(clientPhone, col1X, c1y); c1y += 13; }
      c1y += 6;
      label("Proyecto", col1X, c1y);
      c1y += 15;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(pt(11));
      pdf.setTextColor(INK[0], INK[1], INK[2]);
      pdf.text(project?.name || "—", col1X, c1y);

      let c2y = infoY;
      label("Fecha de emisión", col2X, c2y);
      c2y += 16;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(pt(11));
      pdf.setTextColor(INK[0], INK[1], INK[2]);
      const [emYear, emMonth, emDay] = String(inv.date).split("-");
      pdf.text(emYear && emMonth && emDay ? `${emDay}/${emMonth}/${emYear}` : inv.date, col2X, c2y);

      let c3y = infoY;
      label("Datos de la empresa", col3X, c3y, "right");
      c3y += 16;
      const rightLine = (l: string, v: string) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(pt(10));
        pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        pdf.text(l, col3X, c3y, { align: "right" });
        c3y += 12;
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(INK[0], INK[1], INK[2]);
        pdf.text(v, col3X, c3y, { align: "right" });
        c3y += 16;
      };
      rightLine("Correo electrónico", "hola@polarisweb.studio");
      rightLine("Teléfono", "+1 829-920-0544");
      rightLine("RNC", "123456789");

      // --- Tabla de productos ---
      let tableY = Math.max(c1y, c2y, c3y) + 24;
      const tc1 = MARGIN;
      const tc2 = MARGIN + 305.8;
      const tc3 = MARGIN + 433.2;
      const tc4 = RIGHT;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(pt(9));
      pdf.setTextColor(INK[0], INK[1], INK[2]);
      pdf.text("PRODUCTO", tc1, tableY);
      pdf.text("PRECIO", tc2, tableY, { align: "right" });
      pdf.text("CANTIDAD", tc3, tableY, { align: "right" });
      pdf.text("SUBTOTAL", tc4, tableY, { align: "right" });
      tableY += 10;
      pdf.setDrawColor(INK[0], INK[1], INK[2]);
      pdf.setLineWidth(2);
      pdf.line(MARGIN, tableY, RIGHT, tableY);

      const descColWidth = tc2 - tc1 - 80; // reserva espacio real para la columna de precio (que crece hacia la izquierda desde tc2, right-aligned)
      const descLineH = 15;
      invoiceItems.forEach((it) => {
        tableY += 24;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(pt(12));
        pdf.setTextColor(INK[0], INK[1], INK[2]);
        // Descripciones largas se parten en varias líneas en vez de superponerse con la
        // columna de precio -- precio/cantidad/subtotal quedan alineados con la primera línea.
        const descLines = pdf.splitTextToSize(it.description, descColWidth);
        pdf.text(descLines, tc1, tableY);
        pdf.text(`$${it.price.toFixed(2)}`, tc2, tableY, { align: "right" });
        pdf.text(String(it.quantity), tc3, tableY, { align: "right" });
        pdf.setFont("helvetica", "bold");
        pdf.text(`$${(it.price * it.quantity).toFixed(2)}`, tc4, tableY, { align: "right" });
        tableY += (descLines.length - 1) * descLineH + 12;
        pdf.setDrawColor(216, 212, 207);
        pdf.setLineWidth(1);
        pdf.line(MARGIN, tableY, RIGHT, tableY);
      });

      // --- Forma de pago + tarjeta de totales ---
      let bottomY = tableY + 28;
      label("Forma de pago:", MARGIN, bottomY);
      bottomY += 16;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(pt(12));
      pdf.setTextColor(INK[0], INK[1], INK[2]);
      pdf.text(payment.label, MARGIN, bottomY);
      bottomY += 15;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(pt(10));
      pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      pdf.text(payment.detail, MARGIN, bottomY, { maxWidth: 360 });

      const boxW = 280;
      const boxX = RIGHT - boxW;
      const boxY = tableY + 28;
      const boxH = 92 + (inv.exchangeRate ? 36 : 0);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(boxX, boxY, boxW, boxH, 4, 4, "F");

      let ty = boxY + 26;
      const totalsRow = (l: string, v: string) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(pt(9));
        pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        pdf.text(l.toUpperCase(), boxX + 24, ty);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(pt(11));
        pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        pdf.text(v, boxX + boxW - 24, ty, { align: "right" });
        ty += 22;
      };
      totalsRow("Subtotal", `$${Number(inv.amount).toFixed(2)}`);
      totalsRow("Impuestos", "$0.00");
      pdf.setDrawColor(INK[0], INK[1], INK[2]);
      pdf.setLineWidth(2);
      pdf.line(boxX + 24, ty - 4, boxX + boxW - 24, ty - 4);
      ty += 12;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(pt(12));
      pdf.setTextColor(INK[0], INK[1], INK[2]);
      pdf.text("TOTAL (USD)", boxX + 24, ty);
      pdf.setFontSize(pt(20));
      pdf.setTextColor(INDIGO[0], INDIGO[1], INDIGO[2]);
      pdf.text(`$${Number(inv.amount).toFixed(2)}`, boxX + boxW - 24, ty, { align: "right" });
      ty += 22;
      if (inv.exchangeRate) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(pt(10));
        pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        pdf.text("TOTAL (RD)", boxX + 24, ty);
        pdf.text(
          `RD$ ${(Number(inv.amount) * Number(inv.exchangeRate)).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          boxX + boxW - 24,
          ty,
          { align: "right" }
        );
        ty += 15;
        pdf.setFontSize(pt(9));
        pdf.setTextColor(161, 156, 150);
        pdf.text("Tasa:", boxX + 24, ty);
        pdf.text(`${Number(inv.exchangeRate).toFixed(2)} DOP`, boxX + boxW - 24, ty, { align: "right" });
      }

      // --- Pie de página (fijo al fondo de la página tamaño Carta) ---
      const footerY = PAGE_H - FOOTER_H;
      pdf.setFillColor(INDIGO[0], INDIGO[1], INDIGO[2]);
      pdf.rect(0, footerY, PAGE_W, FOOTER_H, "F");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(pt(12));
      pdf.setTextColor(255, 255, 255);
      pdf.text("polarisweb.studio", PAGE_W / 2 - 70, footerY + FOOTER_H / 2 + 4, { align: "center" });
      pdf.text("+1 829-920-0544", PAGE_W / 2 + 70, footerY + FOOTER_H / 2 + 4, { align: "center" });

      pdf.save(`Factura-${inv.invoiceNumber}.pdf`);

      setPdfGeneratingId(null);
      setPdfSuccessId(inv.id);
      setTimeout(() => setPdfSuccessId(null), 1800);
    } catch (err) {
      console.error("Error generando el PDF de la factura:", err);
      setPdfGeneratingId(null);
      setErrorMsg("No se pudo generar el PDF de la factura.");
    }
  };

  return (
    <div className="min-h-dvh bg-[var(--color-surface-base)] flex flex-col md:flex-row">
      
      {/* Toast Notification HUD -- se renderiza en un portal a document.body porque el
          motion.div de la transición de página (AnimatedRoutes, App.tsx) anima con
          transform, lo que crea un nuevo containing block para position:fixed y deja el
          toast posicionado relativo a ese ancestro (a veces fuera de vista) en vez del
          viewport real. Mismo patrón que ya usa RouteLoader en App.tsx para el mismo problema. */}
      {createPortal(
        <AnimatePresence>
          {(successMsg || errorMsg) && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 16 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
            >
              {successMsg && (
                <div className="p-4 rounded-xl bg-[var(--color-surface-elevated)] backdrop-blur-xl border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-sm flex items-start gap-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
                  <div className="bg-emerald-500/10 p-1.5 rounded-full text-emerald-500 shrink-0">
                    <CheckCircle size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[var(--color-text-primary)]">Acción Completada</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{successMsg}</p>
                  </div>
                  <button onClick={() => setSuccessMsg(null)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all">
                    <X size={16} />
                  </button>
                </div>
              )}
              {errorMsg && (
                <div className="p-4 rounded-xl bg-[var(--color-surface-elevated)] backdrop-blur-xl border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-sm flex items-start gap-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
                  <div className="bg-red-500/10 p-1.5 rounded-full text-red-500 shrink-0">
                    <AlertCircle size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[var(--color-text-primary)]">Atención</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{errorMsg}</p>
                  </div>
                  <button onClick={() => setErrorMsg(null)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all">
                    <X size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      {/* Mobile Navigation Header */}
      <aside className="block md:hidden border-b border-[var(--color-border-subtle)] glass-panel p-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <img src="/brand/lockup-horizontal-blanco.svg" alt="Polaris Web Studio" className="h-11 w-auto [.light_&]:hidden" />
          <img src="/brand/lockup-horizontal-color.svg" alt="Polaris Web Studio" className="h-11 w-auto hidden [.light_&]:block" />
          <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 flex items-center gap-1 rounded-full text-[9px] uppercase font-black tracking-widest ${
              isAdmin 
                ? "bg-indigo-500/10 text-indigo-400" 
                : "bg-emerald-500/10 text-emerald-400"
            }`}>
              <div className={`w-1 h-1 rounded-full ${isAdmin ? "bg-indigo-400 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
              {isAdmin ? "ADMIN" : <T en="Client">Cliente</T>}
            </div>
          </div>
        </div>

        {/* Dropdown Selector for Active View */}
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1" ref={mobileTabDropdownRef}>
            {/* Custom styled select button */}
            <button
              onClick={() => setMobileTabDropdownOpen(!mobileTabDropdownOpen)}
              className="w-full bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2.5 flex items-center justify-between text-sm font-bold text-[var(--color-text-primary)] cursor-pointer hover:bg-[var(--color-surface-hover)] transition-all select-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <div className="flex items-center gap-2.5">
                {activeTab === "overview" && <Clock size={16} className="text-[var(--color-primary-base)]" />}
                {activeTab === "tasks" && <CheckCircle2 size={16} className="text-emerald-400" />}
                {activeTab === "invoices" && <FileText size={16} className="text-indigo-400" />}
                {activeTab === "meetings" && <Calendar size={16} className="text-pink-400" />}
                {activeTab === "updates" && <RefreshCw size={14} className="text-cyan-400 animate-spin-slow" />}
                {activeTab === "admin-clients" && <UserPlus size={16} className="text-indigo-400" />}
                {activeTab === "admin-config" && <Settings size={16} className="text-indigo-400" />}

                <span>
                  {activeTab === "overview" && "Resumen de Avances"}
                  {activeTab === "tasks" && "Entregables y Aprobación"}
                  {activeTab === "invoices" && "Facturación y Pagos"}
                  {activeTab === "meetings" && "Agenda de Reuniones"}
                  {activeTab === "updates" && "Actualizaciones"}
                  {activeTab === "admin-clients" && "Registrar Nuevos Clientes"}
                  {activeTab === "admin-config" && "Configuración"}
                </span>

                {activeTab === "tasks" && data?.tasks.filter((t) => t.status === "pending").length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                )}
                {activeTab === "invoices" && data?.invoices.filter((i) => i.status === "pending").length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </div>
              <ChevronDown size={16} className={`text-[var(--color-text-tertiary)] transition-transform duration-200 ${mobileTabDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Custom Dropdown Options Overlay */}
            <AnimatePresence>
              {mobileTabDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 mt-2 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-xl shadow-xl py-1 z-50 overflow-hidden max-h-[80vh] overflow-y-auto"
                >
                  {[
                    { id: "overview", label: "Resumen de Avances", icon: Clock, iconColor: "text-[var(--color-primary-base)]" },
                    { 
                      id: "tasks", 
                      label: "Entregables y Aprobación", 
                      icon: CheckCircle2, 
                      iconColor: "text-emerald-400",
                      badge: data?.tasks.filter((t) => t.status === "pending").length || null
                    },
                    { 
                      id: "invoices", 
                      label: "Facturación y Pagos", 
                      icon: FileText, 
                      iconColor: "text-indigo-400",
                      dot: data?.invoices.filter((i) => i.status === "pending").length > 0
                    },
                    { id: "meetings", label: "Agenda de Reuniones", icon: Calendar, iconColor: "text-pink-400" },
                    { id: "updates", label: "Actualizaciones", icon: RefreshCw, iconColor: "text-cyan-400" },
                    ...(isAdmin ? [
                      { id: "admin-clients", label: "Registrar Nuevos Clientes", icon: UserPlus, iconColor: "text-indigo-400" },
                      { id: "admin-config", label: "Configuración", icon: Settings, iconColor: "text-indigo-400" }
                    ] : [])
                  ].map((tab) => {
                    const IconComponent = tab.icon;
                    const isSelected = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setMobileTabDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-all text-left ${
                          isSelected
                            ? "bg-[var(--color-primary-base)]/10 text-[var(--color-primary-base)] border-l-4 border-[var(--color-primary-base)] pl-3"
                            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-text-primary)] border-l-4 border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent size={16} className={tab.iconColor} />
                          <span>{tab.label}</span>
                        </div>

                        {tab.badge && (
                          <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none flex items-center justify-center min-w-[18px] h-[18px]">
                            {tab.badge}
                          </span>
                        )}
                        {tab.dot && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Action Popover Button */}
          <div className="relative" ref={mobileActionsDropdownRef}>
            <button
              onClick={() => setMobileActionsOpen(!mobileActionsOpen)}
              className="h-full bg-[var(--color-surface-highlight)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2.5 text-sm font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Settings size={16} />
            </button>

            {mobileActionsOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-[var(--color-border-subtle)]/50 mb-1">
                    <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-black tracking-wider leading-none">
                      {isAdmin ? "Operador" : "Empresa"}
                    </p>
                    <p className="font-bold text-xs text-[var(--color-text-primary)] truncate mt-1">
                      {user.name}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setMobileActionsOpen(false);
                      handleRefresh();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-text-primary)] transition-all text-left"
                  >
                    <RefreshCw size={12} />
                    Sincronizar Panel
                  </button>

                  <button
                    onClick={() => {
                      setMobileActionsOpen(false);
                      setPasswordChangeError(null);
                      setPasswordChangeSuccess(null);
                      setNewPasswordValue("");
                      setShowPasswordModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-text-primary)] transition-all text-left"
                  >
                    <Lock size={12} />
                    Cambiar Contraseña
                  </button>

                  <button
                    onClick={() => {
                      setMobileActionsOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-all text-left"
                  >
                    <LogOut size={12} />
                    Cerrar Sesión
                  </button>
                </div>
            )}
          </div>
        </div>
      </aside>

      {/* Sidebar navigation (Desktop only) */}
      <aside className="hidden md:flex w-64 border-r border-[var(--color-border-subtle)] glass-panel p-6 flex-col gap-8 shrink-0 justify-between">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <img src="/brand/lockup-horizontal-blanco.svg" alt="Polaris Web Studio" className="h-12 w-auto [.light_&]:hidden" />
            <img src="/brand/lockup-horizontal-color.svg" alt="Polaris Web Studio" className="h-12 w-auto hidden [.light_&]:block" />
            <div className={`px-2 py-1 flex items-center gap-1 rounded-full text-[9px] uppercase font-black tracking-widest ${
              isAdmin 
                ? "bg-indigo-500/10 text-indigo-400" 
                : "bg-emerald-500/10 text-emerald-400"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isAdmin ? "bg-indigo-400 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
              {isAdmin ? "ADMIN" : <T en="Client">Cliente</T>}
            </div>
          </div>

          <div className="p-3 bg-[var(--color-surface-highlight)] rounded-xl border border-[var(--color-border-subtle)]/50">
            <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-black tracking-wider leading-none mb-1">
              {isAdmin ? "Operador" : <T en="Company">Empresa</T>}
            </p>
            <p className="font-bold text-sm text-[var(--color-text-primary)] truncate">
              {user.name}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] truncate">
              {isAdmin ? "Administrador" : user.companyName}
            </p>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "overview"
                  ? "bg-[var(--color-primary-base)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]"
              }`}
            >
              <Clock size={16} />
              <T en="Overview">Resumen de Avances</T>
            </button>

            <button
              onClick={() => setActiveTab("tasks")}
              className={`w-full flex items-center gap-3 pl-3.5 pr-8 py-2.5 rounded-lg text-xs font-bold transition-all relative ${
                activeTab === "tasks"
                  ? "bg-[var(--color-primary-base)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]"
              }`}
            >
              <CheckCircle2 size={16} />
              <T en="Deliverables & Approvals">Entregables y Aprobación</T>
              {data?.tasks.filter((t) => t.status === "pending").length ? (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                  {data?.tasks.filter((t) => t.status === "pending").length}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab("invoices")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all relative ${
                activeTab === "invoices"
                  ? "bg-[var(--color-primary-base)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]"
              }`}
            >
              <FileText size={16} />
              <T en="Invoicing">Facturación y Pagos</T>
              {data?.invoices.filter((i) => i.status === "pending").length ? (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400" />
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab("meetings")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "meetings"
                  ? "bg-[var(--color-primary-base)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]"
              }`}
            >
              <Calendar size={16} />
              <T en="Meetings Schedule">Agenda de Reuniones</T>
            </button>

            <button
              onClick={() => setActiveTab("updates")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "updates"
                  ? "bg-[var(--color-primary-base)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]"
              }`}
            >
              <RefreshCw size={14} />
              <T en="Updates">Actualizaciones</T>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin-clients")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all border border-indigo-500/20 ${
                  activeTab === "admin-clients"
                    ? "bg-indigo-600 text-white border-transparent"
                    : "text-indigo-400 hover:bg-indigo-500/10"
                }`}
              >
                <UserPlus size={16} />
                <T en="Register Clients">Registrar Nuevos Clientes</T>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin-config")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all border border-indigo-500/20 ${
                  activeTab === "admin-config"
                    ? "bg-indigo-600 text-white border-transparent"
                    : "text-indigo-400 hover:bg-indigo-500/10"
                }`}
              >
                <Settings size={16} />
                <T en="System Config">Configuración</T>
              </button>
            )}
          </nav>
        </div>

        <div className="pt-6 border-t border-[var(--color-border-subtle)]/30 space-y-3">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-bold transition-all border border-[var(--color-border-subtle)]/40 hover:border-[var(--color-border-subtle)] cursor-pointer"
          >
            <RefreshCw size={12} className="animate-hover-spin" />
            <T en="Refresh Hub">Sincronizar Panel</T>
          </button>

          <button
            onClick={() => {
              setPasswordChangeError(null);
              setPasswordChangeSuccess(null);
              setNewPasswordValue("");
              setShowPasswordModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--color-surface-highlight)] hover:bg-[var(--color-surface-highlight)]/70 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-bold transition-all border border-[var(--color-border-subtle)]/40 hover:border-[var(--color-border-subtle)] cursor-pointer"
          >
            <Settings size={13} />
            <T en="Change Password">Cambiar Contraseña</T>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-red-500/10 text-red-500 text-xs font-bold transition-all cursor-pointer border border-transparent hover:border-red-500/25"
          >
            <LogOut size={14} />
            <T en="Log Out">Cerrar Sesión</T>
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
        
        {/* Navigation header section */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight mb-2">
              {isAdmin ? (
                <T en="Elite Project Operations">Panel de Control</T>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span><T en="Your Project">Tu Proyecto</T></span>
                  {data?.projects && data.projects.length > 1 ? (
                    <CustomSelect
                      options={data.projects.map((p: any) => ({
                        id: p.id,
                        label: p.name
                      }))}
                      value={selectedClientProjectId || ""}
                      onChange={(val) => {
                        setSelectedClientProjectId(val);
                        setAiSummary(null);
                      }}
                      className="inline-block min-w-[200px]"
                      buttonClassName="font-sans font-bold bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-1.5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base md:text-sm text-[var(--color-text-primary)] cursor-pointer hover:bg-[var(--color-surface-hover)] transition-all flex items-center justify-between text-left"
                    />
                  ) : (
                    <span className="text-indigo-400 font-bold">: {clientProject?.name || "Cargando..."}</span>
                  )}
                </div>
              )}
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm">
              {isAdmin ? (
                "Monitorea el progreso, autoriza entregables aprobados y crea cuentas de clientes en vivo."
              ) : (
                <span className="flex items-center gap-1.5">
                  <Briefcase size={20} className="text-indigo-400 shrink-0" />
                  <T en="Here you can see your project progress, review deliverables, and make payments.">
                    Aquí puedes ver el avance de tu proyecto, revisar entregables y realizar pagos.
                  </T>
                </span>
              )}
            </p>
          </div>
          
          <LiveClock />
        </header>

        {/* LOADING STATE */}
        {loading && (
          <DashboardSkeleton />
        )}

        {/* RENDER ACTIVE VIEWS */}
        {!loading && data && (
          <div>
            
            {/* ----------------------------------------------------
                TAB 1: OVERVIEW (RESUMEN)
                ---------------------------------------------------- */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                
                {/* Admin Overview Projects List */}
                {isAdmin ? (
                  <div className="space-y-6">
                    {/* Admin Dashboard Stats (Bento Style) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] space-y-3 bento-glow shadow-sm transition-all hover:border-indigo-500/25 will-change-transform transition-all">
                        <div className="flex justify-between items-center text-[var(--color-text-tertiary)]">
                          <span className="text-[10px] font-black uppercase tracking-widest">Clientes Totales</span>
                          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <Users size={16} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-3xl font-display font-black text-[var(--color-text-primary)]">{data.projects.length}</p>
                          <p className="text-[10px] text-[var(--color-text-tertiary)] font-semibold uppercase tracking-wider">Cuentas Activas Registradas</p>
                        </div>
                      </div>

                      <div className="p-6 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] space-y-3 bento-glow shadow-sm transition-all hover:border-amber-500/25 will-change-transform transition-all">
                        <div className="flex justify-between items-center text-[var(--color-text-tertiary)]">
                          <span className="text-[10px] font-black uppercase tracking-widest">Balances Pendientes</span>
                          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                            <DollarSign size={16} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-3xl font-display font-black text-[var(--color-text-primary)]">
                            {formatMoney(data.invoices.filter(i => i.status === "pending").reduce((acc, curr) => acc + curr.amount, 0))}
                          </p>
                          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                            {data.invoices.filter(i => i.status === "pending").length} facturas pendientes por cobrar
                          </p>
                        </div>
                      </div>

                      <div className="p-6 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] space-y-3 bento-glow shadow-sm transition-all hover:border-emerald-500/25 will-change-transform transition-all">
                        <div className="flex justify-between items-center text-[var(--color-text-tertiary)]">
                          <span className="text-[10px] font-black uppercase tracking-widest">Aprobaciones Pendientes</span>
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <CheckCircle2 size={16} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-3xl font-display font-black text-[var(--color-text-primary)]">
                            {data.tasks.filter(t => t.status === "pending").length}
                          </p>
                          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Entregables aguardando validación</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border-subtle)]/30 mt-6">
                      <h2 className="text-lg font-display font-bold flex items-center gap-2">
                        <Briefcase size={18} className="text-indigo-400" />
                        Proyectos Activos de Clientes ({data.projects.length})
                      </h2>
                    </div>

                    {data.projects.length === 0 ? (
                      <div className="p-8 rounded-[var(--radius-bento)] glass-panel border border-dashed border-[var(--color-border-subtle)] text-center space-y-3">
                        <HelpCircle size={36} className="mx-auto text-[var(--color-text-tertiary)]" />
                        <h3 className="font-bold">No hay clientes con proyectos registrados</h3>
                        <p className="text-xs text-[var(--color-text-secondary)]">Ve a la pestaña "Registrar Nuevos Clientes" para crear el primero.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6">
                        {data.projects.slice((projectsPage - 1) * itemsPerPage, projectsPage * itemsPerPage).map((project) => {
                          const clientUser = data.clients?.find(u => u.id === project.clientUserId);
                          const isExpanded = !!expandedProjects[project.id];
                          return (
                            <div
                              key={project.id}
                              className="rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] overflow-hidden hover:border-indigo-500/20 transition-all bento-glow shadow-sm"
                            >
                              {/* Header del proyecto (Siempre Visible) */}
                              <div
                                onClick={() => setExpandedProjects(prev => ({ ...prev, [project.id]: !prev[project.id] }))}
                                className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 cursor-pointer select-none bg-[var(--color-surface-base)]/40 hover:bg-[var(--color-surface-hover)] transition-all"
                              >
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-display font-black text-lg text-[var(--color-text-primary)]">
                                      {project.displayId ? `${project.displayId} - ` : ""}{project.name}
                                    </h3>
                                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] rounded border border-indigo-500/20 uppercase font-black tracking-widest">
                                      {clientUser?.companyName || "Empresa"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span><strong>Contacto:</strong> {clientUser?.name}</span>
                                    <span className="text-[var(--color-border-subtle)]">•</span>
                                    <span>{clientUser?.email}</span>
                                  </p>

                                  {/* Quick progress stats badges */}
                                  <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <span className="inline-flex items-center gap-1.5 text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                      Fase: {project.currentPhase}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded tracking-wider">
                                      Progreso: {project.progress}%
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-[var(--color-border-subtle)]/10 pt-3 md:pt-0">
                                  <button
                                    type="button"
                                    className="px-4 py-2 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <span>{isExpanded ? "Ocultar Detalles" : "Ver Detalles"}</span>
                                    <ChevronDown size={14} className={`text-[var(--color-text-tertiary)] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                  </button>
                                </div>
                              </div>

                              {/* Detalles del proyecto (Desplegables) */}
                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                    className="border-t border-[var(--color-border-subtle)]/30 bg-[var(--color-surface-base)]/10"
                                  >
                                    <div className="p-6 space-y-6">
                                      <p className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-highlight)] p-3 rounded-lg border border-[var(--color-border-subtle)]/40">
                                        <strong>Descripción del Proyecto:</strong> {project.description}
                                      </p>

                                      {/* Progress bar and milestone controller */}
                                      <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                          <button
                                            type="button"
                                            disabled={!!aiLoadingProgress}
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              setAiLoadingProgress(project.id);
                                              try {
                                                const approvedTasks = data.tasks.filter(
                                                  t => t.projectId === project.id && t.status === "approved"
                                                ).length;
                                                const pendingTasks = data.tasks.filter(
                                                  t => t.projectId === project.id && t.status === "pending"
                                                ).length;
                                                const suggestion = await callAI("/api/ai/suggest-progress", {
                                                  projectName: project.name,
                                                  currentPhase: project.currentPhase,
                                                  progress: project.progress,
                                                  approvedTasks,
                                                  pendingTasks,
                                                });
                                                const parsed = JSON.parse(suggestion);
                                                const updatedPhases = project.phases.map((ph: any, i: number) => ({
                                                  ...ph,
                                                  status: i < parsed.phaseIndex ? "completed"
                                                         : i === parsed.phaseIndex ? "active"
                                                         : "pending"
                                                }));
                                                // Usa el nombre real de la fase marcada como activa, no el texto libre
                                                // que redacta la IA en "suggestedPhase" — si difieren aunque sea en un
                                                // detalle, la insignia de arriba y la tarjeta "En Curso" quedan
                                                // mostrando nombres distintos para la misma fase.
                                                const activePhaseName =
                                                  updatedPhases[parsed.phaseIndex]?.name || parsed.suggestedPhase;
                                                await handleUpdateProjectProgress(
                                                  project.id,
                                                  parsed.suggestedProgress,
                                                  activePhaseName,
                                                  updatedPhases
                                                );
                                                setSuccessMsg(`IA sugirió: ${parsed.reason}`);
                                              } catch (e) {
                                                setErrorMsg("No se pudo calcular el avance con IA.");
                                              } finally {
                                                setAiLoadingProgress(null);
                                              }
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black hover:bg-indigo-500/20 transition disabled:opacity-40 w-fit cursor-pointer"
                                          >
                                            {aiLoadingProgress === project.id ? (
                                              <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                            ) : "🤖"}
                                            Auto-avanzar fase
                                          </button>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-bold">
                                          <span className="text-[var(--color-primary-base)] bg-[var(--color-primary-base)]/10 px-2 py-1 rounded">
                                            {project.currentPhase}
                                          </span>
                                          <span className="text-[var(--color-text-primary)]">{project.progress}%</span>
                                        </div>

                                        <div className="h-2.5 w-full bg-[var(--color-surface-highlight)] rounded-full overflow-hidden border border-[var(--color-border-subtle)]/40 shadow-inner">
                                          <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-[var(--color-primary-base)] shadow-[0_0_10px_var(--color-primary-base)] transition-all duration-500"
                                            style={{ width: `${project.progress}%` }}
                                          />
                                        </div>

                                        {/* Checklist of Phases for clickable manual updates */}
                                        <div className="pt-2">
                                          <div className="mb-2">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                                              Control Secuencial del Proyecto
                                            </p>
                                            <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                                              Haz clic en cualquier fase para establecerla como activa. El sistema marcará los pasos anteriores automáticamente como completados.
                                            </p>
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {project.phases.map((phase: any, index: number) => (
                                              <button
                                                type="button"
                                                key={phase.name}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  togglePhaseStatus(project, index);
                                                }}
                                                className={`p-3.5 rounded-xl border text-left transition-all ${
                                                  phase.status === "completed"
                                                    ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-400"
                                                    : phase.status === "active"
                                                    ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400 font-bold bento-glow shadow shadow-indigo-500/5"
                                                    : "bg-[var(--color-surface-highlight)] border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] hover:border-white/25"
                                                } cursor-pointer`}
                                              >
                                                <div className="flex justify-between items-center mb-1">
                                                  <span className="text-[10px] uppercase font-black tracking-widest">
                                                    {phase.status === "completed" ? "✔ Listo" : phase.status === "active" ? "⚡ En Curso" : "⏳ Pendiente"}
                                                  </span>
                                                </div>
                                                <p className="text-xs font-bold text-[var(--color-text-primary)] truncate">{phase.name}</p>
                                                <p className="text-[10px] opacity-80 mt-1 line-clamp-1">{phase.detail}</p>
                                              </button>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Configuración de Proyecto en Vercel */}
                                        <div className="pt-4 border-t border-[var(--color-border-subtle)]/20 mt-4 space-y-3">
                                          <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                                            CONFIGURACIÓN DE DEPLOY CONTINUO
                                          </h4>
                                          <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="flex-1">
                                              <label className="block text-[10px] text-zinc-400 font-bold mb-1 uppercase">ID del Proyecto (Nombre en GitHub/Vercel)</label>
                                              <input 
                                                type="text"
                                                placeholder="ej: mi-proyecto-web"
                                                key={`vercel-id-${project.id}-${project.vercelProjectId}`}
                                                defaultValue={project.vercelProjectId || ""}
                                                onBlur={(e) => {
                                                  const val = e.target.value.trim();
                                                  // Guardar automáticamente al salir de foco
                                                  fetch(`/api/portal/projects/${project.id}/vercel`, {
                                                    method: "PUT",
                                                    headers: {
                                                      "Content-Type": "application/json",
                                                      Authorization: `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({
                                                      vercelProjectId: val,
                                                      vercelUrl: project.vercelUrl || ""
                                                    })
                                                  })
                                                    .then(res => {
                                                      if (res.ok) {
                                                        setSuccessMsg("Configuración de Vercel actualizada");
                                                        handleRefresh();
                                                      }
                                                    });
                                                }}
                                                className="glass-input w-full px-3 py-1.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)]/60 text-xs text-[var(--color-text-primary)] focus:outline-none"
                                              />
                                            </div>
                                            <div className="flex-1">
                                              <label className="block text-[10px] text-zinc-400 font-bold mb-1 uppercase">URL de Producción</label>
                                              <input 
                                                type="text"
                                                placeholder="ej: https://mi-proyecto-web.vercel.app"
                                                key={`vercel-url-${project.id}-${project.vercelUrl}`}
                                                defaultValue={project.vercelUrl || ""}
                                                onBlur={(e) => {
                                                  const val = e.target.value.trim();
                                                  // Guardar automáticamente al salir de foco
                                                  fetch(`/api/portal/projects/${project.id}/vercel`, {
                                                    method: "PUT",
                                                    headers: {
                                                      "Content-Type": "application/json",
                                                      Authorization: `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({
                                                      vercelProjectId: project.vercelProjectId || "",
                                                      vercelUrl: val
                                                    })
                                                  })
                                                    .then(res => {
                                                      if (res.ok) {
                                                        setSuccessMsg("Configuración de Vercel actualizada");
                                                        handleRefresh();
                                                      }
                                                    });
                                                }}
                                                className="glass-input w-full px-3 py-1.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)]/60 text-xs text-[var(--color-text-primary)] focus:outline-none"
                                              />
                                            </div>
                                          </div>

                                          {/* Registro manual de despliegues para administradores */}
                                          <div className="pt-3 border-t border-[var(--color-border-subtle)]/10 mt-3 space-y-2">
                                            <label className="block text-[10px] text-zinc-400 font-bold mb-1 uppercase">Registrar actualización manual (producción)</label>
                                            <div className="flex gap-2">
                                              <input 
                                                type="text"
                                                id={`manual-deploy-msg-${project.id}`}
                                                placeholder="ej: Agregamos pasarela de pago y catálogo"
                                                className="glass-input flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)]/60 text-xs text-[var(--color-text-primary)] focus:outline-none placeholder-zinc-500"
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") {
                                                    const inputEl = document.getElementById(`manual-deploy-msg-${project.id}`) as HTMLInputElement;
                                                    if (inputEl) {
                                                      const msg = inputEl.value.trim();
                                                      if (!msg) return;
                                                      fetch(`/api/portal/projects/${project.id}/deploys`, {
                                                        method: "POST",
                                                        headers: {
                                                          "Content-Type": "application/json",
                                                          Authorization: `Bearer ${token}`
                                                        },
                                                        body: JSON.stringify({ commitMessage: msg })
                                                      })
                                                        .then(res => {
                                                          if (res.ok) {
                                                            setSuccessMsg("¡Actualización manual registrada con éxito!");
                                                            inputEl.value = "";
                                                            handleRefresh();
                                                          } else {
                                                            setErrorMsg("Error al registrar actualización");
                                                          }
                                                        });
                                                    }
                                                  }
                                                }}
                                              />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const inputEl = document.getElementById(`manual-deploy-msg-${project.id}`) as HTMLInputElement;
                                                  if (inputEl) {
                                                    const msg = inputEl.value.trim();
                                                    if (!msg) return;
                                                    fetch(`/api/portal/projects/${project.id}/deploys`, {
                                                      method: "POST",
                                                      headers: {
                                                        "Content-Type": "application/json",
                                                        Authorization: `Bearer ${token}`
                                                      },
                                                      body: JSON.stringify({ commitMessage: msg })
                                                    })
                                                      .then(res => {
                                                        if (res.ok) {
                                                          setSuccessMsg("¡Actualización manual registrada con éxito!");
                                                          inputEl.value = "";
                                                          handleRefresh();
                                                        } else {
                                                          setErrorMsg("Error al registrar actualización");
                                                        }
                                                      });
                                                  }
                                                }}
                                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                              >
                                                Publicar
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Danger Zone */}
                                      <div className="pt-5 border-t border-red-500/10 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-red-500/[0.02] -mx-6 -mb-6 p-6 rounded-b-[var(--radius-bento)]">
                                        <div>
                                          <h4 className="text-[10px] font-black uppercase tracking-wider text-red-400">Zona de Peligro</h4>
                                          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">Eliminación permanente del proyecto o de la cuenta de cliente.</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteProject(project.id);
                                            }}
                                            className="p-2 text-xs text-orange-400 hover:text-orange-300 bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/15 hover:border-orange-500/30 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                                            title="Remover Proyecto"
                                          >
                                            <Trash2 size={13} />
                                            <span>Eliminar Proyecto</span>
                                          </button>

                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteClient(project.clientUserId);
                                            }}
                                            className="p-2 text-xs text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 hover:border-red-500/30 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                                            title="Remover Cliente"
                                          >
                                            <Trash2 size={13} />
                                            <span>Eliminar Cuenta</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}

                        {/* Pagination Controls */}
                        {data.projects.length > itemsPerPage && (
                          <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-[var(--color-border-subtle)]/30">
                            <button
                              onClick={() => setProjectsPage(p => Math.max(1, p - 1))}
                              disabled={projectsPage === 1}
                              className="px-3 py-1.5 rounded-lg glass-panel border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-all cursor-pointer will-change-transform transition-all"
                            >
                              Anterior
                            </button>
                            <span className="text-xs text-[var(--color-text-tertiary)] font-medium">
                              Pág {projectsPage} de {Math.ceil(data.projects.length / itemsPerPage)}
                            </span>
                            <button
                              onClick={() => setProjectsPage(p => Math.min(Math.ceil(data.projects.length / itemsPerPage), p + 1))}
                              disabled={projectsPage === Math.ceil(data.projects.length / itemsPerPage)}
                              className="px-3 py-1.5 rounded-lg glass-panel border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-all cursor-pointer will-change-transform transition-all"
                            >
                              Siguiente
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Papelera de Reciclaje */}
                    {data.deletedProjects && data.deletedProjects.length > 0 && (
                      <div className="mt-12 pt-6 border-t border-[var(--color-border-subtle)]/30">
                        <div className="flex justify-between items-center pb-4 mb-4">
                          <h2 className="text-lg font-display font-bold flex items-center gap-2 text-[var(--color-text-secondary)]">
                            <Trash2 size={18} className="text-red-400" />
                            Papelera de Reciclaje ({data.deletedProjects.length})
                          </h2>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-text-tertiary)]">Se eliminan auto. en 30 días</p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                          {data.deletedProjects.map((project: any) => {
                            const clientUser = data.deletedClients?.find((u: any) => u.id === project.clientUserId);
                            return (
                              <div
                                key={project.id}
                                className="p-6 rounded-[var(--radius-bento)] glass-panel border border-red-500/20 space-y-4 opacity-70 hover:opacity-100 transition-all shadow-sm will-change-transform transition-all"
                              >
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-display font-black text-lg text-[var(--color-text-primary)]">
                                        {project.displayId ? `${project.displayId} - ` : ""}{project.name}
                                      </h3>
                                      <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] rounded border border-red-500/20 uppercase font-black tracking-widest">
                                        Eliminado
                                      </span>
                                    </div>
                                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                                      <strong>Contacto / Email:</strong> {clientUser?.name || 'Usuario Eliminado'} ({clientUser?.email || 'N/A'})
                                    </p>
                                  </div>
                                  <div className="text-right flex items-center gap-3">
                                    <button
                                      onClick={() => handleRestoreProject(project.id)}
                                      className="px-3 py-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg transition-all font-bold"
                                    >
                                      Restaurar Proyecto
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Client Project Overview */
                  <div className="space-y-8">
                    {!clientProject ? (
                      <div className="p-8 rounded-[var(--radius-bento)] glass-panel border border-dashed border-[var(--color-border-subtle)] text-center space-y-3">
                        <HelpCircle size={36} className="mx-auto text-[var(--color-text-tertiary)]" />
                        <h3 className="font-bold">No hay proyectos activos asignados</h3>
                        <p className="text-xs text-[var(--color-text-secondary)]">Su cuenta no posee iniciativas cargadas. Comuníquese con soporte.</p>
                      </div>
                    ) : (
                      <>
                        {/* Resumen IA */}
                        {(aiSummaryLoading || aiSummary) && (
                          <div className="p-5 rounded-[var(--radius-bento)] bg-[var(--color-primary-base)]/5 border border-[var(--color-primary-base)]/15 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-base)]/15 text-[var(--color-primary-base)] flex items-center justify-center shrink-0 mt-0.5">
                              <AISparkleIcon size={16} />
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary-base)] mb-1">
                                Resumen de tu proyecto
                              </p>
                              {aiSummaryLoading ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 border border-[var(--color-primary-base)] border-t-transparent rounded-full animate-spin" />
                                  <span className="text-xs text-[var(--color-text-tertiary)]">Generando resumen...</span>
                                </div>
                              ) : (
                                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{aiSummary}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Widget Próxima Acción */}
                        {(() => {
                          const pendingTasks = data.tasks.filter(t => t.status === "pending" && t.projectId === clientProject.id);
                          const pendingInvoices = data.invoices.filter(i => i.status === "pending" && i.projectId === clientProject.id);
                          const hasAction = pendingTasks.length > 0 || pendingInvoices.length > 0;

                          return (
                            <div className={`p-6 rounded-[var(--radius-bento)] border ${hasAction ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'} flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm`}>
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${hasAction ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                  {hasAction ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                                </div>
                                <div className="space-y-1">
                                  <h3 className="font-display font-bold text-lg text-[var(--color-text-primary)]">
                                    {hasAction ? "Tu Próxima Acción" : "Todo al día"}
                                  </h3>
                                  <p className="text-sm text-[var(--color-text-secondary)]">
                                    {pendingInvoices.length > 0 
                                      ? `Tienes ${pendingInvoices.length} factura(s) pendiente(s) de pago.`
                                      : pendingTasks.length > 0
                                      ? `Tienes ${pendingTasks.length} entregable(s) esperando tu revisión.`
                                      : "No tienes tareas pendientes por ahora. Nosotros seguimos trabajando en tu proyecto."}
                                  </p>
                                </div>
                              </div>
                              {hasAction && (
                                <button 
                                  onClick={() => setActiveTab(pendingInvoices.length > 0 ? "invoices" : "tasks")}
                                  className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg whitespace-nowrap transition-all ${pendingInvoices.length > 0 ? 'bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-amber-500/20' : 'bg-[var(--color-primary-base)] hover:opacity-90 text-white shadow-indigo-500/20'}`}
                                >
                                  {pendingInvoices.length > 0 ? "Ir a Pagar" : "Revisar Entregables"}
                                </button>
                              )}
                            </div>
                          );
                        })()}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Interactive Phase Map */}
                        <div className="lg:col-span-2 p-6 md:p-8 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] space-y-6 bento-glow">
                          <h2 className="text-lg md:text-xl font-display font-black flex items-center gap-2 border-b border-[var(--color-border-subtle)]/30 pb-4">
                            <TrendingUp size={18} className="text-indigo-400" />
                            Progreso del Desarrollo
                          </h2>

                          <div className="relative pt-4">
                            <div className="absolute top-8 left-4 -translate-x-1/2 w-[2px] h-[calc(100%-48px)] bg-[var(--color-border-subtle)]/60 z-0" />

                            <div className="space-y-6 relative z-10">
                              {clientProject.phases.map((phase: any, index: number) => {
                                const isCompleted = phase.status === "completed";
                                const isActive = phase.status === "active";
                                const isPending = phase.status === "pending";

                                return (
                                  <div key={phase.name} className="flex gap-4">
                                    <div className={`w-6 h-6 ml-1 mt-0.5 rounded-full flex items-center justify-center shrink-0 border-[3px] border-[var(--color-surface-elevated)] relative z-10 ${
                                      isCompleted
                                        ? "bg-emerald-500 text-white"
                                        : isActive
                                        ? "bg-[var(--color-primary-base)] text-white"
                                        : "bg-[var(--color-surface-highlight)] border border-[var(--color-border-strong)] text-[var(--color-text-tertiary)]"
                                    }`}>
                                      {isCompleted ? (
                                        <Check size={10} className="stroke-[3]" />
                                      ) : isActive ? (
                                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                      ) : (
                                        <span className="text-[9px] font-bold leading-none">{index + 1}</span>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <h3 className={`font-bold text-sm ${isActive ? "text-[var(--color-primary-base)]" : ""}`}>
                                        {phase.name}
                                      </h3>
                                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                                        {phase.detail}
                                      </p>
                                      {isActive && (
                                        <div className="mt-3 h-2 w-full max-w-xs bg-[var(--color-surface-highlight)] rounded-full overflow-hidden border border-[var(--color-border-subtle)]/30">
                                          <div className="h-full bg-gradient-to-r from-indigo-500 to-[var(--color-primary-base)] w-[65%] animate-pulse" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Staging Metrics or Live widgets right side */}
                        <div className="flex flex-col gap-6">
                          
                          {/* Alert Deliverable Pending widget */}
                          {data.tasks.some(t => t.status === "pending") ? (
                            <div className="p-6 rounded-[var(--radius-bento)] bg-[var(--color-primary-muted)]/10 border border-[var(--color-primary-base)] space-y-4 shadow-sm bento-glow relative overflow-hidden">
                              <div className="relative z-10 space-y-3">
                                <div className="w-10 h-10 bg-[var(--color-primary-base)] text-white rounded-xl flex items-center justify-center">
                                  <CheckCircle2 size={20} />
                                </div>
                                <h3 className="font-display font-bold text-base text-[var(--color-text-primary)]">
                                  Aprobación Pendiente
                                </h3>
                                <p className="text-xs text-[var(--color-text-secondary)]">
                                  Su equipo posee entregables listos para su revisión y autorización.
                                </p>
                                <button
                                  onClick={() => setActiveTab("tasks")}
                                  className="w-full py-2.5 bg-[var(--color-primary-base)] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                  <span>Revisar Entregables</span>
                                  <ExternalLink size={12} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-6 rounded-[var(--radius-bento)] bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                <Check size={16} />
                              </div>
                              <h3 className="font-bold text-sm text-[var(--color-text-primary)]">Dispositivos al Día</h3>
                              <p className="text-xs text-[var(--color-text-secondary)]">
                                No tienes acciones pendientes de revisión. El desarrollo está operando a máxima velocidad sin cuellos de botella.
                              </p>
                            </div>
                          )}

                          {/* Quick Invoicing / Budget box widget */}
                          <div className="p-6 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-tertiary)] flex justify-between items-center">
                              Facturación Reciente
                              <span className="text-[10px] font-bold lowercase">Fase Inicial</span>
                            </h3>

                            {data.invoices.length > 0 ? (
                              <div className="space-y-3">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-2xl font-display font-black text-[var(--color-text-primary)]">
                                    {formatMoney(data.invoices[0].amount)}
                                  </span>
                                  <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                                    data.invoices[0].status === "paid" 
                                      ? "bg-emerald-500/10 text-emerald-400" 
                                      : data.invoices[0].status === "void"
                                      ? "bg-red-500/10 text-red-400"
                                      : "bg-amber-500/10 text-amber-500"
                                  }`}>
                                    {data.invoices[0].status === "paid" ? "Pagada" : data.invoices[0].status === "void" ? "Invalidada" : "Pendiente"}
                                  </span>
                                </div>
                                <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
                                  <p><strong>Descripción:</strong> {data.invoices[0].description}</p>
                                  <p><strong>Factura:</strong> #{data.invoices[0].invoiceNumber}</p>
                                </div>
                                <button
                                  onClick={() => setActiveTab("invoices")}
                                  className="w-full py-2 bg-[var(--color-surface-highlight)] text-[var(--color-text-primary)] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-[var(--color-border-subtle)] transition"
                                >
                                  <Download size={13} /> Ver Detalle de Facturas
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-[var(--color-text-tertiary)]">Sin transacciones registradas.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 2: DELIVERABLES & APPROVALS (TAREAS Y ENTREGABLES)
                ---------------------------------------------------- */}
            {activeTab === "tasks" && (
              <div className="space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border-subtle)]/30">
                  <h2 className="text-lg font-display font-bold flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-indigo-400" />
                    Entregables por Responder y Aprobados
                  </h2>
                </div>

                {/* MANAGER ONLY: Form to create deliverables for approvals */}
                {isAdmin && (
                  <div className="rounded-[var(--radius-bento)] glass-panel border border-indigo-500/10 overflow-hidden">
                    {/* Botón de cabecera interactivo */}
                    <button
                      type="button"
                      ref={deliverableHeaderRef}
                      onClick={() => setDeliverableFormOpen(prev => !prev)}
                      className="w-full py-3 px-4 flex items-center justify-between gap-3 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer select-none text-left"
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <PlusCircle size={15} className="flex-shrink-0" />
                        <span className="truncate">Subir nuevo entregable para revisión</span>
                      </span>
                      <ChevronDown
                        size={15}
                        className={`text-[var(--color-text-tertiary)] flex-shrink-0 transition-transform duration-200 ${deliverableFormOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {deliverableFormOpen && (
                        <motion.form
                          onSubmit={handleCreateTask}
                          initial={{ height: 0, opacity: 0, overflow: "hidden" }}
                          animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }}
                          exit={{ height: 0, opacity: 0, overflow: "hidden" }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="px-4 pb-4 space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Proyecto Objetivo</label>
                              <CustomSelect
                                options={data.projects.map(p => ({
                                  id: p.id,
                                  label: `${p.displayId ? `${p.displayId} - ` : ""}${p.name}`
                                }))}
                                value={selectedProjectId}
                                onChange={(val) => setSelectedProjectId(val)}
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Título del Entregable</label>
                                <button
                                  type="button"
                                  disabled={!newTaskTitle || aiLoadingTaskTitle}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setAiLoadingTaskTitle(true);
                                    try {
                                      const text = await askAIFrontend({
                                        prompt: `Mejora este título de entregable para que sea corto, profesional y claro: '${newTaskTitle}'. Devuelve SOLO el título mejorado sin comillas ni texto adicional.`
                                      });
                                      setNewTaskTitle(text);
                                    } catch (e) {
                                      setErrorMsg("No se pudo generar con IA.");
                                    } finally {
                                      setAiLoadingTaskTitle(false);
                                    }
                                  }}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-primary-base)]/10 border border-[var(--color-primary-base)]/20 text-[var(--color-primary-base)] text-[10px] font-black hover:bg-[var(--color-primary-base)]/20 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  <AISparkleIcon size={14} className={aiLoadingTaskTitle ? "animate-spin" : ""} />
                                  Generar
                                </button>
                              </div>
                              <textarea
                                required
                                rows={1}
                                ref={(el) => {
                                  if (el) {
                                    el.style.height = 'auto';
                                    el.style.height = `${el.scrollHeight}px`;
                                  }
                                }}
                                placeholder="Ej: Mockups de Panel de Control Web"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none resize-none overflow-hidden"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">
                                  Descripción / Instrucciones
                                </label>
                                <button
                                  type="button"
                                  disabled={!newTaskTitle || aiLoadingTaskDesc}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setAiLoadingTaskDesc(true);
                                    try {
                                      const projectName = data?.projects.find(p => p.id === selectedProjectId)?.name || "";
                                      const text = await callAI("/api/ai/task-description", {
                                        taskTitle: newTaskTitle,
                                        projectName,
                                        draft: newTaskDesc,
                                      });
                                      setNewTaskDesc(text);
                                    } catch (e) {
                                      setErrorMsg("No se pudo generar con IA.");
                                    } finally {
                                      setAiLoadingTaskDesc(false);
                                    }
                                  }}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-primary-base)]/10 border border-[var(--color-primary-base)]/20 text-[var(--color-primary-base)] text-[10px] font-black hover:bg-[var(--color-primary-base)]/20 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  <AISparkleIcon size={14} className={aiLoadingTaskDesc ? "animate-spin" : ""} />
                                  Generar
                                </button>
                              </div>
                              <textarea
                                rows={1}
                                ref={(el) => {
                                  if (el) {
                                    el.style.height = 'auto';
                                    el.style.height = `${el.scrollHeight}px`;
                                  }
                                }}
                                placeholder="Breve reseña de qué revisar..."
                                value={newTaskDesc}
                                onChange={(e) => setNewTaskDesc(e.target.value)}
                                className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none resize-none overflow-hidden"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Enlace Externo (Opcional)</label>
                              <input
                                type="url"
                                placeholder="https://..."
                                value={newTaskLink}
                                onChange={(e) => setNewTaskLink(e.target.value)}
                                className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none min-w-0 appearance-none"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full px-6 py-3 mt-2 rounded-xl bg-[var(--color-primary-base)] text-white text-xs font-bold tracking-wider hover:opacity-95 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Send size={15} />
                            ENVIAR PARA APROBACIÓN
                          </button>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* List dynamic deliverables */}
                {(() => {
                  const firestoreArchivedIds = firestoreArchivedTasks.map((t) => t.id);
                  const activeTasks = data.tasks.filter((t) => !t.archived && !firestoreArchivedIds.includes(t.id));
                  
                  const clientProjectIds = data.projects.map((p) => p.id);
                  const archivedTasks = firestoreArchivedTasks.filter((t) => {
                    if (isAdmin) return true;
                    return clientProjectIds.includes(t.projectId);
                  });
                  
                  return (
                    <div className="space-y-6">
                      {activeTasks.length === 0 ? (
                        <div className="p-10 rounded-[var(--radius-bento)] glass-panel border border-dashed border-[var(--color-border-subtle)] text-center space-y-3 max-w-lg mx-auto my-4 shadow-sm animate-fade-in w-full">
                          <CheckCircle2 size={36} className="mx-auto text-indigo-400/80 animate-pulse" />
                          <h3 className="font-display font-medium text-sm text-[var(--color-text-primary)]">¡Todo en Orden!</h3>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {language === "es" 
                              ? "No hay entregables activos pendientes de revisión o aprobados en la vista principal."
                              : "There are no active deliverables pending review or approved on the main view."}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 animate-fade-in">
                          {activeTasks.slice((tasksPage - 1) * itemsPerPage, tasksPage * itemsPerPage).map((task) => {
                            const associatedProj = data.projects.find(p => p.id === task.projectId);
                            return (
                              <div
                                key={task.id}
                                className={`p-5 rounded-xl border flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all ${
                                  task.status === "approved"
                                    ? "bg-emerald-500/5 border-emerald-500/15"
                                    : task.status === "rejected"
                                    ? "bg-red-500/5 border-red-500/15"
                                    : "glass-panel border-[var(--color-border-subtle)]"
                                }`}
                              >
                                <div className="space-y-1 md:max-w-2xl">
                                  <div className="flex items-center gap-2 flex-wrap mb-2">
                                    {task.createdAt && (
                                      <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1 font-medium">
                                        <Clock size={10} />
                                        <span>Enviado: {new Date(task.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                      </span>
                                    )}
                                    {task.respondedAt && (
                                      <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1 font-medium">
                                        <Check size={10} />
                                        <span>Respondido: {new Date(task.respondedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-0.5 bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-[10px] font-medium text-[var(--color-text-secondary)] rounded-md">
                                      {associatedProj ? (associatedProj.displayId ? `${associatedProj.displayId} - ${associatedProj.name}` : associatedProj.name) : "Proyecto"}
                                    </span>
                                    
                                    {task.status === "approved" && (
                                      <span className="glass-badge text-[10px] uppercase font-bold tracking-wider text-emerald-400 px-2 py-0.5 rounded">
                                        ✔ Aprobado Oficialmente
                                      </span>
                                    )}
                                    {task.status === "rejected" && (
                                      <span className="text-[10px] uppercase font-bold tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                                        ❌ Observado (Requiere Cambios)
                                      </span>
                                    )}
                                    {task.status === "pending" && (
                                      <span className="glass-badge text-[10px] uppercase font-bold tracking-wider text-blue-400 px-2 py-0.5 rounded animate-pulse">
                                        ⏳ {isAdmin ? "Esperando Aprobación del Cliente" : "Esperando Tu Aprobación"}
                                      </span>
                                    )}
                                  </div>

                                  <p className="font-bold text-sm text-[var(--color-text-primary)] mt-1">{task.title}</p>
                                  <p className="text-xs text-[var(--color-text-secondary)]">{task.description}</p>
                                  
                                  {task.feedback && (
                                    <div className="mt-2 text-xs bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg text-red-300">
                                      <strong>Correcciones solicitadas:</strong> {task.feedback}
                                    </div>
                                  )}

                                  {task.link && (
                                    <a
                                      href={task.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-[var(--color-primary-base)] hover:underline pt-1.5"
                                    >
                                      <span>Ver entregable técnico</span>
                                      <ExternalLink size={12} />
                                    </a>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                                  {isAdmin ? (
                                    task.status !== "pending" ? (
                                      <button
                                        onClick={() => handleArchiveTask(task.id, true)}
                                        className="px-3 py-1.5 rounded-lg border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                        title={language === "es" ? "Archivar entregable para limpiar la pantalla" : "Archive deliverable to clean screen"}
                                      >
                                        <Archive size={14} />
                                        <span>{language === "es" ? "Archivar" : "Archive"}</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                                        title="Remover"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )
                                  ) : (
                                    task.status === "pending" ? (
                                      <div className="space-y-2 text-right w-full sm:w-auto">
                                        {feedbackTaskId === task.id ? (
                                          <div className="space-y-2">
                                            <textarea
                                              value={feedbackText}
                                              onChange={(e) => setFeedbackText(e.target.value)}
                                              placeholder="Agrega tus comentarios para realizar ajustes..."
                                              className="glass-input w-full min-w-[200px] p-2 rounded bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)]"
                                              rows={2}
                                            />
                                            <div className="flex gap-2 justify-end">
                                              <button
                                                onClick={() => setFeedbackTaskId(null)}
                                                className="px-2.5 py-1 text-[11px] font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                              >
                                                Cancelar
                                              </button>
                                              <button
                                                onClick={() => handleClientRespondTask(task.id, "rejected")}
                                                className="px-3 py-1 text-[11px] font-bold rounded bg-red-500 text-white hover:bg-red-600"
                                              >
                                                Confirmar Ajustes
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                                            <button
                                              onClick={() => setFeedbackTaskId(task.id)}
                                              className="px-3 py-1.5 text-xs font-bold border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg transition whitespace-nowrap"
                                            >
                                              Pedir Ajustes
                                            </button>
                                            <button
                                              onClick={() => handleClientRespondTask(task.id, "approved")}
                                              className="px-4 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition shadow-lg shadow-emerald-500/10 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                            >
                                              <Check size={12} className="stroke-[3]" />
                                              Aprobar
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleArchiveTask(task.id, true)}
                                        className="px-3 py-1.5 rounded-lg border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                        title={language === "es" ? "Archivar entregable para limpiar la pantalla" : "Archive deliverable to clean screen"}
                                      >
                                        <Archive size={14} />
                                        <span>{language === "es" ? "Archivar" : "Archive"}</span>
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Active tasks Pagination Controls */}
                          {activeTasks.length > itemsPerPage && (
                            <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-[var(--color-border-subtle)]/30">
                              <button
                                onClick={() => setTasksPage(p => Math.max(1, p - 1))}
                                disabled={tasksPage === 1}
                                className="px-3 py-1.5 rounded-lg glass-panel border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-all cursor-pointer will-change-transform transition-all"
                              >
                                Anterior
                              </button>
                              <span className="text-xs text-[var(--color-text-tertiary)] font-medium">
                                Pág {tasksPage} de {Math.ceil(activeTasks.length / itemsPerPage)}
                              </span>
                              <button
                                onClick={() => setTasksPage(p => Math.min(Math.ceil(activeTasks.length / itemsPerPage), p + 1))}
                                disabled={tasksPage === Math.ceil(activeTasks.length / itemsPerPage)}
                                className="px-3 py-1.5 rounded-lg glass-panel border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-all cursor-pointer will-change-transform transition-all"
                              >
                                Siguiente
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Section: Archived Deliverables Collapsible */}
                      {archivedTasks.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-[var(--color-border-subtle)]/30">
                          <button
                            type="button"
                            onClick={() => setShowArchivedTasks(!showArchivedTasks)}
                            className="flex items-center justify-between w-full py-3 px-4 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)]/60 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer select-none"
                          >
                            <span className="flex items-center gap-2">
                              <Archive size={15} className="text-indigo-400" />
                              <span>
                                {language === "es" 
                                  ? `Historial de Entregables Archivados (${archivedTasks.length})` 
                                  : `Archived Deliverables History (${archivedTasks.length})`}
                              </span>
                            </span>
                            <ChevronDown
                              size={16}
                              className={`text-[var(--color-text-tertiary)] transition-transform duration-200 ${showArchivedTasks ? "rotate-180" : ""}`}
                            />
                          </button>

                          <AnimatePresence>
                            {showArchivedTasks && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden mt-4 space-y-4"
                              >
                                <div className="grid grid-cols-1 gap-4">
                                  {archivedTasks.slice((archivedTasksPage - 1) * itemsPerPage, archivedTasksPage * itemsPerPage).map((task) => {
                                    const associatedProj = data.projects.find(p => p.id === task.projectId);
                                    return (
                                      <div
                                        key={task.id}
                                        className="p-5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-soft)]/40 flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all opacity-85 hover:opacity-100"
                                      >
                                        <div className="space-y-1 md:max-w-2xl">
                                          <div className="flex items-center gap-2 flex-wrap mb-2">
                                            {task.createdAt && (
                                              <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1 font-medium">
                                                <Clock size={10} />
                                                <span>Enviado: {new Date(task.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                              </span>
                                            )}
                                            {task.respondedAt && (
                                              <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1 font-medium">
                                                <Check size={10} />
                                                <span>Respondido: {new Date(task.respondedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                              </span>
                                            )}
                                            <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                              {language === "es" ? "Archivado" : "Archived"}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-2 py-0.5 bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-[10px] font-medium text-[var(--color-text-secondary)] rounded-md">
                                              {associatedProj ? (associatedProj.displayId ? `${associatedProj.displayId} - ${associatedProj.name}` : associatedProj.name) : "Proyecto"}
                                            </span>
                                            
                                            {task.status === "approved" && (
                                              <span className="glass-badge text-[10px] uppercase font-bold tracking-wider text-emerald-400 px-2 py-0.5 rounded">
                                                ✔ Aprobado Oficialmente
                                              </span>
                                            )}
                                            {task.status === "rejected" && (
                                              <span className="text-[10px] uppercase font-bold tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                                                ❌ Observado (Requiere Cambios)
                                              </span>
                                            )}
                                          </div>

                                          <p className="font-bold text-sm text-[var(--color-text-primary)] mt-1">{task.title}</p>
                                          <p className="text-xs text-[var(--color-text-secondary)]">{task.description}</p>
                                          
                                          {task.feedback && (
                                            <div className="mt-2 text-xs bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg text-red-300">
                                              <strong>Correcciones solicitadas:</strong> {task.feedback}
                                            </div>
                                          )}

                                          {task.link && (
                                            <a
                                              href={task.link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1 text-xs text-[var(--color-primary-base)] hover:underline pt-1.5"
                                            >
                                              <span>Ver entregable técnico</span>
                                              <ExternalLink size={12} />
                                            </a>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => handleArchiveTask(task.id, false)}
                                              className="px-3 py-1.5 rounded-lg border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                              title={language === "es" ? "Restaurar a activos" : "Restore to active list"}
                                            >
                                              <Inbox size={13} />
                                              <span>{language === "es" ? "Restaurar" : "Restore"}</span>
                                            </button>
                                            {isAdmin && (
                                              <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                                                title={language === "es" ? "Eliminar permanentemente" : "Delete permanently"}
                                              >
                                                <Trash2 size={14} />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Archived Pagination Controls */}
                                {archivedTasks.length > itemsPerPage && (
                                  <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t border-[var(--color-border-subtle)]/30">
                                    <button
                                      onClick={() => setArchivedTasksPage(p => Math.max(1, p - 1))}
                                      disabled={archivedTasksPage === 1}
                                      className="px-3 py-1.5 rounded-lg glass-panel border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-all cursor-pointer"
                                    >
                                      Anterior
                                    </button>
                                    <span className="text-xs text-[var(--color-text-tertiary)] font-medium">
                                      Pág {archivedTasksPage} de {Math.ceil(archivedTasks.length / itemsPerPage)}
                                    </span>
                                    <button
                                      onClick={() => setArchivedTasksPage(p => Math.min(Math.ceil(archivedTasks.length / itemsPerPage), p + 1))}
                                      disabled={archivedTasksPage === Math.ceil(archivedTasks.length / itemsPerPage)}
                                      className="px-3 py-1.5 rounded-lg glass-panel border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-all cursor-pointer"
                                    >
                                      Siguiente
                                    </button>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 3: INVOICING & PAYMENTS (FACTURACIÓN)
                ---------------------------------------------------- */}
            {activeTab === "invoices" && (
              <div className="space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border-subtle)]/30">
                  <h2 className="text-lg font-display font-bold flex items-center gap-2">
                    <FileText size={18} className="text-indigo-400" />
                    Estado de Cuentas y Facturación
                  </h2>
                </div>

                {/* MANAGER ONLY: Form to create invoices */}
                {isAdmin && (
                  <div className="rounded-[var(--radius-bento)] glass-panel border border-indigo-500/10 overflow-hidden">
                    {/* Botón de cabecera interactivo */}
                    <button
                      type="button"
                      ref={invoiceHeaderRef}
                      onClick={() => setInvoiceFormOpen(prev => !prev)}
                      className="w-full py-3 px-4 flex items-center justify-between gap-3 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer select-none text-left"
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <PlusCircle size={15} className="flex-shrink-0" />
                        <span className="truncate">Añadir registro de factura</span>
                      </span>
                      <ChevronDown
                        size={15}
                        className={`text-[var(--color-text-tertiary)] flex-shrink-0 transition-transform duration-200 ${invoiceFormOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {invoiceFormOpen && (
                        <motion.form
                          onSubmit={handleCreateInvoice}
                          initial={{ height: 0, opacity: 0, overflow: "hidden" }}
                          animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }}
                          exit={{ height: 0, opacity: 0, overflow: "hidden" }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="px-4 pb-4 space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Proyecto Relacionado</label>
                              <CustomSelect
                                options={data.projects.map(p => ({
                                  id: p.id,
                                  label: `${p.displayId ? `${p.displayId} - ` : ""}${p.name}`
                                }))}
                                value={selectedProjectId}
                                onChange={(val) => setSelectedProjectId(val)}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">
                                Número de Factura
                              </label>
                              <div className="px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)]/50 border-dashed flex flex-nowrap items-center gap-1.5 overflow-hidden">
                                <span className="text-xs font-semibold text-[var(--color-primary-base)] whitespace-nowrap">
                                  POL-{new Date().getFullYear()}-###
                                </span>
                                <span className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                                  — generado automáticamente
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Equivalente (DOP)</label>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={dopExchangeRate}
                                    onChange={(e) => setDopExchangeRate(e.target.value)}
                                    className="w-14 px-1.5 py-0.5 rounded bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[10px] text-center focus:outline-none"
                                    title="Tasa de cambio"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleFetchDopRate}
                                    disabled={loadingDopRate}
                                    className="p-1 rounded bg-[var(--color-primary-base)]/10 text-[var(--color-primary-base)] hover:bg-[var(--color-primary-base)]/20 transition cursor-pointer"
                                    title="Actualizar con Google Finance"
                                  >
                                    <RefreshCw size={10} className={loadingDopRate ? "animate-spin" : ""} />
                                  </button>
                                </div>
                              </div>
                              <div className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)]/50 border-dashed text-xs text-[var(--color-text-tertiary)] flex items-center">
                                {newInvoiceTotal > 0 && !isNaN(parseFloat(dopExchangeRate))
                                  ? `RD$ ${(newInvoiceTotal * parseFloat(dopExchangeRate)).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : "RD$ 0.00"}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">
                              Productos / Conceptos
                            </label>
                            <div className="space-y-2">
                              {newInvoiceItems.map((item, idx) => {
                                const subtotal = (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0);
                                return (
                                  <div key={idx} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                    <input
                                      type="text"
                                      placeholder="Ej: Addon de reservas online"
                                      value={item.description}
                                      onChange={(e) => {
                                        const next = [...newInvoiceItems];
                                        next[idx] = { ...next[idx], description: e.target.value };
                                        setNewInvoiceItems(next);
                                      }}
                                      className="glass-input flex-1 min-w-0 px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      disabled={!item.description.trim() || aiLoadingItemIndex === idx}
                                      onClick={async () => {
                                        setAiLoadingItemIndex(idx);
                                        try {
                                          const text = await callAI("/api/ai/invoice-description", {
                                            draft: item.description,
                                          });
                                          const next = [...newInvoiceItems];
                                          next[idx] = { ...next[idx], description: text };
                                          setNewInvoiceItems(next);
                                        } catch (e) {
                                          setErrorMsg("No se pudo generar con IA.");
                                        } finally {
                                          setAiLoadingItemIndex(null);
                                        }
                                      }}
                                      className="shrink-0 flex items-center justify-center p-2.5 rounded-lg bg-[var(--color-primary-base)]/10 border border-[var(--color-primary-base)]/20 text-[var(--color-primary-base)] hover:bg-[var(--color-primary-base)]/20 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                      title="Pulir con IA"
                                    >
                                      <AISparkleIcon size={14} className={aiLoadingItemIndex === idx ? "animate-spin" : ""} />
                                    </button>
                                    <input
                                      type="number"
                                      placeholder="Precio"
                                      value={item.price}
                                      onChange={(e) => {
                                        const next = [...newInvoiceItems];
                                        next[idx] = { ...next[idx], price: e.target.value };
                                        setNewInvoiceItems(next);
                                      }}
                                      className="glass-input w-full sm:w-24 shrink-0 px-3 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none appearance-none"
                                    />
                                    <input
                                      type="number"
                                      placeholder="Cant."
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const next = [...newInvoiceItems];
                                        next[idx] = { ...next[idx], quantity: e.target.value };
                                        setNewInvoiceItems(next);
                                      }}
                                      className="glass-input w-full sm:w-16 shrink-0 px-3 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none appearance-none"
                                    />
                                    <div className="w-full sm:w-24 shrink-0 px-3 py-2.5 text-xs font-bold text-[var(--color-text-primary)] text-right">
                                      ${subtotal.toFixed(2)}
                                    </div>
                                    <button
                                      type="button"
                                      disabled={newInvoiceItems.length === 1}
                                      onClick={() => setNewInvoiceItems(newInvoiceItems.filter((_, i) => i !== idx))}
                                      className="shrink-0 p-2.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-red-500 hover:bg-red-500/10 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                      title="Quitar producto"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewInvoiceItems([...newInvoiceItems, { description: "", price: "", quantity: "1" }])}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] text-[10px] font-black hover:bg-[var(--color-primary-base)]/10 hover:text-[var(--color-primary-base)] transition cursor-pointer"
                            >
                              <Plus size={12} />
                              Agregar producto
                            </button>
                            <div className="text-right text-xs font-bold text-[var(--color-text-primary)] pt-1">
                              Total: ${newInvoiceTotal.toFixed(2)}
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={newInvoiceTotal <= 0}
                            className="px-6 py-2.5 rounded-xl bg-[var(--color-primary-base)] text-white text-xs font-bold tracking-wider float-right hover:opacity-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Receipt size={14} />
                            EMITIR FACTURA
                          </button>
                          <div className="clear-both" />
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Invoices List */}
                {(() => {
                  const filteredInvoices = (selectedInvoiceFilterProject === "all"
                    ? data.invoices
                    : data.invoices.filter((inv) => inv.projectId === selectedInvoiceFilterProject));

                  return (
                    <>
                      {data.projects.length > 0 && (
                        <div className="mb-4 space-y-1 w-full max-w-sm relative z-[10]">
                          <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)] ml-1">Filtrar por proyecto</label>
                          <CustomSelect
                            value={selectedInvoiceFilterProject}
                            onChange={(val) => {
                              setSelectedInvoiceFilterProject(val);
                              setInvoicesPage(1);
                            }}
                            options={[
                              { id: "all", label: "Todos los proyectos" },
                              ...data.projects
                                .slice()
                                .sort((a, b) => (a.displayId || "").localeCompare(b.displayId || ""))
                                .map(p => ({
                                  id: p.id,
                                  label: p.displayId ? `${p.displayId} - ${p.name}` : p.name
                                }))
                            ]}
                            className="rounded-[var(--radius-bento)] glass-panel border border-indigo-500/10 z-10"
                            buttonClassName="w-full py-3 px-4 flex items-center justify-between gap-3 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer select-none text-left rounded-[var(--radius-bento)]"
                          />
                        </div>
                      )}

                      {filteredInvoices.length === 0 ? (
                  <div className="p-10 rounded-[var(--radius-bento)] glass-panel border border-dashed border-[var(--color-border-subtle)] text-center space-y-3 max-w-lg mx-auto my-4 shadow-sm">
                    <DollarSign size={36} className="mx-auto text-indigo-400/80 animate-pulse" />
                    <h3 className="font-display font-medium text-sm text-[var(--color-text-primary)]">Sin Transacciones Pendientes</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      No se han emitido facturas de cobro ni transacciones para sus desarrollos activos en este periodo.
                    </p>
                  </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {filteredInvoices.slice((invoicesPage - 1) * itemsPerPage, invoicesPage * itemsPerPage).map((inv) => {
                      const project = data.projects.find(p => p.id === inv.projectId);
                      return (
                        <div
                          key={inv.id}
                          className={`p-5 rounded-xl glass-panel border border-[var(--color-border-subtle)] flex flex-col gap-4 hover:border-indigo-500/10 transition-all will-change-transform ${
                            openInvoiceStatusDropdown === inv.id ? "relative z-30" : "relative z-10"
                          }`}
                        >
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {inv.invoiceNumber}
                              </span>
                              <CopyInvoiceButton text={inv.invoiceNumber} />
                            </div>
                            <div className="text-[11px] text-[var(--color-text-secondary)] font-bold leading-relaxed">
                              {project ? (project.displayId ? `${project.displayId} - ${project.name}` : project.name) : "Proyecto"}
                            </div>
                            {inv.description && (
                              <p className="text-xs text-[var(--color-text-tertiary)] font-medium mt-0.5">{inv.description}</p>
                            )}
                            <p className="text-[10px] text-[var(--color-text-tertiary)]">
                              Fecha de Emisión: <strong>{inv.date}</strong> | Expiración: <strong>{inv.dueDate}</strong>
                            </p>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4 text-left md:text-right w-full md:w-auto shrink-0 mt-2 md:mt-0">
                            <div className="flex flex-col items-start md:items-end">
                              <p className="text-lg font-display font-black text-[var(--color-text-primary)]">{formatMoney(inv.amount)}</p>
                              
                              {isAdmin ? (
                                <div className="relative mt-1">
                                  <button
                                    onClick={() => setOpenInvoiceStatusDropdown(openInvoiceStatusDropdown === inv.id ? null : inv.id)}
                                    className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded cursor-pointer appearance-none outline-none inline-flex items-center gap-1 w-fit ${
                                      inv.status === "paid"
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : inv.status === "void"
                                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                        : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                    }`}
                                  >
                                    {inv.status === "paid" ? "Pagada" : inv.status === "void" ? "Invalidada" : "Pendiente"}
                                    <ChevronDown size={10} />
                                  </button>
                                  
                                  <AnimatePresence>
                                    {openInvoiceStatusDropdown === inv.id && (
                                      <motion.ul
                                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute z-[100] mt-1 py-1 w-max min-w-36 left-0 md:left-auto md:right-0 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] shadow-xl backdrop-blur-md focus:outline-none"
                                      >
                                        <li>
                                          <button
                                            onClick={() => {
                                              handleUpdateInvoiceStatus(inv.id, "pending");
                                              setOpenInvoiceStatusDropdown(null);
                                            }}
                                            className="w-full whitespace-nowrap text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 transition-colors"
                                          >Pendiente</button>
                                        </li>
                                        <li>
                                          <button
                                            onClick={() => {
                                              handleUpdateInvoiceStatus(inv.id, "paid");
                                              setOpenInvoiceStatusDropdown(null);
                                            }}
                                            className="w-full whitespace-nowrap text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                          >Pagada</button>
                                        </li>
                                        <li>
                                          <button
                                            onClick={() => {
                                              setOpenInvoiceStatusDropdown(null);
                                              const willRefund = inv.status === "paid" && !!inv.paypalCaptureId;
                                              const wasManuallyPaid = inv.status === "paid" && !inv.paypalCaptureId;
                                              setConfirmDialog({
                                                isOpen: true,
                                                title: "Invalidar Factura",
                                                message: willRefund
                                                  ? `Esta factura fue pagada de verdad con PayPal. Al invalidarla se reembolsarán ${formatMoney(inv.amount)} al cliente automáticamente vía PayPal. Esta acción no se puede deshacer.`
                                                  : wasManuallyPaid
                                                  ? "Esta factura se marcó como pagada manualmente (no por PayPal), así que invalidarla NO generará ningún reembolso automático. Esta acción no se puede deshacer."
                                                  : "¿Está seguro de que desea invalidar esta factura? Esta acción no se puede deshacer.",
                                                confirmText: willRefund ? "Invalidar y Reembolsar" : "Invalidar Factura",
                                                cancelText: "Cancelar",
                                                isDanger: true,
                                                onConfirm: () => {
                                                  handleUpdateInvoiceStatus(inv.id, "void");
                                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                                }
                                              });
                                            }}
                                            className="w-full whitespace-nowrap text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors"
                                          >Invalidada</button>
                                        </li>
                                      </motion.ul>
                                    )}
                                  </AnimatePresence>
                                </div>
                              ) : (
                                <span className={`inline-block text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded w-fit ${
                                  inv.status === "paid"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : inv.status === "void"
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                }`}>
                                  {inv.status === "paid" ? "Pagada" : inv.status === "void" ? "Invalidada" : "Pendiente"}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                            {isAdmin ? (
                              <>
                                <button
                                  onClick={() => printInvoice(inv)}
                                  disabled={pdfGeneratingId === inv.id}
                                  className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)] hover:bg-[var(--color-primary-base)]/10 rounded transition disabled:opacity-60"
                                  title="Descargar PDF"
                                >
                                  {pdfGeneratingId === inv.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : pdfSuccessId === inv.id ? (
                                    <Check size={14} className="text-emerald-500" />
                                  ) : (
                                    <Download size={14} />
                                  )}
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => printInvoice(inv)}
                                  disabled={pdfGeneratingId === inv.id}
                                  className="p-1.5 mr-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)] hover:bg-[var(--color-primary-base)]/10 rounded transition tracking-widest disabled:opacity-60"
                                  title="Descargar PDF"
                                >
                                  {pdfGeneratingId === inv.id ? (
                                    <Loader2 size={18} className="animate-spin" />
                                  ) : pdfSuccessId === inv.id ? (
                                    <Check size={18} className="text-emerald-500" />
                                  ) : (
                                    <Download size={18} />
                                  )}
                                </button>
                                {inv.status === "pending" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setErrorMsg(null);
                                      setPaymentSuccess(false);
                                      setPayingInvoice(inv);
                                    }}
                                    className="p-2 bg-[var(--color-primary-base)] text-white text-xs font-bold rounded-xl flex items-center gap-1 hover:opacity-90 transition cursor-pointer"
                                  >
                                    <span>Pagar</span>
                                    <ExternalLink size={10} />
                                  </button>
                                )}
                              </>
                            )}
                            </div>
                          </div>
                          </div>

                          {inv.status === "void" && inv.paypalRefundId && (
                            <div className="pt-3 border-t border-[var(--color-border-subtle)]/50">
                              <button
                                type="button"
                                onClick={() => setOpenRefundDetails(openRefundDetails === inv.id ? null : inv.id)}
                                className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400/80 hover:text-emerald-400 transition-colors"
                              >
                                <Receipt size={12} />
                                Ver detalles del reembolso
                                <ChevronDown size={10} className={`transition-transform ${openRefundDetails === inv.id ? "rotate-180" : ""}`} />
                              </button>
                              <AnimatePresence>
                                {openRefundDetails === inv.id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-[var(--color-text-secondary)] space-y-1">
                                      <p><strong className="text-[var(--color-text-primary)]">Monto reembolsado:</strong> {formatMoney(inv.amount)}</p>
                                      {inv.refundedAt && (
                                        <p><strong className="text-[var(--color-text-primary)]">Fecha:</strong> {new Date(inv.refundedAt).toLocaleString("es-DO")}</p>
                                      )}
                                      <p><strong className="text-[var(--color-text-primary)]">Referencia de PayPal:</strong> {inv.paypalRefundId}</p>
                                      <p className="text-[var(--color-text-tertiary)] pt-1">El reembolso ya fue procesado por PayPal. Puede tardar unos días en reflejarse en tu cuenta o tarjeta.</p>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          {inv.status === "void" && inv.voidedAfterManualPayment && !isAdmin && (
                            <div className="pt-3 border-t border-[var(--color-border-subtle)]/50">
                              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-2">
                                <p className="text-xs text-[var(--color-text-secondary)]">
                                  Esta factura fue invalidada. Si ya realizaste un pago por transferencia o efectivo, contáctanos para resolverlo:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <a
                                    href={`https://wa.me/18299200544?text=${encodeURIComponent(`Hola, tengo una duda sobre la factura ${inv.invoiceNumber} que aparece invalidada.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 text-[11px] font-bold hover:bg-[#25D366]/20 transition-colors"
                                  >
                                    <MessageCircle size={12} />
                                    WhatsApp
                                  </a>
                                  <a
                                    href={`mailto:hola@polarisweb.studio?subject=${encodeURIComponent(`Factura ${inv.invoiceNumber} invalidada`)}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-bold hover:bg-indigo-500/20 transition-colors"
                                  >
                                    <Mail size={12} />
                                    Correo
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Pagination Controls */}
                    {filteredInvoices.length > itemsPerPage && (
                      <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-[var(--color-border-subtle)]/30">
                        <button
                          onClick={() => setInvoicesPage(p => Math.max(1, p - 1))}
                          disabled={invoicesPage === 1}
                          className="px-3 py-1.5 rounded-lg glass-panel border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-all cursor-pointer will-change-transform transition-all"
                        >
                          Anterior
                        </button>
                        <span className="text-xs text-[var(--color-text-tertiary)] font-medium">
                          Pág {invoicesPage} de {Math.ceil(filteredInvoices.length / itemsPerPage)}
                        </span>
                        <button
                          onClick={() => setInvoicesPage(p => Math.min(Math.ceil(filteredInvoices.length / itemsPerPage), p + 1))}
                          disabled={invoicesPage === Math.ceil(filteredInvoices.length / itemsPerPage)}
                          className="px-3 py-1.5 rounded-lg glass-panel border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-all cursor-pointer will-change-transform transition-all"
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </div>
                )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 4: MEETINGS (REUNIONES)
                ---------------------------------------------------- */}
            {activeTab === "meetings" && (
              <div className="space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border-subtle)]/30">
                  <h2 className="text-lg font-display font-bold flex items-center gap-2">
                    <Calendar size={18} className="text-indigo-400" />
                    Agenda de Reuniones
                  </h2>
                </div>

                {/* MANAGER ONLY: Form to schedule meetings */}
                {isAdmin && (
                  <div className={`rounded-[var(--radius-bento)] glass-panel border border-indigo-500/10 transition-all ${meetingFormOpen ? "relative z-20" : "relative z-10"}`}>
                    <button
                      type="button"
                      ref={meetingHeaderRef}
                      onClick={() => setMeetingFormOpen(prev => !prev)}
                      className="w-full py-3 px-4 flex items-center justify-between gap-3 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer select-none text-left"
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <PlusCircle size={15} className="flex-shrink-0" />
                        <span className="truncate">Agendar videollamada técnica</span>
                      </span>
                      <ChevronDown
                        size={15}
                        className={`text-[var(--color-text-tertiary)] flex-shrink-0 transition-transform duration-200 ${meetingFormOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {meetingFormOpen && (
                        <motion.form
                          onSubmit={(e) => {
                             handleCreateMeeting(e);
                             setMeetingFormOpen(false);
                          }}
                          initial={{ height: 0, opacity: 0, overflow: "hidden" }}
                          animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }}
                          exit={{ height: 0, opacity: 0, overflow: "hidden" }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="px-4 pb-4 space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Proyecto</label>
                        <CustomSelect
                          options={data.projects.map(p => ({
                            id: p.id,
                            label: `${p.displayId ? `${p.displayId} - ` : ""}${p.name}`
                          }))}
                          value={selectedProjectId}
                          onChange={(val) => setSelectedProjectId(val)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Título</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Revisión de proyecto"
                          value={newMeetTitle}
                          onChange={(e) => setNewMeetTitle(e.target.value)}
                          className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none min-w-0 appearance-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Fecha</label>
                        <CustomDatePicker value={newMeetDate} onChange={(val) => setNewMeetDate(val)} placeholder="Ej: 8/7/2026" />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Hora</label>
                        
                      {(() => {
                        const timeOptions = [];
                        const formatLabel = (h: number, m: string) => {
                          const ampm = h >= 12 ? "PM" : "AM";
                          const displayHour = h % 12 === 0 ? 12 : h % 12;
                          return `${displayHour}:${m} ${ampm}`;
                        };
                        for (let i = 8; i <= 20; i++) {
                          const hStr = String(i).padStart(2, '0');
                          timeOptions.push({ id: `${hStr}:00`, label: formatLabel(i, "00") });
                          timeOptions.push({ id: `${hStr}:30`, label: formatLabel(i, "30") });
                        }
                        return (
                          <CustomSelect
                            options={timeOptions}
                            value={newMeetTime}
                            onChange={(val) => setNewMeetTime(val)}
                            placeholder="Ej: 2:00 PM"
                          />
                        );
                      })()}

                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Enlace Google Meet</label>
                      <input
                        type="url"
                        placeholder="https://meet.google.com/..."
                        value={newMeetLink}
                        onChange={(e) => setNewMeetLink(e.target.value)}
                        className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none min-w-0 appearance-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[var(--color-primary-base)] text-white text-xs font-bold tracking-wider float-right hover:opacity-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <Calendar size={12} />
                      CREAR EVENTO
                    </button>
                    <div className="clear-both" />
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Meetings List */}
                {data.meetings.length === 0 ? (
                  <div className="p-10 rounded-[var(--radius-bento)] glass-panel border border-dashed border-[var(--color-border-subtle)] text-center space-y-3 max-w-lg mx-auto my-4 shadow-sm">
                    <Calendar size={36} className="mx-auto text-indigo-400/80 animate-pulse" />
                    <h3 className="font-display font-medium text-sm text-[var(--color-text-primary)]">Calendario Despejado</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      No tiene sincronizaciones programadas. Las reuniones del equipo técnico se agendarán y reflejarán aquí.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {data.meetings.slice((meetingsPage - 1) * itemsPerPage, meetingsPage * itemsPerPage).map((meet) => {
                        const isPast = isMeetingPast(meet);
                        return (
                        <div
                          key={meet.id}
                          className={`p-5 rounded-xl glass-panel border border-[var(--color-border-subtle)] flex flex-col justify-between space-y-4 hover:border-indigo-500/10 transition-all shadow-sm will-change-transform transition-all ${isPast ? "opacity-60" : ""}`}
                        >
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded ${
                                isPast
                                  ? "text-[var(--color-text-tertiary)] bg-[var(--color-surface-highlight)]"
                                  : "text-[var(--color-primary-base)] bg-[var(--color-primary-base)]/10"
                              }`}>
                                {isPast ? "Reunión Pasada" : "Upcoming Sync"}
                              </span>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteMeeting(meet.id)}
                                  className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                            <h3 className="font-bold text-sm text-[var(--color-text-primary)] pt-1">{meet.title}</h3>
                            <div className="space-y-1 pt-1 text-xs text-[var(--color-text-secondary)]">
                              <p className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-[var(--color-text-secondary)]" />
                                {meet.date} a las {formatTimeTo12h(meet.time)}
                              </p>
                            </div>
                          </div>

                          <a
                            href={meet.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-full py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                              isPast
                                ? "bg-[var(--color-surface-highlight)] border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                                : "bg-orange-600/15 border-orange-500/20 text-orange-400 hover:bg-orange-600/25 hover:text-orange-300"
                            }`}
                          >
                            <CheckCircle2 size={13} />
                            Acceder a Google Meet
                          </a>
                        </div>
                        );
                      })}
                    </div>

                    {/* Pagination Controls */}
                    {data.meetings.length > itemsPerPage && (
                      <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-[var(--color-border-subtle)]/30">
                        <button
                          onClick={() => setMeetingsPage(p => Math.max(1, p - 1))}
                          disabled={meetingsPage === 1}
                          className="px-3 py-1.5 rounded-lg glass-panel border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-all cursor-pointer animate-fade-in will-change-transform transition-all"
                        >
                          Anterior
                        </button>
                        <span className="text-xs text-[var(--color-text-tertiary)] font-medium">
                          Pág {meetingsPage} de {Math.ceil(data.meetings.length / itemsPerPage)}
                        </span>
                        <button
                          onClick={() => setMeetingsPage(p => Math.min(Math.ceil(data.meetings.length / itemsPerPage), p + 1))}
                          disabled={meetingsPage === Math.ceil(data.meetings.length / itemsPerPage)}
                          className="px-3 py-1.5 rounded-lg glass-panel border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-all cursor-pointer animate-fade-in will-change-transform transition-all"
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------
                TAB: UPDATES (ACTUALIZACIONES EN VIVO)
                ---------------------------------------------------- */}
            {activeTab === "updates" && (
              <div className="space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border-subtle)]/30">
                  <h2 className="text-lg font-display font-bold flex items-center gap-2">
                    <RefreshCw size={18} className="text-emerald-400 animate-spin-slow" />
                    Actualizaciones en Vivo (Historial de Deploys)
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* URL en vivo del sitio */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] space-y-4">
                      <h3 className="font-bold text-sm tracking-wide text-zinc-300">SITIO EN PRODUCCIÓN</h3>
                      {data?.projects?.[0]?.vercelUrl ? (
                        <div className="space-y-3">
                          <p className="text-xs text-zinc-400">Tu proyecto tiene una dirección activa e integrada con nuestro servidor de compilación continua.</p>
                          <a 
                            href={data.projects[0].vercelUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-all w-full justify-center"
                          >
                            <ExternalLink size={14} />
                            Ver Sitio Web
                          </a>
                          <p className="text-[10px] text-zinc-500 break-all text-center font-medium">{data.projects[0].vercelUrl}</p>
                        </div>
                      ) : (
                        <div className="text-zinc-500 text-xs py-4 text-center">
                          Aún no hay URL de producción vinculada. Nuestro equipo está preparando tu entorno de despliegue.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Historial de deploys */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">
                        <T en="Update history">Historial de actualizaciones</T>
                      </p>
                      <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <T en="Live">En vivo</T>
                      </span>
                    </div>

                    {deploys.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border border-dashed border-[var(--color-border-subtle)]">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-surface-highlight)] flex items-center justify-center">
                          <RefreshCw size={16} className="text-[var(--color-text-tertiary)]" />
                        </div>
                        <p className="text-sm font-bold text-[var(--color-text-secondary)]">
                          <T en="No updates yet">Sin actualizaciones aún</T>
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)] text-center max-w-xs leading-relaxed">
                          <T en="Updates will appear here automatically after each deployment.">
                            Las actualizaciones aparecerán aquí automáticamente después de cada despliegue.
                          </T>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {deploys.map((dep, idx) => (
                          <div
                            key={dep.id}
                            className="group relative p-4 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)] transition-all duration-200"
                          >
                            {/* Línea de tiempo vertical */}
                            {idx < deploys.length - 1 && (
                              <div className="absolute left-[27px] top-full h-3 w-px bg-[var(--color-border-subtle)]" />
                            )}

                            <div className="flex items-start gap-3">
                              {/* Indicador de estado */}
                              <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                dep.state === 'ready'
                                  ? 'bg-emerald-500/15 border border-emerald-500/30'
                                  : dep.state === 'building'
                                  ? 'bg-amber-500/15 border border-amber-500/30'
                                  : 'bg-red-500/15 border border-red-500/30'
                              }`}>
                                <span className={`w-2 h-2 rounded-full ${
                                  dep.state === 'ready'
                                    ? 'bg-emerald-400'
                                    : dep.state === 'building'
                                    ? 'bg-amber-400 animate-pulse'
                                    : 'bg-red-400'
                                }`} />
                              </div>

                              {/* Contenido */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug mb-1">
                                  {language === "es"
                                    ? (dep.commitMessageEs || dep.commitMessageES || dep.commitMessage)
                                    : dep.commitMessage}
                                </p>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    dep.state === 'ready'
                                      ? 'bg-emerald-500/10 text-emerald-400'
                                      : dep.state === 'building'
                                      ? 'bg-amber-500/10 text-amber-400'
                                      : 'bg-red-500/10 text-red-400'
                                  }`}>
                                    {dep.state === 'ready'
                                      ? (language === 'es' ? 'Publicado' : 'Published')
                                      : dep.state === 'building'
                                      ? (language === 'es' ? 'Compilando' : 'Building')
                                      : (language === 'es' ? 'Error' : 'Error')}
                                  </span>
                                  <span className="text-[10px] text-[var(--color-text-tertiary)]">
                                    {new Date(dep.createdAt).toLocaleDateString(
                                      language === 'es' ? 'es-DO' : 'en-US',
                                      { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Botón ver sitio */}
                              {dep.state === 'ready' && dep.url && (
                                <a
                                  href={dep.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-[10px] font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)] hover:border-[var(--color-primary-base)]/40 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <ExternalLink size={11} />
                                  <T en="View">Ver</T>
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 5: REGISTER CLIENTS (ADMIN ONLY - REGISTRAR CLIENTES)
                ---------------------------------------------------- */}
            {activeTab === "admin-clients" && isAdmin && (
              <div className="space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border-subtle)]/30">
                  <h2 className="text-lg font-display font-bold flex items-center gap-2">
                    <UserPlus size={18} className="text-indigo-400" />
                    Registrar Cuenta de Cliente y Proyecto Core
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Register Form Column */}
                  <div className="lg:col-span-2 p-6 md:p-8 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] space-y-6">
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      Completa este formulario oficial de iniciación. Al guardarlo, se crea la cuenta del cliente y una plantilla de proyecto, la cual incluye su fase inicial al 25%, una factura de fase inicial y su primer entregable de validación para firmar de forma interactiva.
                    </p>

                    <form onSubmit={handleCreateClient} className="space-y-4">
                      {/* Section A: Contact Credentials */}
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 pb-1.5 border-b border-[var(--color-border-subtle)]/30 mb-3">
                          1. Credenciales de la Cuenta del Cliente
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Nombre Completo del Contacto</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej: Sofía Martínez"
                              value={newClientName}
                              onChange={(e) => setNewClientName(e.target.value)}
                              className="glass-input w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Correo de Log-in</label>
                            <input
                              type="email"
                              required
                              placeholder="Ej: sofia@empresa.com"
                              value={newClientEmail}
                              onChange={(e) => setNewClientEmail(e.target.value)}
                              className="glass-input w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Contraseña Inicial</label>
                              <button
                                type="button"
                                onClick={generatePassword}
                                className="flex items-center gap-1.5 px-2 py-1 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[10px] font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-tertiary)] transition-all cursor-pointer"
                              >
                                <RefreshCw size={10} />
                                Generar Segura
                              </button>
                            </div>
                            <div className="relative">
                              <input
                                type={showRegPassword ? "text" : "password"}
                                required
                                placeholder="Ej: ••••••••"
                                value={newClientPassword}
                                onChange={(e) => setNewClientPassword(e.target.value)}
                                className="glass-input w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => setShowRegPassword(!showRegPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer"
                                title={showRegPassword ? "Ocultar Contraseña" : "Mostrar Contraseña"}
                              >
                                {showRegPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section B: Project Specifications */}
                      <div className="pt-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 pb-1.5 border-b border-[var(--color-border-subtle)]/30 mb-3">
                          2. Especificaciones Corporativas y de Iniciativa
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Nombre de la Empresa</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej: Acme Corp"
                              value={newClientCompany}
                              onChange={(e) => setNewClientCompany(e.target.value)}
                              className="glass-input w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Título Comercial de la Iniciativa</label>
                              <span className="text-[9px] font-bold text-[var(--color-primary-base)] bg-[var(--color-primary-base)]/10 px-1.5 py-0.5 rounded">ID: {nextProjectDisplayId}</span>
                            </div>
                            <div className="flex bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden focus-within:border-[var(--color-primary-base)] transition-colors">
                              <div className="pl-3.5 pr-2 py-2.5 bg-black/5 dark:bg-white/5 text-xs font-bold text-[var(--color-text-secondary)] flex items-center shrink-0 border-r border-[var(--color-border-subtle)]/50">
                                {nextProjectDisplayId} -
                              </div>
                              <input
                                type="text"
                                required
                                placeholder="Ej: Acme Portal SaaS"
                                value={newClientProjectName}
                                onChange={(e) => setNewClientProjectName(e.target.value)}
                                className="glass-input w-full px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-1">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">
                              Descripción del Proyecto
                            </label>
                            <button
                              type="button"
                              disabled={!newClientProjectName || !newClientCompany || !newClientProjectDesc || aiLoadingProjectDesc}
                              onClick={async () => {
                                setAiLoadingProjectDesc(true);
                                try {
                                  const text = await callAI("/api/ai/project-description", {
                                    projectName: newClientProjectName,
                                    companyName: newClientCompany,
                                    briefDescription: newClientProjectDesc
                                  });
                                  setNewClientProjectDesc(text);
                                } catch (e) {
                                  setErrorMsg("No se pudo generar con IA. Intenta de nuevo.");
                                } finally {
                                  setAiLoadingProjectDesc(false);
                                }
                              }}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-primary-base)]/10 border border-[var(--color-primary-base)]/20 text-[var(--color-primary-base)] text-[10px] font-black hover:bg-[var(--color-primary-base)]/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <AISparkleIcon size={14} className={aiLoadingProjectDesc ? "animate-spin" : ""} />
                              Generar con IA
                            </button>
                          </div>
                          <div className="relative">
                            <textarea
                              rows={3}
                              placeholder="Escribe una breve idea del proyecto y presiona Generar con IA..."
                              value={newClientProjectDesc}
                              onChange={(e) => setNewClientProjectDesc(e.target.value)}
                              className="glass-input w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full px-4 py-4 rounded-xl bg-[var(--color-primary-base)] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99] transition shadow-lg cursor-pointer flex items-center justify-center gap-2 sm:gap-3"
                      >
                        <UserPlus size={18} className="shrink-0" />
                        <span className="text-center">CREAR CUENTA REGISTRADA E INTEGRAR EN COLA</span>
                      </button>
                    </form>
                  </div>

                  {/* Right side help block explaining auto setup */}
                  <div className="space-y-6">
                    <div className="p-6 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] space-y-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <CheckCircle size={20} />
                      </div>
                      <h3 className="font-bold text-sm text-[var(--color-text-primary)]">Generación Automática</h3>
                      <ul className="space-y-2 text-xs text-[var(--color-text-secondary)] list-disc pl-4 leading-relaxed">
                        <li><strong>Credenciales Inmediatas</strong>: El cliente podrá loguearse de inmediato usando el correo y contraseña especificados.</li>
                        <li><strong>Iniciativa al 25%</strong>: Provee al cliente un kickoff claro describiendo la "Fase 1: Descubrimiento y Requerimientos" inicial.</li>
                        <li><strong>Entregable de Bienvenida</strong>: Genera una fase donde el cliente leerá el Documento de Alcances y podrá aprobarlo para validar el inicio.</li>
                        <li><strong>Estado de Cobro Planificado</strong>: Se crea una factura inicial de prueba por $1,500 USD con estado pendiente.</li>
                      </ul>
                    </div>

                    <div className="p-6 rounded-[var(--radius-bento)] bg-orange-600/5 border border-orange-500/15 space-y-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center">
                        <AlertCircle size={16} />
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] font-medium leading-relaxed">
                        <strong>Prueba Cruzada</strong>: Crea una cuenta de demostración aquí, cierra sesión en la consola, introduce los nuevos datos en el portal de clientes y experimenta el pipeline exacto que verá tu nuevo usuario en tiempo real.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "admin-config" && isAdmin && (
              <div className="space-y-6 max-w-xl">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">
                  Configuración del Sistema
                </p>

                {/* Webhook URL */}
                <div className="p-5 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] space-y-3">
                  <div>
                    <p className="text-xs font-black text-[var(--color-text-primary)] mb-1">
                      URL del Webhook
                    </p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] mb-3">
                      Usa esta URL en GitHub → Settings → Webhooks de cada repo de cliente.
                    </p>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                      <code className="flex-1 text-[11px] font-mono text-[var(--color-text-secondary)] break-all">
                        {window.location.origin}/api/webhooks/github
                      </code>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/github`);
                          setSuccessMsg("URL copiada");
                        }}
                        className="shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-[10px] font-black text-[var(--color-text-secondary)] hover:border-[var(--color-primary-base)]/40 transition cursor-pointer"
                      >
                        <Copy size={10} /> Copiar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Secret Generator */}
                <div className="p-5 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] space-y-3">
                  <div>
                    <p className="text-xs font-black text-[var(--color-text-primary)] mb-1">
                      GitHub Webhook Secret
                    </p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] mb-3">
                      Genera un secret seguro. Es el mismo para todos los repos de clientes — solo necesitas generarlo una vez.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Secret
                    </span>
                    <button
                      type="button"
                      onClick={generateWebhookSecret}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-primary-base)]/10 border border-[var(--color-primary-base)]/20 text-[var(--color-primary-base)] text-[10px] font-black hover:bg-[var(--color-primary-base)]/20 transition cursor-pointer"
                    >
                      <RefreshCw size={10} />
                      {generatedSecret ? "Regenerar" : "Generar"}
                    </button>
                  </div>

                  {generatedSecret ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                        <code className="flex-1 text-[11px] font-mono text-[var(--color-text-secondary)] break-all leading-relaxed">
                          {generatedSecret}
                        </code>
                        <button
                          type="button"
                          onClick={copySecret}
                          className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-black transition-all cursor-pointer ${
                            secretCopied
                              ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20"
                              : "bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)]/40"
                          }`}
                        >
                          {secretCopied ? <><Check size={10} /> Copiado</> : <><Copy size={10} /> Copiar</>}
                        </button>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 space-y-1.5">
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-black">
                          ⚠️ Copia este secret ahora y pégalo en:
                        </p>
                        <ol className="text-[10px] text-amber-600/80 dark:text-amber-400/80 space-y-1 list-decimal list-inside">
                          <li>GitHub → cada repo cliente → Settings → Webhooks → Secret</li>
                          <li>Vercel → proyecto Polaris → Settings → Env Variables → <code className="font-mono">GITHUB_WEBHOOK_SECRET</code></li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[var(--color-text-tertiary)]">
                      Genera un secret seguro para autenticar los webhooks de GitHub.
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* --- INVOICE CHECKOUT MODAL --- */}
        <AnimatePresence>
          {payingInvoice && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-surface-base)]/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ y: 20, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 20, scale: 0.95 }}
                className="w-full max-w-md glass-panel border border-[var(--color-border-subtle)] p-6 rounded-2xl shadow-2xl relative"
              >
                <button
                  onClick={() => setPayingInvoice(null)}
                  className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  <X size={20} />
                </button>

                {paymentSuccess ? (
                  <div className="text-center space-y-4 py-8">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">¡Pago Procesado con Éxito!</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">La factura {payingInvoice.invoiceNumber} ha sido marcada como pagada.</p>
                    <button
                      onClick={() => setPayingInvoice(null)}
                      className="mt-6 px-6 py-2.5 bg-[var(--color-primary-base)] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all w-full"
                    >
                      Cerrar y Actualizar
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Procesar Pago</h2>
                        <p className="text-xs text-[var(--color-text-secondary)]">Factura {payingInvoice.invoiceNumber}</p>
                      </div>
                    </div>

                    <div className="bg-[var(--color-surface-highlight)] p-4 rounded-xl mb-6 flex justify-between items-center border border-[var(--color-border-subtle)]">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)]">Importe a pagar</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{payingInvoice.description}</p>
                      </div>
                      <span className="text-2xl font-black text-emerald-400">
                        ${payingInvoice.amount.toLocaleString("en-US")}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {errorMsg && (
                        <div className="p-3 rounded border border-red-500/20 bg-red-500/10 text-red-500 text-xs font-bold">
                          {errorMsg}
                        </div>
                      )}

                      <div className="relative min-h-[3rem]">
                        {(!paypalReady || paymentProcessing) && (
                          <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-[var(--color-text-secondary)]">
                            <RefreshCw size={18} className="animate-spin" />
                            {paymentProcessing ? "Confirmando pago..." : "Cargando PayPal..."}
                          </div>
                        )}
                        <div
                          ref={paypalButtonsContainerRef}
                          className={paymentProcessing ? "opacity-0 pointer-events-none" : ""}
                        />
                      </div>
                      <p className="text-[10px] text-center text-[var(--color-text-tertiary)]">
                        Pago seguro procesado por PayPal.
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Chat lateral — solo para clientes */}
      {!isAdmin && (
        <>
          {/* Fondo oscuro en móvil */}
          <AnimatePresence>
            {chatOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm sm:hidden"
                onClick={() => setChatOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Botón Pestaña lateral */}
          <button
            onClick={() => setChatOpen(true)}
            className={`fixed top-1/2 -translate-y-1/2 right-0 z-40 bg-white shadow-[-4px_0_15px_rgba(0,0,0,0.15)] rounded-l-xl py-4 px-2 flex flex-col items-center gap-2 transition-transform duration-300 hover:pr-3 group ${chatOpen ? "translate-x-full" : "translate-x-0"}`}
          >
            <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-primary-base)] opacity-70 group-hover:opacity-100 transition-opacity" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              Atlas AI
            </span>
          </button>
      
          {/* Panel del chat */}
          <AnimatePresence>
          {chatOpen && (
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-50 h-[100dvh] w-full sm:w-[380px] flex flex-col glass-panel border-l border-[var(--color-border-subtle)] shadow-2xl"
            >
              
              {/* Header */}
              <div className="px-5 py-4 bg-[var(--color-primary-base)] flex items-center justify-between shadow-md z-10 shrink-0">
                <div className="flex items-center gap-3">
                  {/* Isotipo SVG inline */}
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                      <defs>
                        <linearGradient id="chat-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4f46e5" />
                          <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 16 2 L 17.5 13.5 L 21.5 10.5 L 18.5 14.5 L 30 16 L 18.5 17.5 L 21.5 21.5 L 17.5 18.5 L 16 30 L 14.5 18.5 L 10.5 21.5 L 13.5 17.5 L 2 16 L 13.5 14.5 L 10.5 10.5 L 14.5 13.5 Z"
                        fill="url(#chat-logo-gradient)"
                      />
                      <circle cx="16" cy="16" r="1.5" fill="#4f46e5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-black text-sm tracking-tight">Atlas AI Assistant</p>
                    <p className="text-white/60 text-[10px]">by Polaris Web Studio</p>
                  </div>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-white/50 hover:text-white transition p-1"
                >
                  <X size={16} />
                </button>
              </div>
      
              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
                {chatMessages.length === 0 && (
                  <div className="flex-1 flex flex-col justify-center items-center text-center py-6 space-y-2">
                    <div className="flex items-center justify-center shrink-0 mb-4 drop-shadow-md">
                      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-28">
                        <defs>
                          <linearGradient id="chat-logo-gradient-large" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#818cf8" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 16 2 L 17.5 13.5 L 21.5 10.5 L 18.5 14.5 L 30 16 L 18.5 17.5 L 21.5 21.5 L 17.5 18.5 L 16 30 L 14.5 18.5 L 10.5 21.5 L 13.5 17.5 L 2 16 L 13.5 14.5 L 10.5 10.5 L 14.5 13.5 Z"
                          fill="url(#chat-logo-gradient-large)"
                        />
                        <circle cx="16" cy="16" r="1.5" fill="#ffffff" />
                      </svg>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Hola {user?.name?.split(" ")[0]}! Puedo responderte preguntas sobre el estado de tu proyecto, entregables o facturas.
                    </p>
                    <div className="flex flex-wrap gap-1.5 justify-center pt-2 mt-4">
                      {[
                        "¿Cuándo estará listo?", 
                        "¿Qué falta por hacer?", 
                        "¿Tengo pagos pendientes?",
                        "¿Cuál es el progreso actual?",
                        "¿Cómo me comunico con soporte?"
                      ].map(q => (
                        <button
                          key={q}
                          onClick={async () => {
                            if (chatLoading) return;
                            const userMsg = q;
                            const newMsgs = [...chatMessages, { role: "user" as const, text: userMsg }];
                            saveChatMessages(newMsgs);
                            setChatLoading(true);
                            try {
                              const project = clientProject;
                              if (!project) throw new Error("No active project");
                              const reply = await askAIFrontend({
                                projectId: project.id,
                                message: userMsg
                              });
                              saveChatMessages([...newMsgs, { role: "assistant" as const, text: reply }]);
                            } catch (e) {
                              saveChatMessages([...newMsgs, { role: "assistant" as const, text: "No pude procesar tu pregunta. Contáctanos directamente." }]);
                            } finally {
                              setChatLoading(false);
                            }
                          }}
                          className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--color-primary-base)]/10 text-[var(--color-primary-base)] border border-[var(--color-primary-base)]/20 hover:bg-[var(--color-primary-base)]/20 transition"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[var(--color-primary-base)] text-white rounded-br-none"
                        : "bg-[var(--color-surface-highlight)] text-[var(--color-text-primary)] rounded-bl-none border border-[var(--color-border-subtle)]"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] px-3 py-2 rounded-xl rounded-bl-none flex gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)] animate-bounce" style={{animationDelay: `${i*150}ms`}} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
      
              {/* Soporte WhatsApp */}
              <div className="px-3 pt-3 pb-3">
                <a
                  href={`https://wa.me/18299200544?text=${encodeURIComponent(`Hola, soy ${user?.name} y tengo una consulta sobre mi proyecto ${clientProject?.name}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-bold hover:bg-emerald-500/20 transition"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Hablar con un agente por WhatsApp
                </a>
              </div>
      
              {/* Input */}
              <div className="p-3 border-t border-[var(--color-border-subtle)] flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={async e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      document.getElementById("send-chat-btn")?.click();
                    }
                  }}
                  className="glass-input chat-input flex-1 px-3 py-2 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                  placeholder="Escribe tu pregunta..."
                  autoCapitalize="none"
                />
                <button
                  id="send-chat-btn"
                  onClick={async () => {
                    if (!chatInput.trim() || chatLoading) return;
                    const userMsg = chatInput.trim();
                    setChatInput("");
                    const newMsgs = [...chatMessages, { role: "user" as const, text: userMsg }];
                    saveChatMessages(newMsgs);
                    setChatLoading(true);
                    try {
                      const project = clientProject;
                      if (!project) throw new Error("No active project");
                      const reply = await askAIFrontend({
                        projectId: project.id,
                        message: userMsg
                      });
                      saveChatMessages([...newMsgs, { role: "assistant" as const, text: reply }]);
                    } catch (e) {
                      saveChatMessages([...newMsgs, { role: "assistant" as const, text: "No pude procesar tu pregunta. Contáctanos directamente." }]);
                    } finally {
                      setChatLoading(false);
                    }
                  }}
                  className="w-8 h-8 rounded-xl bg-[var(--color-primary-base)] text-white flex items-center justify-center hover:opacity-90 transition shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </>
      )}

      {/* Change Password Modal */}
          <AnimatePresence>
            {showPasswordModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowPasswordModal(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="relative w-full max-w-md p-6 bg-[var(--color-surface-base)] rounded-[var(--radius-bento)] border border-[var(--color-border-subtle)] bento-shadow overflow-hidden"
                >
                  <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--color-border-subtle)]/30">
                    <h3 className="text-lg font-display font-black flex items-center gap-2 text-[var(--color-text-primary)]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-primary-base)]"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <T en="Change Password">Cambiar Contraseña</T>
                    </h3>
                    <button
                      onClick={() => setShowPasswordModal(false)}
                      className="p-1 rounded-lg hover:bg-[var(--color-surface-highlight)] transition-colors"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {passwordChangeError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs">
                      {passwordChangeError}
                    </div>
                  )}

                  {passwordChangeSuccess && (
                    <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs">
                      {passwordChangeSuccess}
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[var(--color-text-secondary)]">
                        <T en="New Password">Nueva Contraseña</T>
                      </label>
                      <input
                        type="password"
                        required
                        value={newPasswordValue}
                        onChange={(e) => setNewPasswordValue(e.target.value)}
                        placeholder={language === "es" ? "Mínimo 6 caracteres" : "At least 6 characters"}
                        className="glass-input w-full px-4 py-3 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] focus:border-[var(--color-primary-base)] focus:outline-none transition-colors text-sm text-[var(--color-text-primary)]"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowPasswordModal(false)}
                        className="flex-1 py-3 rounded-xl border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-highlight)] transition-colors text-xs font-bold"
                      >
                        <T en="Cancel">Cancelar</T>
                      </button>
                      <button
                        type="submit"
                        disabled={passwordChangeLoading}
                        className="flex-1 py-3 rounded-xl bg-[var(--color-primary-base)] hover:opacity-90 text-white font-black transition-all disabled:opacity-50 text-xs flex justify-center items-center gap-1.5 cursor-pointer"
                      >
                        {passwordChangeLoading ? (
                          <T en="Updating...">Actualizando...</T>
                        ) : (
                          <>
                            <T en="Update Password">Actualizar</T>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Custom Confirmation Modal */}
          <AnimatePresence>
            {confirmDialog.isOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                  className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="relative w-full max-w-sm p-6 bg-[var(--color-surface-base)]/90 rounded-2xl border border-[var(--color-border-subtle)] backdrop-blur-xl bento-shadow overflow-hidden z-10"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex p-1.5 rounded-lg ${confirmDialog.isDanger ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"}`}>
                      {confirmDialog.isDanger ? <Trash2 size={14} /> : <Archive size={14} />}
                    </span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-primary)]">
                      {confirmDialog.title}
                    </h3>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-6 font-medium">
                    {confirmDialog.message}
                  </p>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                      className="flex-1 py-2 px-4 rounded-lg bg-[var(--color-surface-highlight)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer select-none text-center"
                    >
                      {confirmDialog.cancelText}
                    </button>
                    <button
                      type="button"
                      onClick={confirmDialog.onConfirm}
                      className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all text-xs flex justify-center items-center gap-1.5 cursor-pointer select-none border ${
                        confirmDialog.isDanger
                          ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 shadow-sm shadow-red-500/5"
                          : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 shadow-sm shadow-indigo-500/5"
                      }`}
                    >
                      {confirmDialog.confirmText}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

    </div>
  );
}
