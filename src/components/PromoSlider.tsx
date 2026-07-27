'use client';

import { useState } from 'react';

export default function PromoSlider() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="ad-banner-container" style={{ margin: '20px 0', padding: '0 20px' }}>
      <div 
        className="ad-banner" 
        style={{
          background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(220,100,0,0.1) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '15px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <span style={{ 
          background: 'var(--primary-color)', 
          color: 'white', 
          padding: '4px 10px', 
          borderRadius: 'var(--radius-full)', 
          fontSize: '0.75rem', 
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}>
          ANUNCIA AQUÍ
        </span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0' }}>Destaca tu Negocio</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0' }}>
          Paga para tener más publicidad y conseguir un anuncio personalizado visible para miles de cazadores y pescadores.
        </p>
        <button 
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
          style={{ 
            marginTop: '10px',
            padding: '12px 24px', 
            borderRadius: 'var(--radius-full)', 
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(220,100,0,0.3)'
          }}
        >
          Ver Planes de Publicidad
        </button>
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'var(--bg-color)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '600px',
            padding: '30px',
            position: 'relative',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>Planes de Publicidad</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{
                border: '2px solid var(--primary-color)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: 'var(--primary-color)' }}>Aparición Semanal</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Tu anuncio personalizado aparecerá destacado 1 vez por semana.</p>
                </div>
                <button className="btn btn-primary" onClick={() => alert('Próximamente integración de pago')}>
                  Seleccionar
                </button>
              </div>

              <div style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px',
                background: 'var(--card-bg)'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>Aparición Mensual</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Ideal para mantener presencia. Aparece 1 vez por mes.</p>
                </div>
                <button className="btn btn-outline" onClick={() => alert('Próximamente integración de pago')}>
                  Seleccionar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
