import fs from 'fs';
import path from 'path';

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. All rounded-2xl on cards -> rounded-xl
  // 2. All rounded-3xl anywhere -> rounded-lg
  // 3. All rounded-full on buttons -> rounded-lg (except indicators/avatars)
  // 4. All modal/drawer containers rounded-2xl or rounded-3xl -> rounded-xl
  // 5. Input fields rounded-xl -> rounded-lg

  // Note: Since cards and modals cover most rounded-2xl and rounded-3xl, 
  // Let's replace:
  // rounded-3xl -> rounded-lg
  // Except wait, if modal has 3xl, it becomes rounded-xl.
  // Actually, we can just replace 'rounded-3xl' with 'rounded-lg' globally unless it's a modal.
  
  if (filePath.includes('AuthModal.tsx')) {
    content = content.replace(/rounded-2xl/g, 'rounded-xl');
    content = content.replace(/rounded-3xl/g, 'rounded-xl');
  } else {
    content = content.replace(/rounded-3xl/g, 'rounded-lg');
  }

  // Cards with rounded-2xl -> rounded-xl
  // It's safe to just replace 'rounded-2xl' with 'rounded-xl' globally, as modals and cards use it. 
  // Any other rounded-2xl should probably be rounded-xl too based on the user wanting to reduce large radii.
  content = content.replace(/rounded-2xl/g, 'rounded-xl');

  // Input fields using rounded-xl -> rounded-lg
  // Just finding `<input` tags with `rounded-xl`
  content = content.replace(/<input([^>]*?)rounded-xl([^>]*?)>/g, '<input$1rounded-lg$2>');
  // Or simply replace rounded-xl with rounded-lg on input elements line by line
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<input') && lines[i].includes('rounded-xl')) {
      lines[i] = lines[i].replace(/rounded-xl/g, 'rounded-lg');
    }
  }
  content = lines.join('\n');

  // Also TourDetail has custom input and PhoneInput wrapper that uses rounded-xl for input containers.
  // We should manually verify those later or do a global run.

  // Buttons pill to rounded-lg
  // `<button ... rounded-full ...>`
  // Or `Link ... rounded-full` where it's a button styles.
  // Carousel indicators usually have `w-2 h-2` or `w-3 h-3`.
  // Wait, let's find `rounded-full` inside lines that have `button` or `Link` and don't have `w-2`, `w-3`, etc.
  for (let i = 0; i < lines.length; i++) {
    if ((lines[i].includes('<button') || lines[i].includes('button') || lines[i].includes('<Link') || lines[i].includes('to='))) {
      // It's a button or link
      if (lines[i].includes('rounded-full')) {
        // Skip avatar, carousel dots, etc.
        if (!lines[i].includes('w-2 h-2') && !lines[i].includes('w-2.5 h-2.5') && !lines[i].includes('w-3 h-3') && !lines[i].includes('w-1.5 h-1.5')) {
          lines[i] = lines[i].replace(/rounded-full/g, 'rounded-lg');
        }
      }
    }
  }
  content = lines.join('\n');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules') walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir('./src');
