import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (filePath.endsWith('.tsx')) {
            results.push(filePath);
        }
    });
    return results;
}

const files = walk('./src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // find glass-panel + hover
    const regex = /className=["']([^"']*glass-panel[^"']*hover:[^"']*)["']/g;
    content = content.replace(regex, (match, cls) => {
        if (!cls.includes('will-change-transform')) {
            return `className="${cls} will-change-transform transition-all"`;
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Added will-change-transform to', file);
    }
});
