const fs = require('fs');
const files = ['src/app/mis-tiendas/nuevo-producto/page.tsx', 'src/app/mis-tiendas/nuevo-servicio/page.tsx'];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/width:\s*'100%'/g, 'boxSizing: "border-box", width: "100%"');
  fs.writeFileSync(f, content);
});
console.log('Added box-sizing inline');
