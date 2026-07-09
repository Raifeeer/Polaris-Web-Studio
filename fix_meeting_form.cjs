const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

content = content.replace(
  /<label className="text-\[10px\] font-black uppercase tracking-wider text-\[var\(--color-text-tertiary\)\]">Tema \/ Título<\/label>/g,
  '<label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Título</label>'
);

content = content.replace(
  /placeholder="Ej: Demo Avances Sprint 2"/g,
  'placeholder="Ej: Revisión de proyecto"'
);

// Add min-w-0 to inputs to prevent overflow
content = content.replace(
  /className="glass-input w-full px-4 py-2\.5 rounded-lg bg-\[var\(--color-surface-highlight\)\] border border-\[var\(--color-border-subtle\)\] text-xs text-\[var\(--color-text-primary\)\] focus:outline-none"/g,
  'className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none min-w-0 appearance-none"'
);

fs.writeFileSync('src/pages/ClientDashboard.tsx', content);

let cssContent = fs.readFileSync('src/index.css', 'utf8');
if (!cssContent.includes('color-scheme: dark;')) {
  cssContent = cssContent.replace(
    /:root \{/,
    ':root {\n  color-scheme: dark;'
  );
  fs.writeFileSync('src/index.css', cssContent);
}

