'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import './not-found.css'; // Reusing not-found styles for consistency

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error('Unhandled App Router Error:', error);
  }, [error]);

  return (
    <div className="not-found-container">
      <h1 style={{ fontSize: '4rem', marginBottom: '20px', color: '#ff4d4d' }}>¡Algo salió mal!</h1>
      <h2>Ha ocurrido un error inesperado.</h2>
      <p>Lo sentimos, no pudimos cargar esta página debido a un problema técnico. Por favor, intenta de nuevo o vuelve al inicio.</p>
      
      <div className="not-found-actions">
        <button 
          onClick={() => reset()} 
          className="btn-404 btn-404-primary"
          style={{ backgroundColor: '#ff4d4d' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.67-2.36"/>
          </svg>
          Reintentar
        </button>
        
        <Link href="/" className="btn-404 btn-404-outline">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
