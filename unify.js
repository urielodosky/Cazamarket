const fs = require('fs');
const path = 'src/components/layout/UserMenu.tsx';
let content = fs.readFileSync(path, 'utf8');

// Eliminar el link de Favoritos actual
content = content.replace(/<Link href="\/favoritos" className="dropdown-item"[\s\S]*?<span>Favoritos<\/span>\s*<\/Link>/, '');

// Reemplazar el de Reseñas por el unificado
const unifiedLink = `<Link href="/favoritos" className="dropdown-item" onClick={() => setIsOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span>Favoritos y Reseñas</span>
              </Link>`;

content = content.replace(/<Link href="\/resenas" className="dropdown-item"[\s\S]*?<span>Reseñas<\/span>\s*<\/Link>/, unifiedLink);

fs.writeFileSync(path, content.replace(/\n\s*\n\s*\n/g, '\n\n'));
console.log('Links unified');
