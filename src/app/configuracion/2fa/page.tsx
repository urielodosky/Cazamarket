'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { useRouter } from 'next/navigation';

export default function Configurar2FAPage() {
  const { isLoggedIn, supabaseUser } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [factorId, setFactorId] = useState('');
  const [qrCodeUri, setQrCodeUri] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isInit, setIsInit] = useState(true);

  useEffect(() => {
    if (!isLoggedIn && !isInit) {
      router.push('/registro');
    }
    
    // Check if user already has MFA enabled
    const checkMfaStatus = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        
        const totpFactor = data.totp.find(factor => factor.status === 'verified');
        if (totpFactor) {
          setIsEnrolled(true);
        }
      } catch (err: any) {
        console.error("Error al verificar factores MFA:", err.message);
      } finally {
        setIsInit(false);
      }
    };
    
    if (isLoggedIn) checkMfaStatus();
  }, [isLoggedIn, router, supabase, isInit]);

  const handleEnroll = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) throw error;

      setFactorId(data.id);
      setQrCodeUri(data.totp.uri);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar la configuración de 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Por favor, ingresa un código válido de 6 dígitos.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;
      
      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verificationCode,
      });
      
      if (verify.error) throw verify.error;
      
      setIsEnrolled(true);
      setMessage('¡Autenticación de Dos Factores (2FA) activada con éxito!');
      setFactorId('');
      setQrCodeUri('');
    } catch (err: any) {
      setError(err.message || 'Código incorrecto o expirado. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!window.confirm("¿Estás seguro de que deseas desactivar el 2FA? Tu cuenta será menos segura.")) return;
    
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const totpFactor = data.totp.find(factor => factor.status === 'verified');
      if (totpFactor) {
        const unenroll = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
        if (unenroll.error) throw unenroll.error;
        
        setIsEnrolled(false);
        setMessage('2FA desactivado correctamente.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al desactivar 2FA');
    } finally {
      setLoading(false);
    }
  };

  if (isInit) return <div className="p-8 text-center text-[var(--color-text-muted)]">Cargando...</div>;
  if (!isLoggedIn) return null;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-[var(--color-surface)] shadow-lg rounded-2xl overflow-hidden border border-[var(--color-border)]">
        <div className="p-8 border-b border-[var(--color-border)] bg-[var(--color-background)]">
          <h1 className="text-3xl font-extrabold text-[var(--color-text)]">
            Autenticación de Dos Factores (2FA)
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Agrega una capa adicional de seguridad a tu cuenta protegiéndola con un código temporal generado en tu teléfono móvil.
          </p>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50/10 border-l-4 border-red-500 p-4 rounded-r">
              <p className="text-sm text-red-500 font-medium">{error}</p>
            </div>
          )}
          
          {message && (
            <div className="bg-green-50/10 border-l-4 border-green-500 p-4 rounded-r">
              <p className="text-sm text-green-500 font-medium">{message}</p>
            </div>
          )}

          {isEnrolled ? (
            <div className="flex flex-col items-center justify-center p-8 bg-[var(--color-background)] rounded-xl border border-green-500/30">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">2FA Activado</h2>
              <p className="text-center text-[var(--color-text-muted)] max-w-md mb-6">
                Tu cuenta está protegida. Se requerirá un código de tu aplicación autenticadora (ej. Google Authenticator) cada vez que inicies sesión.
              </p>
              <button
                onClick={handleUnenroll}
                disabled={loading}
                className="px-6 py-2 border border-red-500/50 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Desactivando...' : 'Desactivar 2FA'}
              </button>
            </div>
          ) : qrCodeUri ? (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col items-center space-y-4">
                <p className="text-center font-medium text-[var(--color-text)]">
                  1. Escanea este código QR con Google Authenticator o Authy
                </p>
                <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200">
                  <QRCodeSVG value={qrCodeUri} size={200} level="H" />
                </div>
              </div>
              
              <div className="space-y-4 max-w-md mx-auto">
                <label className="block text-center font-medium text-[var(--color-text)]">
                  2. Ingresa el código de 6 dígitos que aparece en la aplicación
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all text-[var(--color-text)]"
                  />
                </div>
                <button
                  onClick={handleVerify}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md shadow-[var(--color-primary)]/30"
                >
                  {loading ? 'Verificando...' : 'Verificar y Activar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-[var(--color-text-muted)] max-w-md">
                El 2FA protegerá tu cuenta incluso si alguien descubre tu contraseña. Al activarlo, vincularemos tu cuenta con una app autenticadora.
              </p>
              <button
                onClick={handleEnroll}
                disabled={loading}
                className="px-8 py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-[var(--color-primary)]/20"
              >
                {loading ? 'Preparando configuración...' : 'Comenzar Configuración'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
