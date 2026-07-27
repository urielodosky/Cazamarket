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
    <div className="ad-banner-container" style={{ margin: '20px auto', padding: '0 20px', maxWidth: '1200px' }}>
      
      {/* Banner Único con Imagen de Fondo */}
      <div style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        backgroundImage: 'url(https://picsum.photos/id/1018/1200/400)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '400px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '40px'
      }}>
        {/* Overlay oscuro para legibilidad */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
          zIndex: 1
        }} />
        
        {/* Contenido del Anuncio (Llamado a la acción) */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <span style={{ 
            display: 'inline-block',
            background: 'var(--primary-color)', 
            color: 'white', 
            padding: '6px 14px', 
            borderRadius: 'var(--radius-full)', 
            fontSize: '0.8rem', 
            fontWeight: 'bold',
            letterSpacing: '1px',
            marginBottom: '15px'
          }}>
            ANUNCIA AQUÍ
          </span>
          <h2 style={{ margin: '0 0 15px 0', color: 'white', fontSize: '2.5rem', fontWeight: 'bold' }}>Destaca tu Negocio</h2>
          <p style={{ margin: '0 0 25px 0', color: '#e0e0e0', fontSize: '1.2rem', maxWidth: '700px' }}>
            Paga para tener más publicidad y conseguir un anuncio personalizado visible para miles de cazadores y pescadores todos los días.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{
              display: 'inline-block',
              padding: '12px 28px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              boxShadow: '0 4px 15px rgba(220,100,0,0.4)',
              cursor: 'pointer'
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
