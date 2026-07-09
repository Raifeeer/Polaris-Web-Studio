const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

content = content.replace(
  'const [selectedInvoiceFilterProject, setSelectedInvoiceFilterProject] = useState("all");',
  'const [selectedInvoiceFilterProject, setSelectedInvoiceFilterProject] = useState("all");\n  const [openInvoiceStatusDropdown, setOpenInvoiceStatusDropdown] = useState<string | null>(null);'
);

fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
