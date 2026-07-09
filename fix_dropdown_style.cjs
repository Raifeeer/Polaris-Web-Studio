const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

let newContent = content.replace(
  /className="absolute z-50 mt-1 py-1 w-32 right-0 rounded-lg bg-\[var\(--color-surface-base\)\] border border-\[var\(--color-border-subtle\)\] shadow-xl backdrop-blur-md focus:outline-none overflow-hidden"/g,
  'className="absolute z-[100] mt-1 py-1 w-max min-w-36 left-0 md:left-auto md:right-0 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] shadow-xl backdrop-blur-md focus:outline-none overflow-hidden"'
);

newContent = newContent.replace(
  />Marcar como Pendiente<\/button>/g,
  '>Pendiente</button>'
);
newContent = newContent.replace(
  />Marcar como Pagada<\/button>/g,
  '>Pagada</button>'
);
newContent = newContent.replace(
  />Invalidar Factura<\/button>/g,
  '>Invalidada</button>'
);

if (newContent !== content) {
  fs.writeFileSync('src/pages/ClientDashboard.tsx', newContent);
  console.log("Success");
} else {
  console.log("Failed to match content.");
}
