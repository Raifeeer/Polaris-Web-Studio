const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

const targetContent = `                                <button
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

const replacementContent = `                                <button
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
