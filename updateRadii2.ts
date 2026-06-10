import fs from 'fs';
import path from 'path';

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  let lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('rounded-full')) {
      // Keep rounded-full ONLY for: avatar/profile circles, rating dots, spinner, animated ping dot on availability badges.
      // Those elements typically have explicit width/height like w-X and h-X or are inside SVG.
      const isSpinner = lines[i].includes('animate-spin');
      const isCarouselOrDot = lines[i].includes('w-1.5 h-1.5') || lines[i].includes('w-2 h-2') || lines[i].includes('w-2.5 h-2.5') || lines[i].includes('w-3 h-3');
      const isAvatarOrCircle = lines[i].includes('w-12 h-12') || lines[i].includes('w-16 h-16') || lines[i].includes('w-20 h-20') || lines[i].includes('w-24 h-24') || lines[i].includes('w-8 h-8') || lines[i].includes('img');
      const isPingDot = lines[i].includes('w-5 h-5') && (lines[i].includes('shrink-0') || lines[i].includes('bg-white') || lines[i].includes('animate-ping') || lines[i].includes('border-2') || lines[i].includes('border-white'));
      const isBlurryBackgroundCircle = lines[i].includes('blur-') && lines[i].includes('pointer-events-none');
      const isCustomBgBadgeCircle = lines[i].includes('w-10 h-10') && lines[i].includes('flex items-center');

      if (!isSpinner && !isCarouselOrDot && !isAvatarOrCircle && !isPingDot && !isBlurryBackgroundCircle && !isCustomBgBadgeCircle) {
        lines[i] = lines[i].replace(/rounded-full/g, 'rounded-lg');
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
