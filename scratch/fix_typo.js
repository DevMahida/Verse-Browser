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
    } else if (file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('d:/AI-Broswer/project-ai-browser/src/components');
let totalReplaced = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  content = content.replace(/hover:bg-foreground\/\s/g, 'hover:bg-foreground/10 ');
  content = content.replace(/hover:bg-foreground\/\"/g, 'hover:bg-foreground/10\"');
  content = content.replace(/hover:bg-foreground\/'/g, 'hover:bg-foreground/10\'');
  content = content.replace(/group-hover:bg-foreground\/\"/g, 'group-hover:bg-foreground/10\"');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    totalReplaced++;
  }
});
console.log('Fixed ' + totalReplaced + ' files');
