const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

const targetContent = `                  const filteredInvoices = selectedInvoiceFilterProject === "all" 
                    ? data.invoices 
                    : data.invoices.filter((inv) => inv.projectId === selectedInvoiceFilterProject);`;

const replacementContent = `                  const filteredInvoices = (selectedInvoiceFilterProject === "all" 
                    ? data.invoices 
                    : data.invoices.filter((inv) => inv.projectId === selectedInvoiceFilterProject))
                    .filter(inv => isAdmin || inv.status !== "void");`;

if (content.includes(targetContent)) {
  content = content.replace(targetContent, replacementContent);
  fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
  console.log("Success");
} else {
  console.log("Target content not found");
}
