const fs = require('fs');
const files = ['src/app/mis-tiendas/nuevo-producto/page.tsx', 'src/app/mis-tiendas/nuevo-servicio/page.tsx'];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/className="col-span-full"/g, 'style={{ gridColumn: \'1 / -1\' }}');
  fs.writeFileSync(f, content);
});
console.log('Fixed col-span-full');
