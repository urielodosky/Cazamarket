import React from 'react';
import Image from 'next/image';

export default function ProductReviews({ product }: { product: any }) {
  if (!product) return null;

  return (
    <div style={{ marginTop: '48px', borderTop: '1px solid var(--color-border)', paddingTop: '32px' }}>
      <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        Reseñas del Producto
        {product.rating > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,215,0,0.1)', color: '#FFD700', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '1.1rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            {product.rating}
          </span>
        )}
      </h3>
      <p style={{ color: 'var(--color-text-muted)', margin: '0 0 24px 0', fontSize: '0.95rem' }}>Lo que dicen los clientes que compraron este producto.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {product.reviewsList && product.reviewsList.length > 0 ? (
          product.reviewsList.map((review: any) => (
            <div key={review.id} style={{ padding: '24px', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {review.buyerAvatar ? (
                    <div style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0 }}>
                      <Image 
                        src={review.buyerAvatar} 
                        alt={review.buyerName} 
                        fill
                        sizes="40px"
                        style={{ borderRadius: '50%', objectFit: 'cover' }} 
                      />
                    </div>
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                      {review.buyerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>{review.buyerName}</h4>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      {new Date(review.date).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill={star <= (review.rating || 0) ? "#FFD700" : "none"} stroke="#FFD700" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  ))}
                </div>
              </div>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '1rem' }}>
                "{review.comment}"
              </p>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            No hay reseñas para este producto todavía.
          </div>
        )}
      </div>
    </div>
  );
}
