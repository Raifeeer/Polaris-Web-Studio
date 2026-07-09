const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

const targetContent = `                          <div className="flex items-center justify-between md:justify-end gap-4 text-left md:text-right w-full md:w-auto shrink-0 mt-2 md:mt-0">
                            <div>
                              <p className="text-lg font-display font-black text-[var(--color-text-primary)]">{formatMoney(inv.amount)}</p>
                              
                              {isAdmin ? (
                                <div className="relative">
                                  <button`;

const replacementContent = `                          <div className="flex items-center justify-between md:justify-end gap-4 text-left md:text-right w-full md:w-auto shrink-0 mt-2 md:mt-0">
                            <div className="flex flex-col items-start md:items-end">
                              <p className="text-lg font-display font-black text-[var(--color-text-primary)]">{formatMoney(inv.amount)}</p>
                              
                              {isAdmin ? (
                                <div className="relative mt-1">
                                  <button`;

if (content.includes(targetContent)) {
  content = content.replace(targetContent, replacementContent);
  fs.writeFileSync('src/pages/ClientDashboard.tsx', content);
  console.log("Success");
} else {
  console.log("Target content not found");
}
