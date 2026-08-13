import React, { useState } from 'react';
import Image from 'next/image';

export default function ProductGallery({ product }: { product: any }) {
  const [activeImage, setActiveImage] = useState(0);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  
  // Imagen por defecto en caso de error
  const fallbackImage = 'https://images.unsplash.com/photo-1542673898-7c85854b73b2?q=80&w=1200&auto=format&fit=crop';
  
  // Usar fallback temporal si ocurre un error con el src en next/image no está soportado nativamente igual que en <img>,
  // por lo que llevamos un estado si la imagen principal falló.
  const [imgError, setImgError] = useState(false);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product) return;
    const len = product.media ? product.media.length : (product.images ? product.images.length : 0);
    if (len === 0) return;
    setActiveImage((prev) => (prev === len - 1 ? 0 : prev + 1));
    setImgError(false);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product) return;
    const len = product.media ? product.media.length : (product.images ? product.images.length : 0);
    if (len === 0) return;
    setActiveImage((prev) => (prev === 0 ? len - 1 : prev - 1));
    setImgError(false);
  };

  const getActiveSrc = () => {
    if (imgError) return fallbackImage;
    if (product.media && product.media[activeImage]?.url) return product.media[activeImage].url;
    if (product.images && product.images[activeImage]) return product.images[activeImage];
    return fallbackImage;
  };

  const activeSrc = getActiveSrc();
  const isVideo = product.media && product.media[activeImage]?.type === 'video';
  
  const getThumbnailSrc = (m: any, idx: number) => {
     let url = fallbackImage;
     if (typeof m === 'string') url = m;
     else if (m.url) url = m.url;
     return url;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        className="glass-panel product-image-container"
        style={{ position: 'relative', padding: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onMouseEnter={() => setIsHoveringImage(true)}
        onMouseLeave={() => setIsHoveringImage(false)}
      >
        {isVideo ? (
          <video
            src={activeSrc}
            controls
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
          />
        ) : (
          <Image
            src={activeSrc}
            alt={product.name || 'Producto'}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        )}
        
        {/* Botón Anterior */}
        <button
          onClick={prevImage}
          style={{
            position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '44px', height: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            opacity: isHoveringImage ? 1 : 0, transition: 'all 0.2s', zIndex: 10
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.85)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        
        {/* Botón Siguiente */}
        <button
          onClick={nextImage}
          style={{
            position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '44px', height: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            opacity: isHoveringImage ? 1 : 0, transition: 'all 0.2s', zIndex: 10
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.85)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {(product.media || (product.images || []).map((img: string) => ({ url: img, type: 'image' }))).map((m: any, idx: number) => {
          const thumbSrc = getThumbnailSrc(m, idx);
          
          return (
            <button
              key={idx}
              onClick={() => { setActiveImage(idx); setImgError(false); }}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: activeImage === idx ? '2px solid var(--color-primary)' : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: activeImage === idx ? '0 0 12px color-mix(in srgb, var(--color-primary) 40%, transparent)' : 'none',
                cursor: 'pointer',
                padding: 0,
                background: 'rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <Image
                src={thumbSrc}
                alt={`Vista ${idx + 1}`}
                fill
                sizes="80px"
                style={{ objectFit: 'cover' }}
              />
            </button>
          )
        })}
      </div>
    </div>
  );
}
