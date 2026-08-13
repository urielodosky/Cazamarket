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
    <div className="rp-container">
      <h3 className="rp-title">
        Más de la categoría: {product.category}
      </h3>
      <p className="rp-subtitle">
        Otros productos de {product.seller?.name || 'este vendedor'} que podrían interesarte.
      </p>
      
      <div className="rp-grid">
        {product.relatedProducts.map((rel: any) => (
          <Link key={rel.id} href={`/productos/${rel.id}`} style={{ textDecoration: 'none' }}>
            <div className="rp-card">
              <div className="rp-image-container">
                <Image 
                  src={getImageUrl(rel)} 
                  alt={rel.name} 
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="rp-image"
                />
              </div>
              <div className="rp-info">
                <h4 className="rp-name">{rel.name}</h4>
                <div className="rp-price">USD {rel.price}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
