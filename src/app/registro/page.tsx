'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import './registro.css';

export default function RegistroPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoginView, setIsLoginView] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLoginView) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          router.push('/');
        }
      } else {
        if (!termsAccepted) {
          setErrorMsg('Debes aceptar los Términos y Condiciones para crear tu cuenta.');
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
              avatar_url: ''
            }
          }
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          if (data?.session) {
            // Ya está logueado (si el email confirm está desactivado)
            router.push('/configuracion');
          } else {
            setSuccessMsg('¡Cuenta creada! Por favor revisa tu bandeja de entrada para verificar tu correo electrónico.');
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <h1>{isLoginView ? 'Inicia sesión' : 'Crea tu cuenta'} en CazaMarket</h1>
          <p>
            {isLoginView 
              ? 'Bienvenido de nuevo cazador. Ingresa a tu cuenta.' 
              : 'Únete a la comunidad más grande de caza y pesca.'}
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(255,50,50,0.1)', color: '#ff4444', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
            {errorMsg}
          </div>
        )}
        
        {successMsg && (
          <div style={{ background: 'rgba(50,255,50,0.1)', color: '#4CAF50', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
            {successMsg}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input 
              type="email" 
              id="email" 
              placeholder="tu@correo.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                id="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                style={{ paddingRight: '40px' }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '10px', 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
            {isLoginView && (
              <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <a href="#" className="auth-link" style={{ fontSize: '0.85rem' }}>¿Olvidaste tu contraseña?</a>
              </div>
            )}
          </div>
          
          {!isLoginView && (
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <input 
                type="checkbox" 
                id="terms" 
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ width: 'auto', margin: 0, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
              />
              <label htmlFor="terms" style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 'normal' }}>
                Acepto los <a href="#" className="auth-link">Términos y Condiciones</a> y la <a href="#" className="auth-link">Política de Privacidad</a>
              </label>
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? 'Cargando...' : (isLoginView ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLoginView ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}{' '}
            <button 
              className="auth-link" 
              onClick={() => {
                setIsLoginView(!isLoginView);
                setErrorMsg('');
                setSuccessMsg('');
              }}
            >
              {isLoginView ? 'Regístrate aquí' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
