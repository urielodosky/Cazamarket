import React from 'react';
import Image from 'next/image';

export default function ProductReviews({ product }: { product: any }) {
  if (!product) return null;

  return (
    <div className="pr-container">
      <h3 className="pr-title">
        Reseñas del Producto
        {product.rating > 0 && (
          <span className="pr-rating-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            {product.rating}
          </span>
        )}
      </h3>
      <p className="pr-subtitle">Lo que dicen los clientes que compraron este producto.</p>
      
      <div className="pr-list">
        {product.reviewsList && product.reviewsList.length > 0 ? (
          product.reviewsList.map((review: any) => (
            <div key={review.id} className="pr-card">
              <div className="pr-card-header">
                <div className="pr-card-user">
                  {review.buyerAvatar ? (
                    <div className="pr-avatar-container">
                      <Image 
                        src={review.buyerAvatar} 
                        alt={review.buyerName} 
                        fill
                        sizes="40px"
                        style={{ borderRadius: '50%', objectFit: 'cover' }} 
                      />
                    </div>
                  ) : (
                    <div className="pr-avatar-fallback">
                      {review.buyerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="pr-user-name">{review.buyerName}</h4>
                    <span className="pr-user-date">
                      {new Date(review.date).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="pr-stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill={star <= (review.rating || 0) ? "#FFD700" : "none"} stroke="#FFD700" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  ))}
                </div>
              </div>
              <p className="pr-comment">
                "{review.comment}"
              </p>
            </div>
          ))
        ) : (
          <div className="pr-empty">
            No hay reseñas para este producto todavía.
          </div>
        )}
      </div>
    </div>
  );
}
