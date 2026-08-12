'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { loginSudoMode } from '@/app/actions/sudoAction';
import Link from 'next/link';

export default function SudoLoginPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Ingresa la contraseña Sudo');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginSudoMode(password);
      
      if (result.success) {
        toast.success('Sudo Mode activado. Bienvenido Admin.');
        router.push('/admin');
      } else {
        toast.error(result.error || 'Error de autenticación.');
      }
    } catch (err) {
      toast.error('Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg-base)',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '400px',
        width: '100%',
        padding: '32px',
        borderRadius: '16px',
        border: '1px solid rgba(255,115,0,0.3)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <h1 style={{ color: 'var(--color-text-main)', fontSize: '1.5rem', margin: '16px 0 8px 0' }}>Sudo Mode Requerido</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Por razones de seguridad, ingresa tu segunda contraseña para acceder al panel de administración.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña Maestra..."
            style={{
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-main)',
              fontSize: '1rem',
              width: '100%',
              textAlign: 'center',
              letterSpacing: '2px'
            }}
          />
          <button 
            type="submit"
            disabled={isLoading}
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'background 0.2s ease',
              boxShadow: '0 4px 15px rgba(255, 115, 0, 0.3)'
            }}
          >
            {isLoading ? 'Verificando...' : 'Autenticar'}
          </button>
        </form>

        <div style={{ marginTop: '24px' }}>
          <Link href="/" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← Volver a CazaMarket
          </Link>
        </div>
      </div>
    </div>
  );
}
