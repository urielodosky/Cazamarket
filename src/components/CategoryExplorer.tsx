'use client';

import Link from 'next/link';

export default function CategoryExplorer() {
  const categories = [
    {
      id: 'armas_de_fuego',
      name: 'Armas de Fuego',
      image: 'https://images.unsplash.com/photo-1595590424283-b8f1784cb2c8?q=80&w=600&auto=format&fit=crop',
      href: '/productos?categoria=Armas'
    },
    {
      id: 'caza',
      name: 'Caza',
      image: 'https://images.unsplash.com/photo-1588614959060-4d144f28b207?q=80&w=600&auto=format&fit=crop',
      href: '/productos?categoria=Caza'
    },
    {
      id: 'pesca',
      name: 'Pesca',
      image: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?q=80&w=600&auto=format&fit=crop',
      href: '/productos?categoria=Pesca'
    },
    {
      id: 'outdoor',
      name: 'Camping & Outdoor',
      image: 'https://images.unsplash.com/photo-1504280390467-3394553229b4?q=80&w=600&auto=format&fit=crop',
      href: '/productos?categoria=Outdoor'
    },
    {
      id: 'tiro',
      name: 'Tiro Deportivo',
      image: 'https://images.unsplash.com/photo-1574087114681-3091176b9766?q=80&w=600&auto=format&fit=crop',
      href: '/productos?categoria=Tiro'
    }
  ];

  return (
    <section className="category-explorer-section" style={{ width: '100%', padding: '0 var(--spacing-4)', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', margin: '0 0 var(--spacing-2) 0', color: 'var(--color-text-main)' }}>
          Tu próxima aventura empieza aquí
        </h2>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '1.1rem' }}>
          Explora el mejor equipamiento y servicios para tu pasión.
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: 'var(--spacing-4)' 
      }}>
        {categories.map((cat) => (
          <Link 
            key={cat.id} 
            href={cat.href}
            className="category-card"
            style={{
              position: 'relative',
              height: '200px',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'flex-end',
              padding: 'var(--spacing-4)',
            }}
          >
            {/* Background Image */}
            <div 
              className="category-bg"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url(${cat.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: 'transform 0.5s ease',
                zIndex: 1
              }}
            />
            {/* Overlay */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)',
                zIndex: 2
              }}
            />
            {/* Content */}
            <div style={{ position: 'relative', zIndex: 3, width: '100%' }}>
              <h3 style={{ margin: 0, color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {cat.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .category-card:hover .category-bg {
          transform: scale(1.1);
        }
        .category-card {
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .category-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.3);
        }
      `}} />
    </section>
  );
}
