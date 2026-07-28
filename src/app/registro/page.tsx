'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  
  // Nombres y OTP
  const [username, setUsername] = useState('');
  const [personType, setPersonType] = useState('Física');
  const [cuit, setCuit] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [isAwaitingOTP, setIsAwaitingOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendCount, setResendCount] = useState(0);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleResendOTP = async () => {
    if (resendCount >= 3 || resendTimer > 0) return;
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('¡Código reenviado! Revisa tu bandeja de entrada o spam.');
        setResendCount(prev => prev + 1);
        setResendTimer(120);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al reenviar el código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup'
      });

      if (error) {
        if (error.message.includes('Token has expired or is invalid')) {
          setErrorMsg('El código ingresado es incorrecto o ha expirado. Por favor, verifica tu correo.');
        } else {
          setErrorMsg(error.message);
        }
      } else {
        // Limpiar datos locales viejos
        localStorage.removeItem('cazamarket_plan_tier_productos');
        localStorage.removeItem('cazamarket_plan_tier_servicios');
        localStorage.removeItem('cazamarket_plan_tier');
        localStorage.removeItem('cazamarket_plan_category');
        localStorage.removeItem('cazamarket_profile');
        localStorage.removeItem('cazamarket_vendor_mode');
        
        router.push('/configuracion');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inesperado al verificar');
    } finally {
      setIsLoading(false);
    }
  };

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

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password,
            username,
            person_type: personType,
            cuit,
            birth_date: birthDate,
            phone,
            contact_email: email // We'll just use the auth email initially
          })
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          setErrorMsg(data.error || 'Error al crear la cuenta');
        } else {
          if (data.data?.session) {
            // Limpiar datos locales viejos
            localStorage.removeItem('cazamarket_plan_tier_productos');
            localStorage.removeItem('cazamarket_plan_tier_servicios');
            localStorage.removeItem('cazamarket_plan_tier');
            localStorage.removeItem('cazamarket_plan_category');
            localStorage.removeItem('cazamarket_profile');
            localStorage.removeItem('cazamarket_vendor_mode');
            
            router.push('/configuracion');
          } else {
            setIsAwaitingOTP(true);
            setSuccessMsg('¡Código enviado! Revisa tu bandeja de entrada o spam.');
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '8px' }}>
            {isAwaitingOTP && (
              <button
                type="button"
                onClick={() => { setIsAwaitingOTP(false); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  position: 'absolute',
                  left: '0',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                title="Volver al registro"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
            )}
            <h1 style={{ margin: 0, fontSize: '1.4rem' }}>{isAwaitingOTP ? 'Verificación' : isLoginView ? 'Inicia sesión' : 'Crea tu cuenta'}</h1>
          </div>
          <p>
            {isAwaitingOTP 
              ? 'Ingresa el código de 6 dígitos que te enviamos.'
              : isLoginView 
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

        <form className="auth-form" onSubmit={isAwaitingOTP ? handleVerifyOTP : handleSubmit}>
          {isAwaitingOTP ? (
            <div className="form-group">
              <label htmlFor="otpCode">Código de verificación</label>
              <input 
                type="text" 
                id="otpCode" 
                placeholder="Ej: 123456" 
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                required 
                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px' }}
              />
            </div>
          ) : (
            <>
              {!isLoginView && (
                <>
                  <div className="form-group">
                    <label htmlFor="username">Nombre de usuario</label>
                    <input 
                      type="text" 
                      id="username" 
                      placeholder="Ej: CazadorPro" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      minLength={3}
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="personType">Tipo de Persona</label>
                    <select 
                      id="personType"
                      value={personType}
                      onChange={(e) => setPersonType(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                    >
                      <option value="Física">Persona Física</option>
                      <option value="Jurídica">Persona Jurídica (Empresa)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="cuit">{personType === 'Física' ? 'CUIT / CUIL / DNI' : 'CUIT'}</label>
                    <input 
                      type="text" 
                      id="cuit" 
                      placeholder={personType === 'Física' ? "Sin guiones ni espacios" : "Ej: 30-12345678-9"} 
                      value={cuit}
                      onChange={(e) => setCuit(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="birthDate">Fecha de Nacimiento</label>
                    <input 
                      type="date" 
                      id="birthDate" 
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      required 
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '1rem',
                        outline: 'none',
                        colorScheme: 'dark'
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Teléfono de Contacto</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      placeholder="Ej: +54 9 11 1234-5678" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required 
                    />
                  </div>
                </>
              )}
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
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
              <div 
                className="custom-checkbox-wrapper" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  minWidth: '20px',
                  borderRadius: '6px',
                  border: `2px solid ${termsAccepted ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)'}`,
                  background: termsAccepted ? 'var(--color-primary)' : 'rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginTop: '2px'
                }}
                onClick={() => setTermsAccepted(!termsAccepted)}
              >
                {termsAccepted && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
              <label style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: 'normal', lineHeight: '1.4' }}>
                He leído y acepto los <Link href="/terminos-y-condiciones" target="_blank" className="auth-link" style={{textDecoration: 'underline'}}>Términos y Condiciones</Link> y la <Link href="/politica-de-privacidad" target="_blank" className="auth-link" style={{textDecoration: 'underline'}}>Política de Privacidad</Link>
              </label>
            </div>
          )}
          </>
        )}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? 'Cargando...' : (isAwaitingOTP ? 'Verificar y Entrar' : isLoginView ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>
          
          {isAwaitingOTP && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              {resendCount < 3 && (
                <button 
                  type="button" 
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || isLoading}
                  style={{ background: 'none', border: 'none', color: resendTimer > 0 ? 'var(--color-text-muted)' : 'var(--color-primary)', cursor: resendTimer > 0 ? 'not-allowed' : 'pointer', fontSize: '0.95rem', width: '100%', fontWeight: 'bold' }}
                >
                  {resendTimer > 0 
                    ? `Reenviar código en ${Math.floor(resendTimer / 60)}:${(resendTimer % 60).toString().padStart(2, '0')}` 
                    : 'Reenviar código'}
                </button>
              )}
            </div>
          )}
          
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
