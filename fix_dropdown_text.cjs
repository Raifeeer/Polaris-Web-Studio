const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

content = content.replace(
  />\s*Pendiente\s*<\/button>/g,
  '>Marcar como Pendiente</button>'
);
content = content.replace(
  />\s*Pagada\s*<\/button>/g,
  '>Marcar como Pagada</button>'
);
content = content.replace(
  />\s*Invalidada\s*<\/button>/g,
  '>Invalidar Factura</button>'
);

fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
