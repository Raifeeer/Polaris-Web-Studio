const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

// I should check if Invoice type in src/types.ts is restricting status to 'paid' | 'pending'.
// If it is, I should add 'void'.
