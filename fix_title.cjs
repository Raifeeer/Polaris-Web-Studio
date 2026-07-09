const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

content = content.replace(
  /Agendar Videollamada Técnica \(Google Meet\)/g,
  'Agendar videollamada técnica'
);

fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
