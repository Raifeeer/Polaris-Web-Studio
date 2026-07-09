const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

const customDatePickerCode = `
function CustomDatePicker({ value, onChange, placeholder = "Seleccionar fecha", className = "" }: { value: string, onChange: (val: string) => void, placeholder?: string, className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentMonth, setCurrentMonth] = useState(() => value ? new Date(value + 'T00:00:00') : new Date());

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
  const dayNames = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

  const handleSelectDate = (day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    onChange(\`\${year}-\${formattedMonth}-\${formattedDay}\`);
    setIsOpen(false);
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
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[160] w-[260px] mt-1.5 p-3 rounded-xl bg-[var(--color-surface-base)]/95 border border-[var(--color-border-subtle)] shadow-xl backdrop-blur-md focus:outline-none left-0"
          >
             <div className="flex items-center justify-between mb-3">
               <button type="button" onClick={handlePrevMonth} className="p-1 rounded-md hover:bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)]"><ChevronDown size={14} className="rotate-90" /></button>
               <span className="text-xs font-bold text-[var(--color-text-primary)]">{monthNames[month]} {year}</span>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
`;

// Insert the new component right after CustomSelect ends (around line 170)
const insertionPoint = `          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}`;

if (content.includes(insertionPoint)) {
  content = content.replace(insertionPoint, insertionPoint + '\n\n' + customDatePickerCode);
  fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
  console.log("Success: Injected CustomDatePicker");
} else {
  console.log("Failed to find insertion point");
}

