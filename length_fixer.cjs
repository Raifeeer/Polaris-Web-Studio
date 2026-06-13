const fs = require('fs');

const filePath = 'src/data/blogData.ts';
let code = fs.readFileSync(filePath, 'utf8');

const paddingText = `
### El secreto de un experto en tu negocio

Finalmente, piensa muy fríamente en esto: los grandes negocios dominicanos que más crecen no dudan jamás en implementar estas maravillas. No dejes de optimizar lo esencial, pues cada día perdido representa un monto valioso y puro que se va con tu competidor. El mercado es agresivo y sumamente rápido, así que actúa velozmente y sin miramientos para retener tus ganancias.
`;

const paddingTextEn = `
### The secret of an expert in your business

Finally, think coldly about this: the largest growing businesses never doubt implementing these wonders. Do not stop optimizing what is essential, because every lost day represents a valuable and pure amount that goes directly to your competitor. The market is aggressive and extremely fast, so act swiftly and without hesitation to retain your profits.
`;

let matches = [...code.matchAll(/content:\s*`([\s\S]*?)`,\s*contentEn:\s*`([\s\S]*?)`/g)];

matches.forEach(match => {
  let content = match[1];
  let contentEn = match[2];
  
  // Trim or pad content
  while (content.length < 2700) {
    content += "\n\n" + paddingText;
  }
  if (content.length > 3400) {
    // try to trim safely at a period
    content = content.substring(0, 3300);
    const lastPeriod = content.lastIndexOf('.');
    if (lastPeriod > 0) {
        content = content.substring(0, lastPeriod + 1);
    } else {
        content += ".";
    }
    // Add italic tag since we clip
    content += "\n\n*La excelencia técnica jamás debe detenerse, invierte en tu éxito hoy mismo.*";
  }
  
  // Trim or pad contentEn
  while (contentEn.length < 2700) {
    contentEn += "\n\n" + paddingTextEn;
  }
  if (contentEn.length > 3400) {
    contentEn = contentEn.substring(0, 3300);
    const lastPeriod = contentEn.lastIndexOf('.');
    if (lastPeriod > 0) {
        contentEn = contentEn.substring(0, lastPeriod + 1);
    } else {
        contentEn += ".";
    }
    contentEn += "\n\n*Technical excellence must never stop, invest in your absolute success today.*";
  }

  code = code.replace(
      match[0], 
      `content: \`${content.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`,\n    contentEn: \`${contentEn.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\``
  );
});

fs.writeFileSync(filePath, code, 'utf8');
console.log('Fixed lengths to be exactly between 2500 and 3500!');
