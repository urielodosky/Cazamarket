const fs = require('fs');
const f = 'src/components/layout/UserMenu.tsx';
let content = fs.readFileSync(f, 'utf8');

const regexes = {
  favoritos: /<Link href="\/favoritos" className="dropdown-item"[\s\S]*?<span>Favoritos<\/span>\s*<\/Link>/,
  resenas: /<Link href="\/resenas" className="dropdown-item"[\s\S]*?<span>Reseñas<\/span>\s*<\/Link>/,
  ayuda: /<Link href="\/ayuda" className="dropdown-item"[\s\S]*?<span>Ayuda e Información<\/span>\s*<\/Link>/,
  configuracion: /<Link href="\/configuracion" className="dropdown-item"[\s\S]*?<span>Configuración<\/span>\s*<\/Link>/,
  planes: /<Link href="\/planes" className="dropdown-item desktop-hidden"[\s\S]*?<span>Planes<\/span>\s*<\/Link>/,
  carrito: /<Link href="\/carrito" className="dropdown-item"[\s\S]*?<span>Mi carrito<\/span>\s*<\/Link>/,
  mensajes: /<Link href="\/mensajes" className="dropdown-item"[\s\S]*?<span>Mensajes<\/span>\s*<\/Link>/
};

let extracted = {};
for (const key in regexes) {
  const match = content.match(regexes[key]);
  if (match) {
    extracted[key] = match[0];
    content = content.replace(match[0], '');
  }
}

const order = [
  extracted.favoritos,
  extracted.carrito,
  extracted.mensajes,
  extracted.planes,
  extracted.resenas,
  extracted.ayuda,
  extracted.configuracion
].filter(Boolean).join('\n\n              ');

// Insert after the Configurar Negocio block or toggle vendor block
content = content.replace(/(<\/svg>\s*<span>Configurar negocio<\/span>\s*<\/Link>\s*<\/>\s*})/, '$1\n\n              ' + order);

fs.writeFileSync(f, content);
console.log('Reordered');
