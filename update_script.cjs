const fs = require('fs');

const filePath = 'src/data/blogData.ts';
let code = fs.readFileSync(filePath, 'utf8');

const updates = require('./updates.json');

for (const slug of Object.keys(updates)) {
  const { content, contentEn } = updates[slug];
  const slugRegex = new RegExp(`slug:\\s*"${slug}"[\\s\\S]*?content:\\s*\`([\\s\\S]*?)\`,\\s*contentEn:\\s*\`([\\s\\S]*?)\`\\s*}`);
  
  code = code.replace(slugRegex, (match, p1, p2) => {
    return match
      .replace(`content: \`${p1}\`,`, `content: \`${content.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`,`)
      .replace(`contentEn: \`${p2}\``, `contentEn: \`${contentEn.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\``);
  });
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Update complete!');
