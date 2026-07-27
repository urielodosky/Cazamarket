const fs = require('fs');
const content = fs.readFileSync('src/app/mis-tiendas/nuevo-producto/page.tsx', 'utf8');

const openDivs = (content.match(/<div[\s>]/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;

console.log("Total Open divs:", openDivs);
console.log("Total Close divs:", closeDivs);
