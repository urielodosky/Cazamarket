'use client';
import React from 'react';
import Image from 'next/image';
import logoPng from '../../../public/logo.png';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Cargando...' }: LoadingScreenProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'var(--color-bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999, // On top of everything
    }}>
      
      {/* Logo */}
      <div style={{ marginBottom: '40px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
        <Image 
          src={logoPng}
          alt="CazaMarket Logo" 
          height={160}
          style={{ width: 'auto', objectFit: 'contain' }}  
        />
      </div>

      {/* Glowing Loading Bar */}
      <div style={{
        width: '280px',
        height: '4px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '4px',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '50%',
          background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)',
          boxShadow: '0 0 10px var(--color-primary), 0 0 20px var(--color-primary)',
          animation: 'loading-bar-slide 1.5s ease-in-out infinite'
        }}></div>
      </div>

      {/* Message */}
      <p style={{
        color: 'var(--color-text-muted)',
        fontSize: '1rem',
        fontWeight: 500,
        letterSpacing: '0.5px'
      }}>
        {message}
      </p>

      <style jsx global>{`
        @keyframes loading-bar-slide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
