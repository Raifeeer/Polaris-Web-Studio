const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

content = content.replace(/Inhabilitada/g, 'Invalidada');
content = content.replace(/inhabilitada/g, 'invalidada');

fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
