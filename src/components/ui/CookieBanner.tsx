'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem('cazamarket_cookies_accepted');
    if (!hasAccepted) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cazamarket_cookies_accepted', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      right: '16px',
      background: 'var(--color-bg-elevated)',
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
          Utilizamos cookies para mejorar tu experiencia en nuestra plataforma. Al continuar navegando, aceptas nuestra{' '}
          <Link href="/politica-de-privacidad" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
            Política de Privacidad
          </Link>.
        </p>
      </div>
      <div>
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
