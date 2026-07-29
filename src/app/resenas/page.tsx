'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { createClient } from '@/lib/supabase/client';

export default function ResenasPage() {
  const router = useRouter();
  const { isLoggedIn, isMounted, supabaseUser, isVendor } = useAuth();
  const themeColors = useThemeColors();
  const supabase = createClient();

  // Tab principal: 'mis-resenas' (como vendedor) o 'resenas-dadas' (como comprador)
  // Por defecto, si es vendedor arranca en mis-resenas, si no, en resenas-dadas
  const [activeMainTab, setActiveMainTab] = useState<'mis-resenas' | 'resenas-dadas'>(isVendor ? 'mis-resenas' : 'resenas-dadas');
  
  // Sub-tabs
  const [activeSubTabMisResenas, setActiveSubTabMisResenas] = useState<'pendientes' | 'recibidas' | 'canceladas'>('pendientes');
  const [activeSubTabResenasDadas, setActiveSubTabResenasDadas] = useState<'pendientes' | 'dadas' | 'canceladas'>('pendientes');

  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, isMounted, router]);

  if (!isMounted || !isLoggedIn) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', paddingTop: '90px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px 40px' }}>
        
        {/* Encabezado */}
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '12px', 
            background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--color-text-main)', fontWeight: 800 }}>Panel de Reseñas</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Administrá tus valoraciones y experiencias</p>
          </div>
        </div>

        {/* Tabs Principales */}
        <div style={{ 
          display: 'flex', gap: '8px', marginBottom: '24px', 
          background: themeColors.bgSubtle2, padding: '6px', borderRadius: '16px',
          overflowX: 'auto'
        }}>
          <button
            onClick={() => setActiveMainTab('mis-resenas')}
            style={{
              flex: 1, padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s ease',
              background: activeMainTab === 'mis-resenas' ? 'var(--color-bg-surface-elevated)' : 'transparent',
              color: activeMainTab === 'mis-resenas' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              boxShadow: activeMainTab === 'mis-resenas' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
              whiteSpace: 'nowrap'
            }}
          >
            Mis Reseñas (Recibidas)
          </button>
          <button
            onClick={() => setActiveMainTab('resenas-dadas')}
            style={{
              flex: 1, padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s ease',
              background: activeMainTab === 'resenas-dadas' ? 'var(--color-bg-surface-elevated)' : 'transparent',
              color: activeMainTab === 'resenas-dadas' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              boxShadow: activeMainTab === 'resenas-dadas' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
              whiteSpace: 'nowrap'
            }}
          >
            Reseñas Dadas (Enviadas)
          </button>
        </div>

        {/* Contenido según Main Tab */}
        <div style={{ 
          background: 'var(--color-bg-surface-elevated)', 
          borderRadius: '24px', 
          padding: '24px',
          border: `1px solid ${themeColors.borderSubtle2}`,
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
        }}>
          
          {activeMainTab === 'mis-resenas' && (
            <>
              {/* Subtabs de Mis Reseñas */}
              <div style={{ display: 'flex', gap: '20px', borderBottom: `1px solid ${themeColors.borderSubtle3}`, marginBottom: '24px' }}>
                <button
                  onClick={() => setActiveSubTabMisResenas('pendientes')}
                  style={{
                    padding: '0 0 12px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontWeight: activeSubTabMisResenas === 'pendientes' ? 700 : 500, fontSize: '0.95rem',
                    color: activeSubTabMisResenas === 'pendientes' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: activeSubTabMisResenas === 'pendientes' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    transition: 'all 0.2s ease', position: 'relative', top: '1px'
                  }}
                >
                  Pendientes a recibir
                </button>
                <button
                  onClick={() => setActiveSubTabMisResenas('recibidas')}
                  style={{
                    padding: '0 0 12px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontWeight: activeSubTabMisResenas === 'recibidas' ? 700 : 500, fontSize: '0.95rem',
                    color: activeSubTabMisResenas === 'recibidas' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: activeSubTabMisResenas === 'recibidas' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    transition: 'all 0.2s ease', position: 'relative', top: '1px'
                  }}
                >
                  Reseñas recibidas
                </button>
                <button
                  onClick={() => setActiveSubTabMisResenas('canceladas')}
                  style={{
                    padding: '0 0 12px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontWeight: activeSubTabMisResenas === 'canceladas' ? 700 : 500, fontSize: '0.95rem',
                    color: activeSubTabMisResenas === 'canceladas' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: activeSubTabMisResenas === 'canceladas' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    transition: 'all 0.2s ease', position: 'relative', top: '1px'
                  }}
                >
                  Reseñas canceladas
                </button>
              </div>

              {/* Contenido Subtabs Mis Reseñas */}
              <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
                {activeSubTabMisResenas === 'pendientes' && (
                  <p style={{ color: 'var(--color-text-muted)' }}>No hay valoraciones pendientes de validar (Próximamente)</p>
                )}
                {activeSubTabMisResenas === 'recibidas' && (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Mock Review Card */}
                    <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${themeColors.borderSubtle3}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>Juan Pérez</h4>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Compra: Rifle de Aire Comprimido</span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {[1,2,3,4,5].map(star => (
                            <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill={star <= 4 ? "#FFD700" : "none"} stroke="#FFD700" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                          ))}
                        </div>
                      </div>
                      <p style={{ margin: 0, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>"Excelente vendedor, el producto llegó en perfectas condiciones y fue súper amable para coordinar el envío."</p>
                    </div>
                  </div>
                )}
                {activeSubTabMisResenas === 'canceladas' && (
                  <p style={{ color: 'var(--color-text-muted)' }}>No hay reseñas canceladas.</p>
                )}
              </div>
            </>
          )}

          {activeMainTab === 'resenas-dadas' && (
            <>
              {/* Subtabs de Reseñas Dadas */}
              <div style={{ display: 'flex', gap: '20px', borderBottom: `1px solid ${themeColors.borderSubtle3}`, marginBottom: '24px' }}>
                <button
                  onClick={() => setActiveSubTabResenasDadas('pendientes')}
                  style={{
                    padding: '0 0 12px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontWeight: activeSubTabResenasDadas === 'pendientes' ? 700 : 500, fontSize: '0.95rem',
                    color: activeSubTabResenasDadas === 'pendientes' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: activeSubTabResenasDadas === 'pendientes' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    transition: 'all 0.2s ease', position: 'relative', top: '1px'
                  }}
                >
                  Pendientes de enviar
                </button>
                <button
                  onClick={() => setActiveSubTabResenasDadas('dadas')}
                  style={{
                    padding: '0 0 12px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontWeight: activeSubTabResenasDadas === 'dadas' ? 700 : 500, fontSize: '0.95rem',
                    color: activeSubTabResenasDadas === 'dadas' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: activeSubTabResenasDadas === 'dadas' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    transition: 'all 0.2s ease', position: 'relative', top: '1px'
                  }}
                >
                  Reseñas dadas
                </button>
                <button
                  onClick={() => setActiveSubTabResenasDadas('canceladas')}
                  style={{
                    padding: '0 0 12px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontWeight: activeSubTabResenasDadas === 'canceladas' ? 700 : 500, fontSize: '0.95rem',
                    color: activeSubTabResenasDadas === 'canceladas' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: activeSubTabResenasDadas === 'canceladas' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    transition: 'all 0.2s ease', position: 'relative', top: '1px'
                  }}
                >
                  Reseñas canceladas
                </button>
              </div>

              {/* Contenido Subtabs Reseñas Dadas */}
              <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
                {activeSubTabResenasDadas === 'pendientes' && (
                  <p style={{ color: 'var(--color-text-muted)' }}>No tenés negocios contactados para evaluar (Próximamente)</p>
                )}
                {activeSubTabResenasDadas === 'dadas' && (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Mock Review Card Given */}
                    <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${themeColors.borderSubtle3}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>Armería El Cazador</h4>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Producto: Kit de limpieza</span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {[1,2,3,4,5].map(star => (
                            <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill={star <= 5 ? "#FFD700" : "none"} stroke="#FFD700" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                          ))}
                        </div>
                      </div>
                      <p style={{ margin: 0, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>"Muy buena atención."</p>
                    </div>
                  </div>
                )}
                {activeSubTabResenasDadas === 'canceladas' && (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Mock Rejected Review Card */}
                    <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,0,0,0.03)', border: '1px solid rgba(255,0,0,0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>Tienda Outdoor</h4>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Reseña rechazada por el vendedor</span>
                        </div>
                      </div>
                      <p style={{ margin: '0 0 16px 0', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>Tu calificación de 2 estrellas fue rechazada por el negocio.</p>
                      <button style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                        ¿Querés apelar el rechazo?
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
