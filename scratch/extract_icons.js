const fs = require('fs');
const path = require('path');

const iconsToFetch = [
  'search', 'apple', 'dumbbell', 'bar-chart', 'clock', 
  'book-open', 'play-circle', 'trending-up', 'receipt', 
  'check-square', 'pen-tool', 'list'
];

const nodeModulesPath = path.join(__dirname, '../node_modules/lucide-react/dist/cjs/icons');

const results = {};

for (const icon of iconsToFetch) {
  try {
    const fileContent = fs.readFileSync(path.join(nodeModulesPath, `${icon}.js`), 'utf8');
    // Extract the arrays of path data: ["path", { "d": "..." }]
    const paths = [];
    const regex = /\[\s*["'](path|circle|rect|line|polyline|polygon)["']\s*,\s*\{\s*(.*?)\s*\}\s*\]/g;
    let match;
    while ((match = regex.exec(fileContent)) !== null) {
      const tag = match[1];
      const attrsStr = match[2];
      
      // parse attributes like "d": "...", "cx": "11"
      const attrsMatch = attrsStr.match(/["']([a-zA-Z]+)["']\s*:\s*["']([^"']+)["']/g);
      let attrString = '';
      if (attrsMatch) {
        for (const attr of attrsMatch) {
          const [key, val] = attr.split(':').map(s => s.trim().replace(/['"]/g, ''));
          attrString += ` ${key}="${val}"`;
        }
      }
      paths.push(`<${tag}${attrString} />`);
    }
    
    // Camel case the icon name
    const camelIcon = icon.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    results[camelIcon] = paths.join('');
  } catch (err) {
    console.error(`Error reading ${icon}:`, err.message);
  }
}

let output = '';
for (const [key, val] of Object.entries(results)) {
  output += `  ${key}: '${val}',\n`;
}
console.log(output);
