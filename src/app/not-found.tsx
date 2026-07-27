'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './not-found.css';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="not-found-container">
      <h1>404</h1>
      <h2>Página no encontrada</h2>
      <p>Lo sentimos, no pudimos encontrar la página que estás buscando. Es posible que haya sido eliminada o que el enlace sea incorrecto.</p>
      
      <div className="not-found-actions">
        <button 
          onClick={() => router.back()} 
          className="btn-404 btn-404-outline"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Volver atrás
        </button>
        
        <Link href="/" className="btn-404 btn-404-primary">
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
