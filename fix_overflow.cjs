const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

content = content.replace(
  /className="px-4 pb-4 space-y-4 overflow-hidden"/g,
  'className="px-4 pb-4 space-y-4"'
);

// We need to add overflow hidden on exit/initial and visible on animate
const oldFormMotion = `                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}`;

const newFormMotion = `                          initial={{ height: 0, opacity: 0, overflow: "hidden" }}
                          animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }}
                          exit={{ height: 0, opacity: 0, overflow: "hidden" }}`;

content = content.replace(oldFormMotion, newFormMotion);

fs.writeFileSync('src/pages/ClientDashboard.tsx', content);

