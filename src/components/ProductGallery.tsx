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
    <div className="pg-container">
      <div
        className="glass-panel product-image-container pg-main-image-container"
        onMouseEnter={() => setIsHoveringImage(true)}
        onMouseLeave={() => setIsHoveringImage(false)}
      >
        {isVideo ? (
          <video
            src={activeSrc}
            controls
            className="pg-video"
          />
        ) : (
          <Image
            src={activeSrc}
            alt={product.name || 'Producto'}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="pg-main-image"
            priority={true}
            onError={() => setImgError(true)}
          />
        )}
        
        {/* Botón Anterior */}
        <button
          onClick={prevImage}
          className="pg-nav-button prev"
          style={{ opacity: isHoveringImage ? 1 : 0 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        
        {/* Botón Siguiente */}
        <button
          onClick={nextImage}
          className="pg-nav-button next"
          style={{ opacity: isHoveringImage ? 1 : 0 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      <div className="pg-thumbnails-container">
        {(product.media || (product.images || []).map((img: string) => ({ url: img, type: 'image' }))).map((m: any, idx: number) => {
          const thumbSrc = getThumbnailSrc(m, idx);
          
          return (
            <button
              key={idx}
              onClick={() => { setActiveImage(idx); setImgError(false); }}
              className={`pg-thumbnail-btn ${activeImage === idx ? 'active' : ''}`}
            >
              {(m.type === 'video' || thumbSrc.includes('.mp4') || thumbSrc.includes('.webm')) ? (
                <div style={{ width: '100%', height: '100%', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', inset: 0 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </div>
              ) : (
                <Image
                  src={thumbSrc}
                  alt={`Vista ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="pg-thumbnail-image"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  );
}
