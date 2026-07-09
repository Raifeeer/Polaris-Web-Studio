const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

const targetStr = `                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}`;

const replaceStr = `                          initial={{ height: 0, opacity: 0, overflow: "hidden" }}
                          animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }}
                          exit={{ height: 0, opacity: 0, overflow: "hidden" }}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
  console.log("Success");
} else {
  console.log("Failed to find target");
}
