const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

const oldDatePickerRegex = /function CustomDatePicker\(\{[\s\S]*?className=\{`relative \$\{className\}`\}\>[\s\S]*?\<\/AnimatePresence\>\n    \<\/div\>\n  \)\n\}/m;

const newDatePickerCode = `function CustomDatePicker({ value, onChange, placeholder = "Seleccionar fecha", className = "" }: { value: string, onChange: (val: string) => void, placeholder?: string, className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentMonth, setCurrentMonth] = useState(() => value ? new Date(value + 'T00:00:00') : new Date());
  const [view, setView] = useState<"days" | "months" | "years">("days");
  const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "top">("bottom");

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
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      if (spaceBelow < 300 && spaceAbove > spaceBelow) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }
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
    onChange(\`\${year}-\${formattedMonth}-\${formattedDay}\`);
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
    <div ref={containerRef} className={\`relative \${className}\`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none flex items-center justify-between cursor-pointer hover:bg-[var(--color-surface-hover)] transition-all select-none text-left"
      >
        <span className={value ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-tertiary)]"}>
          {formattedValue}
        </span>
        <Calendar size={14} className="text-[var(--color-text-tertiary)] flex-shrink-0 ml-2" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: dropdownPosition === "top" ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropdownPosition === "top" ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={\`absolute z-[160] w-full min-w-[260px] p-3 rounded-xl bg-[var(--color-surface-base)]/95 border border-[var(--color-border-subtle)] shadow-xl backdrop-blur-md focus:outline-none left-0 \${dropdownPosition === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"}\`}
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
                   {blanks.map(b => <div key={\`blank-\${b}\`} className="p-1.5"></div>)}
                   {days.map(d => {
                     const dStr = \`\${year}-\${String(month + 1).padStart(2, '0')}-\${String(d).padStart(2, '0')}\`;
                     const isSelected = value === dStr;
                     const isToday = new Date().toISOString().split('T')[0] === dStr;
                     return (
                       <button 
                         key={d} 
                         type="button"
                         onClick={() => handleSelectDate(d)}
                         className={\`p-1.5 text-xs rounded-md flex items-center justify-center cursor-pointer transition-colors \${isSelected ? 'bg-indigo-600 text-white font-bold' : isToday ? 'text-indigo-400 font-bold hover:bg-[var(--color-surface-highlight)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]'}\`}
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
                       className={\`p-2 text-xs rounded-md flex items-center justify-center cursor-pointer transition-colors \${i === month ? 'bg-indigo-600 text-white font-bold' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]'}\`}
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
                       className={\`p-2 text-xs rounded-md flex items-center justify-center cursor-pointer transition-colors \${y === year ? 'bg-indigo-600 text-white font-bold' : y < startYear || y > startYear + 9 ? 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-highlight)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]'}\`}
                     >
                       {y}
                     </button>
                   ))}
                 </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}`

content = content.replace(oldDatePickerRegex, newDatePickerCode);


const oldSelectRegex = /function CustomSelect\(\{[\s\S]*?className=\{`relative \$\{className\}`\}\>[\s\S]*?\<\/AnimatePresence\>\n    \<\/div\>\n  \);\n\}/m;
const newSelectCode = `function CustomSelect({
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
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      if (spaceBelow < 250 && spaceAbove > spaceBelow) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div ref={containerRef} className={\`relative \${className}\`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName || "glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none flex items-center justify-between cursor-pointer hover:bg-[var(--color-surface-hover)] transition-all select-none text-left"}
      >
        <span className={value ? "truncate text-[var(--color-text-primary)]" : "truncate text-[var(--color-text-tertiary)]"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={\`text-[var(--color-text-tertiary)] transition-transform duration-200 flex-shrink-0 ml-2 \${isOpen ? "rotate-180" : ""}\`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: dropdownPosition === "top" ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropdownPosition === "top" ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={\`absolute z-[150] w-full max-h-60 overflow-y-auto rounded-lg bg-[var(--color-surface-base)]/95 border border-[var(--color-border-subtle)] shadow-xl backdrop-blur-md focus:outline-none scrollbar-thin left-0 \${dropdownPosition === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"}\`}
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
                  className={\`px-4 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors \${
                    isSelected
                      ? "bg-indigo-500/10 text-indigo-400 font-bold"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-text-primary)]"
                  }\`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={12} className="text-indigo-400 flex-shrink-0 ml-2" />}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}`

content = content.replace(oldSelectRegex, newSelectCode);

fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
