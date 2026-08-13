import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function RelatedProducts({ product, getSellerFeature }: { product: any, getSellerFeature: (f: string) => boolean }) {
  if (!product || !getSellerFeature('categorias') || !product.relatedProducts || product.relatedProducts.length === 0) {
    return null;
  }

  // Helper para la URL de la imagen (fallback o prop)
  const getImageUrl = (rel: any) => {
    if (rel.image) return rel.image;
    if (rel.media && rel.media[0]?.url) return rel.media[0].url;
    return 'https://images.unsplash.com/photo-1542673898-7c85854b73b2?q=80&w=300&auto=format&fit=crop';
  };

  return (
    <div style={{ marginTop: '48px', borderTop: '1px solid var(--color-border)', paddingTop: '32px' }}>
      <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', color: 'var(--color-text-main)' }}>
        Más de la categoría: {product.category}
      </h3>
      <p style={{ color: 'var(--color-text-muted)', margin: '0 0 24px 0', fontSize: '0.95rem' }}>
        Otros productos de {product.seller?.name || 'este vendedor'} que podrían interesarte.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        {product.relatedProducts.map((rel: any) => (
          <Link key={rel.id} href={`/productos/${rel.id}`} style={{ textDecoration: 'none' }}>
            <div 
              style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'rgba(255,255,255,0.02)', transition: 'transform 0.2s', paddingBottom: '12px' }} 
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} 
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ position: 'relative', width: '100%', height: '160px' }}>
                <Image 
                  src={getImageUrl(rel)} 
                  alt={rel.name} 
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  style={{ objectFit: 'cover' }} 
                />
              </div>
              <div style={{ padding: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rel.name}</h4>
                <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>USD {rel.price}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
