const fs = require('fs');
const f = 'src/app/favoritos/page.tsx';
let c = fs.readFileSync(f, 'utf8');

const button = `
          <button 
            onClick={() => router.push('/resenas')}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px 16px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              borderBottom: '2px solid transparent',
              transition: 'all 0.2s',
              marginLeft: 'auto'
            }}
          >
            ⭐ Mis Reseñas
          </button>
`;

c = c.replace(/(<\/div>\s*\{loading \?)/, button + '$1');
fs.writeFileSync(f, c);
