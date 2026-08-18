'use client';

import React, { useState, useEffect } from 'react';

export default function ScrollNavigation() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate progress
      const totalScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${(totalScroll / windowHeight) * 100}%`;
      
      setScrollProgress(totalScroll / windowHeight * 100);

      // Show back to top button after 500px
      if (totalScroll > 500) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {/* Scroll Progress Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '3px',
        background: 'transparent',
        zIndex: 10000,
        pointerEvents: 'none'
      }}>
        <div style={{
          height: '100%',
          background: 'var(--color-primary)',
          width: `${scrollProgress}%`,
          transition: 'width 0.1s ease-out'
        }} />
      </div>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        aria-label="Volver arriba"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px', // Placed on the left to not collide with WhatsApp FAB on the right
          width: '50px',
          height: '50px',
          background: 'var(--color-bg-surface-elevated)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-main)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          opacity: showBackToTop ? 1 : 0,
          visibility: showBackToTop ? 'visible' : 'hidden',
          transform: showBackToTop ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.3s ease',
          zIndex: 9998,
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'var(--color-primary)';
          e.currentTarget.style.color = 'white';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'var(--color-bg-surface-elevated)';
          e.currentTarget.style.color = 'var(--color-text-main)';
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
      </button>
    </>
  );
}
