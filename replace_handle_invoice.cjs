const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

content = content.replace(
  /const handleToggleInvoicePaid = async \(invoiceId: string\) => {[\s\S]*?};\n\n  const handleDeleteInvoice = async \(invoiceId: string\) => {[\s\S]*?};\n/g,
  `const handleUpdateInvoiceStatus = async (invoiceId: string, status: string) => {
    try {
      await fetch(\`/api/portal/invoices/\${invoiceId}/status\`, {
        method: "PUT",
        headers: { 
          Authorization: \`Bearer \${token}\`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };
`
);

fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
