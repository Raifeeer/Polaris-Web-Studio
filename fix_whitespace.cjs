const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

content = content.replace(
  /className="w-full text-left px-3 py-2 text-\[10px\] font-bold uppercase tracking-widest/g,
  'className="w-full whitespace-nowrap text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest'
);

fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
