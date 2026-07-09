const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

content = content.replace(
  /<label className="text-\[10px\] font-black uppercase tracking-wider text-\[var\(--color-text-tertiary\)\]">Tema \/ Título<\/label>/g,
  '<label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Título</label>'
);

fs.writeFileSync('src/pages/ClientDashboard.tsx', content);

