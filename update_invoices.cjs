const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

const targetContent = `                              <button
                                type="button"
                                disabled={!isAdmin}
                                onClick={() => handleToggleInvoicePaid(inv.id)}
                                className={\`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded cursor-pointer \${
                                  inv.status === "paid"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                }\`}
                              >
                                {inv.status === "paid" ? "Pagada Oficial" : "Pendiente"}
                                {isAdmin && " (Alternar)"}
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                            {isAdmin ? (
                              <>
                                <button
                                  onClick={() => printInvoice(inv)}
                                  className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)] hover:bg-[var(--color-primary-base)]/10 rounded transition"
                                  title="Imprimir / Guardar PDF"
                                >
                                  <Download size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteInvoice(inv.id)}
                                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (`;

const replacementContent = `                              {isAdmin ? (
                                <select
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
                                </select>
                              ) : (
                                <span className={\`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded \${
                                  inv.status === "paid"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : inv.status === "void"
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                }\`}>
                                  {inv.status === "paid" ? "Pagada" : inv.status === "void" ? "Inhabilitada" : "Pendiente"}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                            {isAdmin ? (
                              <>
                                <button
                                  onClick={() => printInvoice(inv)}
                                  className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)] hover:bg-[var(--color-primary-base)]/10 rounded transition"
                                  title="Imprimir / Guardar PDF"
                                >
                                  <Download size={14} />
                                </button>
                              </>
                            ) : (`;

if (content.includes(targetContent)) {
  content = content.replace(targetContent, replacementContent);
  fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
  console.log("Success");
} else {
  console.log("Target content not found");
}
