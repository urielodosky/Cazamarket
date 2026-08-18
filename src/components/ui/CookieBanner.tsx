'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import posthog from 'posthog-js';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Solo si el usuario explícitamente aceptó ('true') ocultamos el banner.
    // Si no hay valor o fue rechazado previamente (y limpiado), se muestra.
    const hasAccepted = localStorage.getItem('cazamarket_cookies_accepted');
    if (hasAccepted !== 'true') {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cazamarket_cookies_accepted', 'true');
    posthog.opt_in_capturing();
    setShowBanner(false);
  };

  const handleReject = () => {
    // Si rechaza, borramos cualquier rastro previo para que en la próxima
    // visita (reload) vuelva a preguntar, pero lo ocultamos por ahora.
    localStorage.removeItem('cazamarket_cookies_accepted');
    posthog.opt_out_capturing();
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '16px',
      right: '16px',
      background: 'var(--color-bg-surface)',
      border: '1px solid var(--color-border)',
      padding: '16px 24px',
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-main)', lineHeight: 1.5 }}>
          Utilizamos cookies para mejorar la experiencia de navegación en nuestra plataforma.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleReject}
          style={{
            background: 'transparent',
            color: 'var(--color-text-main)',
            border: '1px solid var(--color-border)',
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Rechazar
        </button>
        <button
          onClick={handleAccept}
          style={{
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            padding: '10px 24px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
