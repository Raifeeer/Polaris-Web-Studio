const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

// 1. Remove overflow-hidden from invoice status dropdown ul
content = content.replace(
  /className="absolute z-\[100\] mt-1 py-1 w-max min-w-36 left-0 md:left-auto md:right-0 rounded-lg bg-\[var\(--color-surface-base\)\] border border-\[var\(--color-border-subtle\)\] shadow-xl backdrop-blur-md focus:outline-none overflow-hidden"/g,
  'className="absolute z-[100] mt-1 py-1 w-max min-w-36 left-0 md:left-auto md:right-0 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] shadow-xl backdrop-blur-md focus:outline-none"'
);

// 2. Change the onClick of "Invalidada" to use confirmDialog
const invalidadaTarget = `onClick={() => {
                                              handleUpdateInvoiceStatus(inv.id, "void");
                                              setOpenInvoiceStatusDropdown(null);
                                            }}
                                            className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors"
                                          >Invalidada</button>`;

const invalidadaReplacement = `onClick={() => {
                                              setOpenInvoiceStatusDropdown(null);
                                              setConfirmDialog({
                                                isOpen: true,
                                                title: "Invalidar Factura",
                                                message: "¿Está seguro de que desea invalidar esta factura? Esta acción no se puede deshacer.",
                                                confirmText: "Invalidar Factura",
                                                cancelText: "Cancelar",
                                                isDanger: true,
                                                onConfirm: () => {
                                                  handleUpdateInvoiceStatus(inv.id, "void");
                                                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                                }
                                              });
                                            }}
                                            className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors"
                                          >Invalidada</button>`;

if (content.includes(invalidadaTarget)) {
  content = content.replace(invalidadaTarget, invalidadaReplacement);
  console.log("Replaced Invalidada onClick");
} else {
  console.log("Could not find Invalidada onClick target");
}

fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
