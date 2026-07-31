const fs = require('fs');
const path = require('path');

const iconFile = fs.readFileSync(path.join(__dirname, '../src/components/ui/Icon.tsx'), 'utf8');
const iconPathsMatch = iconFile.match(/ICON_PATHS[^\{]+\{([\s\S]+?)\};/);
const definedIcons = [];
if (iconPathsMatch) {
  const lines = iconPathsMatch[1].split('\n');
  for (const line of lines) {
    const m = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
    if (m) definedIcons.push(m[1]);
  }
}

const usedIcons = new Set();
function findIcons(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findIcons(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const regex = /<Icon[^>]+name=["']([^"']+)["']/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        usedIcons.add(match[1]);
      }
      
      // Also look for icon: 'name' in constants
      const regex2 = /icon:\s*['"]([^'"]+)['"]/g;
      while ((match = regex2.exec(content)) !== null) {
        usedIcons.add(match[1]);
      }
    }
  }
}

findIcons(path.join(__dirname, '../src'));

const missingIcons = Array.from(usedIcons).filter(icon => !definedIcons.includes(icon) && !icon.includes('{'));
console.log('Defined icons:', definedIcons.join(', '));
console.log('Missing icons used in code:', missingIcons.join(', '));
