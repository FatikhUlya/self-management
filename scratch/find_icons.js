const fs = require('fs');
const path = require('path');

function findIcons(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findIcons(fullPath);
    } else if (file === 'page.tsx') {
      const content = fs.readFileSync(fullPath, 'utf8');
      const regex = /<button className="w-10 h-10 rounded-full[^>]*>\s*<Icon name="([^"]+)"/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        console.log(`${fullPath}: ${match[1]}`);
      }
    }
  }
}

findIcons(path.join(__dirname, '../src/app'));
