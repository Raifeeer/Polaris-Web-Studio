const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

// In CustomSelect component, let's make the motion.ul use z-[100]
content = content.replace(
  /className="absolute z-50 w-full mt-1.5 py-1.5 max-h-60 overflow-y-auto rounded-lg bg-\[var\(--color-surface-base\)\]\/95 border border-\[var\(--color-border-subtle\)\] shadow-xl backdrop-blur-md focus:outline-none scrollbar-thin left-0"/g,
  'className="absolute z-[150] w-full mt-1.5 py-1.5 max-h-60 overflow-y-auto rounded-lg bg-[var(--color-surface-base)]/95 border border-[var(--color-border-subtle)] shadow-xl backdrop-blur-md focus:outline-none scrollbar-thin left-0"'
);

// For the invoice filter container, ensure it has high z-index
content = content.replace(
  /className="mb-4 space-y-1 w-full max-w-sm relative z-50"/g,
  'className="mb-4 space-y-1 w-full max-w-sm relative z-[110]"'
);

fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
