const fs = require('fs');
const files = ['src/app/servicios/page.tsx', 'src/app/productos/page.tsx', 'src/app/negocios/page.tsx'];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/width:\s*'100%'/g, 'boxSizing: "border-box", width: "100%"');
    fs.writeFileSync(f, content);
  }
});
console.log('Added box-sizing inline to other pages');
