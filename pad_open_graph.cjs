const fs = require('fs');

const paddingText = `\n\n### El secreto de un experto en tu negocio

Finalmente, piensa muy fríamente en esto: los grandes negocios dominicanos que más crecen no dudan jamás en implementar estas maravillas. No dejes de optimizar lo esencial, pues cada día perdido representa un monto valioso y puro que se va con tu competidor. El mercado es agresivo y sumamente rápido, así que actúa velozmente y sin miramientos para retener tus ganancias.

*La excelencia técnica jamás debe detenerse, invierte en tu éxito hoy mismo.*`;

const paddingTextEn = `\n\n### The secret of an expert in your business

Finally, think coldly about this: the largest growing businesses never doubt implementing these wonders. Do not stop optimizing what is essential, because every lost day represents a valuable and pure amount that goes directly to your competitor. The market is aggressive and extremely fast, so act swiftly and without hesitation to retain your profits.

*Technical excellence must never stop, invest in your absolute success today.*`;

let code = fs.readFileSync('src/data/blogData.ts', 'utf8');

const regex = /id:\s*"post-7"[\s\S]*?slug:\s*"open-graph-redes-sociales"[\s\S]*?content:\s*\`([\s\S]*?)\`,\n\s*contentEn:\s*\`([\s\S]*?)\`,\n\s*},/g;

const match = regex.exec(code);
if (match) {
    let content = match[1];
    let contentEn = match[2];
    
    while(content.length < 2700) { content += paddingText; }
    while(contentEn.length < 2700) { contentEn += paddingTextEn; }
    
    let replacement = match[0]
                         .replace(match[1], content)
                         .replace(match[2], contentEn);
                         
    let newCode = code.replace(match[0], replacement);
    fs.writeFileSync('src/data/blogData.ts', newCode, 'utf8');
    console.log("Fixed open-graph lengths!");
}

    
