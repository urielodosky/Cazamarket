import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';

interface WhatsAppVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WhatsAppVerificationModal({ isOpen, onClose, onSuccess }: WhatsAppVerificationModalProps) {
  const { updateUser, phone } = useAuth();
  const themeColors = useThemeColors();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [phoneNumber, setPhoneNumber] = useState(phone || '');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Por favor ingresa un número de WhatsApp válido.');
      return;
    }

    setIsLoading(true);
    // Simular el envío de un SMS por WhatsApp API
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
      // Solo para desarrollo (mock), decimos que el código es 123456
    }, 1500);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code !== '123456') {
      setError('Código incorrecto. Para esta prueba usa 123456.');
      return;
    }

    setIsLoading(true);
    try {
      // Guardamos el número en el perfil y lo marcamos como verificado
      await updateUser({ phone: phoneNumber, phone_verified: true });
      setIsLoading(false);
      onSuccess();
    } catch (err: any) {
      setIsLoading(false);
      setError('Error al verificar: ' + err.message);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: '20px'
    }}>
      <div style={{
        background: 'var(--color-bg-surface-elevated)',
        padding: '32px', borderRadius: '16px', maxWidth: '400px', width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        border: `1px solid ${themeColors.borderSubtle2}`
      }}>
        
        {step === 1 ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </div>
            <h2 style={{ textAlign: 'center', margin: '0 0 8px 0', fontSize: '1.4rem' }}>Verificación por WhatsApp</h2>
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Para contactar negocios y dejar reseñas, necesitamos verificar tu número para evitar spam y asegurar transacciones reales.
            </p>
            
            <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Número de WhatsApp</label>
                <input 
                  type="text" 
                  placeholder="+54 9 11 1234-5678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{ 
                    width: '100%', padding: '12px 16px', borderRadius: '8px',
                    border: `1px solid ${themeColors.borderSubtle3}`,
                    background: themeColors.bgSubtle2, color: 'var(--color-text-main)',
                    fontSize: '1rem'
                  }}
                />
              </div>
              {error && <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</div>}
              <button 
                type="submit" 
                disabled={isLoading}
                style={{ 
                  padding: '12px', background: '#25D366', color: '#fff', border: 'none', 
                  borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? 'Enviando...' : 'Enviar Código'}
              </button>
              <button 
                type="button" 
                onClick={onClose}
                style={{ 
                  padding: '12px', background: 'transparent', color: 'var(--color-text-muted)', border: 'none', 
                  fontSize: '0.9rem', cursor: 'pointer' 
                }}
              >
                Cancelar
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h2 style={{ textAlign: 'center', margin: '0 0 8px 0', fontSize: '1.4rem' }}>Ingresa el Código</h2>
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Te enviamos un código por WhatsApp al {phoneNumber}. <br/>(Para esta demo usa: <strong>123456</strong>)
            </p>
            
            <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <input 
                  type="text" 
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{ 
                    width: '100%', padding: '12px 16px', borderRadius: '8px',
                    border: `1px solid ${themeColors.borderSubtle3}`,
                    background: themeColors.bgSubtle2, color: 'var(--color-text-main)',
                    fontSize: '1.5rem', textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold'
                  }}
                  maxLength={6}
                />
              </div>
              {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}
              <button 
                type="submit" 
                disabled={isLoading}
                style={{ 
                  padding: '12px', background: '#25D366', color: '#fff', border: 'none', 
                  borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? 'Verificando...' : 'Verificar'}
              </button>
              <button 
                type="button" 
                onClick={() => setStep(1)}
                style={{ 
                  padding: '12px', background: 'transparent', color: 'var(--color-text-muted)', border: 'none', 
                  fontSize: '0.9rem', cursor: 'pointer' 
                }}
              >
                Volver
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
