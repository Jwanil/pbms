const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./client/src');
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Regex to match:
  // if (!err?.response?.data?.errors?.length) {
  //   message.error(...)
  // }
  // with variable whitespace/newlines
  const regex = /if\s*\(\s*!err\?\.response\?\.data\?\.errors\?\.length\s*\)\s*\{\s*message\.error\([^)]+\);\s*\}/g;
  
  content = content.replace(regex, '');

  if (content !== original) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log("Cleaned:", file);
  }
});

console.log('Cleaned ' + changedFiles + ' files.');
