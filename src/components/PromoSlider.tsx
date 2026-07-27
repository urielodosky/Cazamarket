'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Dummy data (en un escenario real vendría de una API o base de datos)
const RAW_BANNER_DATA = [
  {
    id: 1,
    title: 'Armería El Cazador',
    description: '20% de descuento en toda la indumentaria de camuflaje. ¡Solo por hoy!',
    badge: 'Patrocinado',
    image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1200&auto=format&fit=crop',
    link: '/negocios/armeria-el-cazador',
    buttonText: 'Ver Oferta'
  },
  {
    id: 2,
    title: 'Coto de Caza La Estrella',
    description: 'Reserva tu fin de semana con pensión completa al mejor precio. Guías expertos disponibles.',
    badge: 'Patrocinado',
    image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1200&auto=format&fit=crop',
    link: '/servicios/coto-la-estrella',
    buttonText: 'Más Información'
  },
  {
    id: 3,
    title: 'Camping del Valle',
    description: 'Todo lo que necesitas para tu próxima aventura al aire libre. Envíos a todo el país.',
    badge: 'Destacado',
    image: 'https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?q=80&w=1200&auto=format&fit=crop',
    link: '/negocios/camping-del-valle',
    buttonText: 'Explorar Catálogo'
  }
];

// Limitar a máximo 10
let BANNER_DATA = RAW_BANNER_DATA.slice(0, 10);

// Fallback por defecto si no hay banners
if (BANNER_DATA.length === 0) {
  BANNER_DATA = [{
    id: 0,
    title: 'Bienvenido a CazaMarket',
    description: 'La comunidad más grande de cazadores, pescadores y amantes del campo. Explora, conecta y equipa tu próxima aventura.',
    badge: 'Comunidad',
    image: 'https://images.unsplash.com/photo-1542673898-7c85854b73b2?q=80&w=1200&auto=format&fit=crop',
    link: '/registro',
    buttonText: 'Únete Ahora'
  }];
}

export default function PromoSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNER_DATA.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % BANNER_DATA.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + BANNER_DATA.length) % BANNER_DATA.length);
  };

  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) {
      nextSlide();
    }
    if (distance < -50) {
      prevSlide();
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="promo-slider-container"
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
         onTouchEnd={handleTouchEnd}
         style={{ touchAction: 'pan-y' }}>
      <div 
        className="promo-slider-track"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {BANNER_DATA.map((banner) => (
          <div key={banner.id} className="promo-slide">
            <div className="promo-banner glass-panel" style={{ height: '380px' }}>
              <div className="promo-content">
                <span className="promo-badge">{banner.badge}</span>
                <h3>{banner.title}</h3>
                <p>{banner.description}</p>
                <Link href={banner.link} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '1rem', marginTop: '20px', display: 'inline-block' }}>
                  {banner.buttonText}
                </Link>
              </div>
              <div className="promo-image" style={{ backgroundImage: `url(${banner.image})` }}></div>
            </div>
          </div>
        ))}
      </div>

      <button className="slider-arrow slider-arrow-left" onClick={prevSlide} aria-label="Previous slide">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <button className="slider-arrow slider-arrow-right" onClick={nextSlide} aria-label="Next slide">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>

      <div className="slider-controls">
        {BANNER_DATA.map((_, index) => (
          <button
            key={index}
            className={`slider-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
