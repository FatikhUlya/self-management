const fs = require('fs');

const mdPath = 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\1c8391e7-d147-455f-b5e5-46fddcf1f9e9\\.system_generated\\steps\\4885\\content.md';
const content = fs.readFileSync(mdPath, 'utf-8');

// The document has lines like "Day 1", "Day 2", etc.
const lines = content.split('\n');

const modules = [];
let currentModule = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Check if line exactly matches "Day X"
  const dayMatch = line.trim().match(/^Day\s+(\d+)$/i);
  
  if (dayMatch) {
    if (currentModule) {
      modules.push(currentModule);
    }
    currentModule = {
      title: line.trim(),
      content: '',
      order_index: parseInt(dayMatch[1], 10)
    };
  } else if (currentModule) {
    currentModule.content += line + '\n';
  }
}

// Push the last module
if (currentModule) {
  modules.push(currentModule);
}

function simpleMarkdownToHtml(md) {
  // Convert basic markdown to HTML
  let html = md;
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
  
  // Lists
  html = html.replace(/^\- (.*)/gim, '<ul><li>$1</li></ul>');
  // Merge consecutive ul lists
  html = html.replace(/<\/ul>\n<ul>/gim, '\n');
  
  // Line breaks for paragraphs (if not already wrapped in block elements)
  html = html.split('\n').map(line => {
    line = line.trim();
    if (!line) return '<br/>';
    if (line.match(/^<h|<ul|<li/)) return line;
    return `<p>${line}</p>`;
  }).join('\n');
  
  return html;
}

const processedModules = modules.map(m => ({
  ...m,
  content: simpleMarkdownToHtml(m.content)
}));

fs.writeFileSync('public/modules_data.json', JSON.stringify(processedModules, null, 2));
console.log(`Processed ${processedModules.length} modules! Saved to public/modules_data.json`);
