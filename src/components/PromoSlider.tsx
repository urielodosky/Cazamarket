'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import AdCampaignModal from './AdCampaignModal';

// Anuncios de ejemplo (en producción vendrían de la DB)
const DEMO_ADS: any[] = [];

export default function PromoSlider() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // All slides: demo ads first, then the CTA slide at the end
  const totalSlides = DEMO_ADS.length + 1; // +1 for CTA slide

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-advance every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(timer);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  };

  const isCtaSlide = currentSlide === DEMO_ADS.length;

  return (
    <div className="ad-banner-container" style={{ padding: '0 var(--spacing-4)', width: '100%' }}>
      
      {/* Slider with external arrows */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Left Arrow */}
        {totalSlides > 1 && (
          <button
            onClick={prevSlide}
            aria-label="Anterior"
            style={{
              flexShrink: 0,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        )}

        {/* Slider Container */}
        <div style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          minHeight: '60vh',
          boxShadow: 'var(--shadow-md)',
          flex: 1,
        }}>

          {/* Slides */}
          {DEMO_ADS.map((ad, index) => (
            <div key={ad.id} style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: `url(${ad.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '32px',
              opacity: currentSlide === index ? 1 : 0,
              transition: 'opacity 0.6s ease-in-out',
              pointerEvents: currentSlide === index ? 'auto' : 'none',
            }}>
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.1) 100%)',
                zIndex: 1
              }} />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <span style={{ 
                  display: 'inline-block',
                  background: 'var(--color-primary)', 
                  color: 'white', 
                  padding: '6px 14px', 
                  borderRadius: 'var(--radius-full)', 
                  fontSize: '0.8rem', 
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  marginBottom: '12px'
                }}>
                  {ad.badge}
                </span>
                <h2 style={{ margin: '0 0 12px 0', color: '#FFFFFF', fontSize: '2.5rem', fontWeight: 'bold', lineHeight: '1.2' }}>{ad.title}</h2>
                <p style={{ margin: '0 0 24px 0', color: '#F3F4F6', fontSize: '1.1rem', maxWidth: '550px', lineHeight: '1.5' }}>
                  {ad.description}
                </p>
                <Link 
                  href={ad.link}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '12px 28px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    background: 'var(--color-primary)',
                    color: 'white',
                    textDecoration: 'none',
                    boxShadow: '0 4px 15px rgba(220,100,0,0.4)',
                  }}
                >
                  Ver más
                </Link>
              </div>
            </div>
          ))}

          {/* CTA Slide - Anuncia Aquí (last slide) */}
          <div style={{
            position: isCtaSlide ? 'relative' : 'absolute',
            top: 0, left: 0, right: 0, bottom: isCtaSlide ? undefined : 0,
            backgroundImage: 'url(https://picsum.photos/id/1018/1200/400)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '32px',
            opacity: isCtaSlide ? 1 : 0,
            transition: 'opacity 0.6s ease-in-out',
            pointerEvents: isCtaSlide ? 'auto' : 'none',
          }}>
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.1) 100%)',
              zIndex: 1
            }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <span style={{ 
                display: 'inline-block',
                background: 'var(--color-primary)', 
                color: 'white', 
                padding: '8px 16px', 
                borderRadius: 'var(--radius-full)', 
                fontSize: '0.875rem', 
                fontWeight: 'bold',
                letterSpacing: '1px',
                marginBottom: '16px'
              }}>
                ANUNCIA AQUÍ
              </span>
              <h1 style={{ margin: '0 0 16px 0', color: '#FFFFFF', fontSize: '3rem', fontWeight: 'bold', lineHeight: '1.2' }}>Haz crecer tu negocio</h1>
              <p style={{ margin: '0 0 32px 0', color: '#F3F4F6', fontSize: '1.25rem', maxWidth: '600px', lineHeight: '1.5' }}>
                Llega a miles de pescadores y cazadores cada día. Destaca tu marca con nuestros anuncios personalizados y aumenta tus ventas.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 32px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                  boxShadow: '0 4px 15px rgba(220,100,0,0.4)',
                  cursor: 'pointer',
                  minHeight: '44px',
                  minWidth: '44px'
                }}
              >
                Ver Planes de Publicidad
              </button>
            </div>
          </div>

          {/* Dot Indicators */}
          {totalSlides > 1 && (
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              display: 'flex',
              gap: '6px',
            }}>
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                  style={{
                    width: '8px',
                    height: '8px',
                    minWidth: 0,
                    minHeight: 0,
                    borderRadius: '50%',
                    background: currentSlide === i ? 'var(--color-primary)' : 'rgba(255,255,255,0.4)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          )}

        </div>

        {/* Right Arrow */}
        {totalSlides > 1 && (
          <button
            onClick={nextSlide}
            aria-label="Siguiente"
            style={{
              flexShrink: 0,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        )}

      </div>

      {/* Modal de Planes / Personalización */}
      <AdCampaignModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
