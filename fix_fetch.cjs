const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

const targetContent = `      .then((resData) => {
        if (!active) return;
        setData(resData);
        // Default select first project for admin tasks`;

const replacementContent = `      .then((resData) => {
        if (!active) return;
        
        // Filter void invoices for non-admins
        if (!isAdmin && resData.invoices) {
          resData.invoices = resData.invoices.filter(i => i.status !== "void");
        }
        
        setData(resData);
        // Default select first project for admin tasks`;

if (content.includes(targetContent)) {
  content = content.replace(targetContent, replacementContent);
  fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
  console.log("Success");
} else {
  console.log("Target content not found");
}
