const fs = require('fs');
let code = fs.readFileSync('src/data/blogData.ts', 'utf8');

const paddingText = `\n\n### El secreto de un experto en tu negocio\n\nFinalmente, piensa muy fríamente en esto: los grandes negocios dominicanos que más crecen no dudan jamás en implementar estas maravillas. No dejes de optimizar lo esencial, pues cada día perdido representa un monto valioso y puro que se va con tu competidor. El mercado es agresivo y sumamente rápido, así que actúa velozmente y sin miramientos para retener tus ganancias.\n\n*La excelencia técnica jamás debe detenerse, invierte en tu éxito hoy mismo.*`;

const paddingTextEn = `\n\n### The secret of an expert in your business\n\nFinally, think coldly about this: the largest growing businesses never doubt implementing these wonders. Do not stop optimizing what is essential, because every lost day represents a valuable and pure amount that goes directly to your competitor. The market is aggressive and extremely fast, so act swiftly and without hesitation to retain your profits.\n\n*Technical excellence must never stop, invest in your absolute success today.*`;

const target1 = `*Un enlace es una puerta hacia tu negocio; asegúrate de que la fachada invite a los clientes a entrar, no a pasar de largo.*`;
const replacement1 = target1 + paddingText;

const target2 = `*A link is a door to your business; make sure the facade invites customers to enter, not to walk right past.*`;
const replacement2 = target2 + paddingTextEn;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);

fs.writeFileSync('src/data/blogData.ts', code, 'utf8');
console.log('Replaced perfectly');
