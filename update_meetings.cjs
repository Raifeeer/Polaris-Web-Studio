const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

// 1. Add state for meetingFormOpen
const stateTarget = `const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);`;
const stateRepl = `const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);\n  const [meetingFormOpen, setMeetingFormOpen] = useState(false);`;
content = content.replace(stateTarget, stateRepl);

// 2. Add ref for meeting header to handle click outside
const refTarget = `const deliverableHeaderRef = useRef<HTMLButtonElement>(null);\n  const invoiceHeaderRef = useRef<HTMLButtonElement>(null);`;
const refRepl = `const deliverableHeaderRef = useRef<HTMLButtonElement>(null);\n  const invoiceHeaderRef = useRef<HTMLButtonElement>(null);\n  const meetingHeaderRef = useRef<HTMLButtonElement>(null);`;
content = content.replace(refTarget, refRepl);

// 3. Close the form when clicking outside (not strictly necessary for the dropdown, but good practice, wait they are not using click outside for these, let's check)

// 4. Update the form markup
const formTarget = `{/* MANAGER ONLY: Form to schedule meetings */}
                {isAdmin && (
                  <form onSubmit={handleCreateMeeting} className="p-6 rounded-[var(--radius-bento)] glass-panel border border-indigo-500/10 space-y-4">
                    <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-1.5 mb-2">
                      <PlusCircle size={16} />
                      Agendar Videollamada Técnica (Google Meet)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">`;

const formRepl = `{/* MANAGER ONLY: Form to schedule meetings */}
                {isAdmin && (
                  <div className="rounded-[var(--radius-bento)] glass-panel border border-indigo-500/10 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setMeetingFormOpen(prev => !prev)}
                      className="w-full py-3 px-4 flex items-center justify-between gap-3 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer select-none text-left"
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <PlusCircle size={15} className="flex-shrink-0" />
                        <span className="truncate">Agendar Videollamada Técnica (Google Meet)</span>
                      </span>
                      <ChevronDown
                        size={15}
                        className={\`text-[var(--color-text-tertiary)] flex-shrink-0 transition-transform duration-200 \${meetingFormOpen ? "rotate-180" : ""}\`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {meetingFormOpen && (
                        <motion.form
                          onSubmit={(e) => {
                             handleCreateMeeting(e);
                             setMeetingFormOpen(false);
                          }}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="px-4 pb-4 space-y-4 overflow-hidden"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">`;

// Fix the end of the form
const formEndTarget = `                      <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Calendar size={14} /> Crear Evento
                      </button>
                    </div>
                  </form>
                )}`;

const formEndRepl = `                      <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Calendar size={14} /> Crear Evento
                      </button>
                    </div>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>
                )}`;

if (content.includes(formTarget) && content.includes(formEndTarget)) {
  content = content.replace(formTarget, formRepl);
  content = content.replace(formEndTarget, formEndRepl);
  fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
  console.log("Success: Replaced Meeting Form");
} else {
  console.log("Failed to find targets");
}

