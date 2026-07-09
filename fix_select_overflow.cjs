const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

const target = `className="rounded-[var(--radius-bento)] glass-panel border border-indigo-500/10 overflow-hidden"\n                            buttonClassName="w-full py-3 px-4 flex items-center justify-between gap-3 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer select-none text-left"`;

const repl = `className="rounded-[var(--radius-bento)] glass-panel border border-indigo-500/10 z-10"\n                            buttonClassName="w-full py-3 px-4 flex items-center justify-between gap-3 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer select-none text-left rounded-[var(--radius-bento)]"`;

if (content.includes(target)) {
  content = content.replace(target, repl);
  fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
  console.log("Success");
} else {
  console.log("Not found");
}
