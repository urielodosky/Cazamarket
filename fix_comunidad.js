const fs = require('fs');
const f = 'src/app/comunidad/nuevo/page.tsx';
let content = fs.readFileSync(f, 'utf8');
content = content.replace(/width:\s*'100%'/g, 'boxSizing: "border-box", width: "100%"');
content = content.replace(/justifyContent:\s*'flex-end',\s*gap:\s*'16px'/g, "justifyContent: 'flex-end', flexWrap: 'wrap', gap: '16px'");
fs.writeFileSync(f, content);
console.log('Fixed comunidad nuevo');
