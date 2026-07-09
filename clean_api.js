const fs = require('fs');
const path = require('path');

const dir = './client/src/api';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex to remove:
  // onError: (err) => { message.error(...) },
  // onError: (e) => message.error(...),
  // onError: (err) => message.error(...),
  
  content = content.replace(/\s*onError:\s*\([^)]*\)\s*=>\s*\{\s*message\.error\([^)]+\);\s*\},?/g, '');
  content = content.replace(/\s*onError:\s*\([^)]*\)\s*=>\s*message\.error\([^)]+\),?/g, '');

  fs.writeFileSync(filePath, content);
});
console.log('Cleaned API hooks');
