const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

const targetContent = `                          <CustomSelect
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
                                  label: p.displayId ? \`\${p.displayId} - \${p.name}\` : p.name
                                }))
                            ]}
                            className="rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] overflow-hidden"
                            buttonClassName="w-full py-3 px-4 flex items-center justify-between gap-3 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer select-none text-left"
                          />`;

const replacementContent = `                          <CustomSelect
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
                                  label: p.displayId ? \`\${p.displayId} - \${p.name}\` : p.name
                                }))
                            ]}
                            className="rounded-[var(--radius-bento)] glass-panel border border-indigo-500/10 overflow-hidden"
                            buttonClassName="w-full py-3 px-4 flex items-center justify-between gap-3 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer select-none text-left"
                          />`;

if (content.includes(targetContent)) {
  content = content.replace(targetContent, replacementContent);
  fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
  console.log("Success");
} else {
  console.log("Target content not found");
}
