const fs = require('fs');
const html = fs.readFileSync('accountchooser.html', 'utf8');

const emailMatch = html.match(/"([^"]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})"/);
const picMatch = html.match(/(https:\/\/lh3\.googleusercontent\.com\/[a-zA-Z0-9_/\-+=~.?&]+)/);
const nameMatch = html.match(/Google Account:\s*([^(\n]+?)\s*\(/);

console.log("Email:", emailMatch ? emailMatch[1] : null);
console.log("Pic:", picMatch ? picMatch[1] : null);
console.log("Name:", nameMatch ? nameMatch[1] : null);
