const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

content = content.replace(
  /\${inv\.status === "paid" \? "Pagada" \: "Pendiente"}/g,
  `\${inv.status === "paid" ? "Pagada" : inv.status === "void" ? "Inhabilitada" : "Pendiente"}`
);
content = content.replace(
  /\${inv\.status === "paid" \? "#dcfce7" \: "#fef9c3"}/g,
  `\${inv.status === "paid" ? "#dcfce7" : inv.status === "void" ? "#fee2e2" : "#fef9c3"}`
);
content = content.replace(
  /\${inv\.status === "paid" \? "#15803d" \: "#854d0e"}/g,
  `\${inv.status === "paid" ? "#15803d" : inv.status === "void" ? "#b91c1c" : "#854d0e"}`
);

content = content.replace(
  /\{data\.invoices\[0\]\.status === "paid" \? "Pagada" \: "Pendiente"\}/g,
  `{data.invoices[0].status === "paid" ? "Pagada" : data.invoices[0].status === "void" ? "Inhabilitada" : "Pendiente"}`
);
content = content.replace(
  /data\.invoices\[0\]\.status === "paid" \n                                      \? "bg-emerald-500\/10 text-emerald-400" \n                                      \: "bg-amber-500\/10 text-amber-500"/g,
  `data.invoices[0].status === "paid" 
                                      ? "bg-emerald-500/10 text-emerald-400" 
                                      : data.invoices[0].status === "void"
                                      ? "bg-red-500/10 text-red-400"
                                      : "bg-amber-500/10 text-amber-500"`
);


fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
