const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

const target = `<div className="mb-4 space-y-1 w-full max-w-sm">
                          <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)] ml-1">Filtrar por proyecto</label>`;

const replacement = `<div className="mb-4 space-y-1 w-full max-w-sm relative z-50">
                          <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)] ml-1">Filtrar por proyecto</label>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
  console.log("Success");
} else {
  console.log("Target not found");
}
