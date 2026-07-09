const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

const targetContent = `                                <select
                                  value={inv.status || "pending"}
                                  onChange={(e) => handleUpdateInvoiceStatus(inv.id, e.target.value)}
                                  className={\`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded cursor-pointer appearance-none outline-none \${
                                    inv.status === "paid"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : inv.status === "void"
                                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                      : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                  }\`}
                                >
                                  <option value="pending" className="bg-[var(--color-surface-base)] text-amber-500">Pendiente</option>
                                  <option value="paid" className="bg-[var(--color-surface-base)] text-emerald-400">Pagada</option>
                                  <option value="void" className="bg-[var(--color-surface-base)] text-red-400">Inhabilitada</option>
                                </select>`;

const replacementContent = `                                <div className="relative">
                                  <button
                                    onClick={() => setOpenInvoiceStatusDropdown(openInvoiceStatusDropdown === inv.id ? null : inv.id)}
                                    className={\`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded cursor-pointer appearance-none outline-none flex items-center gap-1 \${
                                      inv.status === "paid"
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : inv.status === "void"
                                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                        : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                    }\`}
                                  >
                                    {inv.status === "paid" ? "Pagada" : inv.status === "void" ? "Inhabilitada" : "Pendiente"}
                                    <ChevronDown size={10} />
                                  </button>
                                  
                                  <AnimatePresence>
                                    {openInvoiceStatusDropdown === inv.id && (
                                      <motion.ul
                                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute z-50 mt-1 py-1 w-32 right-0 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] shadow-xl backdrop-blur-md focus:outline-none overflow-hidden"
                                      >
                                        <li>
                                          <button
                                            onClick={() => {
                                              handleUpdateInvoiceStatus(inv.id, "pending");
                                              setOpenInvoiceStatusDropdown(null);
                                            }}
                                            className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 transition-colors"
                                          >
                                            Pendiente
                                          </button>
                                        </li>
                                        <li>
                                          <button
                                            onClick={() => {
                                              handleUpdateInvoiceStatus(inv.id, "paid");
                                              setOpenInvoiceStatusDropdown(null);
                                            }}
                                            className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                          >
                                            Pagada
                                          </button>
                                        </li>
                                        <li>
                                          <button
                                            onClick={() => {
                                              handleUpdateInvoiceStatus(inv.id, "void");
                                              setOpenInvoiceStatusDropdown(null);
                                            }}
                                            className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors"
                                          >
                                            Inhabilitada
                                          </button>
                                        </li>
                                      </motion.ul>
                                    )}
                                  </AnimatePresence>
                                </div>`;

if (content.includes(targetContent)) {
  content = content.replace(targetContent, replacementContent);
  fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
  console.log("Success");
} else {
  console.log("Target content not found");
}
