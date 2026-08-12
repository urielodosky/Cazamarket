'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

// Define la versión actual de los Términos y Condiciones.
// Cuando se cambie este valor, todos los usuarios con una versión menor verán el modal de nuevo.
export const CURRENT_TERMS_VERSION = '1.1'; 

export default function TermsAcceptanceModal() {
  const { isLoggedIn, supabaseUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!isLoggedIn || !supabaseUser) return;

    let isMounted = true;
    
    const checkTerms = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('accepted_terms_version')
          .eq('id', supabaseUser.id)
          .single();

        if (error) {
          console.error("Error fetching terms version:", error);
          return;
        }

        const userVersion = data?.accepted_terms_version || '1.0';

        // Lógica de versión simplificada: Si las cadenas no coinciden y asumiendo que 
        // CURRENT siempre avanza (ej. '1.1' > '1.0'), mostramos el modal.
        // Podría usar parseFloat(CURRENT_TERMS_VERSION) > parseFloat(userVersion) si es consistente.
        if (parseFloat(CURRENT_TERMS_VERSION) > parseFloat(userVersion)) {
          if (isMounted) setShowModal(true);
        }
      } catch (e) {
        console.error("Failed to check terms version", e);
      }
    };

    checkTerms();

    return () => { isMounted = false; };
  }, [isLoggedIn, supabaseUser, supabase]);

  const handleAccept = async () => {
    if (!supabaseUser) return;
    setIsAccepting(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          accepted_terms_version: CURRENT_TERMS_VERSION,
          terms_accepted_at: new Date().toISOString()
        })
        .eq('id', supabaseUser.id);
        
      if (error) throw error;
      
      toast.success('Nuevos términos aceptados correctamente');
      setShowModal(false);
    } catch (e) {
      console.error("Error updating terms:", e);
      toast.error('Ocurrió un error al guardar tu aceptación. Por favor intentá de nuevo.');
      setIsAccepting(false);
    }
  };

  if (!showModal) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 99999, // Super high z-index to block everything
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--color-bg-base)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '30px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text-main)', marginBottom: '16px' }}>
          Actualización de Términos y Condiciones
        </h2>
        
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '24px' }}>
          Hemos actualizado nuestros Términos y Condiciones y Políticas de Privacidad. 
          Para continuar usando CazaMarket, debés aceptar la nueva versión ({CURRENT_TERMS_VERSION}).
        </p>

        <a href="/terminos-y-condiciones" target="_blank" rel="noopener noreferrer" 
           style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500, display: 'block', marginBottom: '24px' }}>
          Ver los nuevos términos (Abre en otra pestaña)
        </a>

        <button 
          onClick={handleAccept}
          disabled={isAccepting}
          style={{
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            padding: '14px 24px',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: isAccepting ? 'not-allowed' : 'pointer',
            width: '100%',
            opacity: isAccepting ? 0.7 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          {isAccepting ? 'Guardando...' : 'Acepto los nuevos términos y condiciones'}
        </button>
      </div>
    </div>
  );
}
