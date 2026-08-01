'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import AdCampaignModal from './AdCampaignModal';

export default function PromoSlider() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="ad-banner-container" style={{ margin: '32px auto 80px', padding: '0 16px', maxWidth: '1200px' }}>
      
      {/* Banner Único con Imagen de Fondo */}
      <div style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        backgroundImage: 'url(https://picsum.photos/id/1018/1200/400)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '60vh', /* Ensure it takes up a good portion of screen but keeps CTA visible */
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '32px'
      }}>
        {/* Overlay oscuro para legibilidad */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.1) 100%)',
          zIndex: 1
        }} />
        
        {/* Contenido del Anuncio (Llamado a la acción) */}
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

      {/* Modal de Planes / Personalización */}
      <AdCampaignModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
