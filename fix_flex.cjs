const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

content = content.replace(/outline-none flex items-center gap-1/g, 'outline-none inline-flex items-center gap-1 w-fit');
// Just to be sure for non-admin too, although it's a span:
content = content.replace(/<span className={\`text-\[9px\] uppercase font-bold tracking-widest px-2 py-0\.5 rounded/g, '<span className={`inline-block text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded w-fit');

fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
