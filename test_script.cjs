const fs = require('fs');
const execSync = require('child_process').execSync;
const allLines = fs.readFileSync('src/data/blogData.ts', 'utf8').split('\n');

for (let i = 100; i < 2000; i+=50) {
  const code = allLines.slice(0, i).join('\n') + '\n];';
  fs.writeFileSync('temp3.ts', code);
  try {
     execSync('npx tsc temp3.ts --noEmit', {stdio: 'ignore'});
     console.log('Passed up to line ' + i);
  } catch (e) {
     console.log('FAILED at line ' + i);
     break;
  }
}
