const fs = require('fs');
let cssContent = fs.readFileSync('src/index.css', 'utf8');

if (!cssContent.includes('::-webkit-calendar-picker-indicator')) {
  cssContent += `\n
::-webkit-calendar-picker-indicator {
  filter: invert(1) opacity(0.5);
  cursor: pointer;
}
::-webkit-calendar-picker-indicator:hover {
  filter: invert(1) opacity(0.8);
}
input[type="date"]::-webkit-datetime-edit,
input[type="time"]::-webkit-datetime-edit {
  color: var(--color-text-primary);
}
`;
  fs.writeFileSync('src/index.css', cssContent);
}
