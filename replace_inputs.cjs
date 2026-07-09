const fs = require('fs');
let content = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

const targetDate = `<input
                          type="date"
                          required
                          value={newMeetDate}
                          onChange={(e) => setNewMeetDate(e.target.value)}
                          className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none min-w-0 appearance-none"
                        />`;

const targetTime = `<input
                          type="time"
                          required
                          value={newMeetTime}
                          onChange={(e) => setNewMeetTime(e.target.value)}
                          className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none min-w-0 appearance-none"
                        />`;

const timeOptionsCode = `
                      {(() => {
                        const timeOptions = [];
                        for (let i = 8; i <= 20; i++) {
                          timeOptions.push({ id: \`\${String(i).padStart(2, '0')}:00\`, label: \`\${String(i).padStart(2, '0')}:00\` });
                          timeOptions.push({ id: \`\${String(i).padStart(2, '0')}:30\`, label: \`\${String(i).padStart(2, '0')}:30\` });
                        }
                        return (
                          <CustomSelect
                            options={timeOptions}
                            value={newMeetTime}
                            onChange={(val) => setNewMeetTime(val)}
                            placeholder="Ej: 14:00"
                          />
                        );
                      })()}
`;

if (content.includes(targetDate)) {
  content = content.replace(targetDate, `<CustomDatePicker value={newMeetDate} onChange={(val) => setNewMeetDate(val)} placeholder="Ej: 8/7/2026" />`);
  console.log("Success: Replaced date input");
} else {
  console.log("Failed to find date input");
}

if (content.includes(targetTime)) {
  content = content.replace(targetTime, timeOptionsCode);
  console.log("Success: Replaced time input");
} else {
  console.log("Failed to find time input");
}

fs.writeFileSync('src/pages/ClientDashboard.tsx', content);

