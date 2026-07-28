'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import LoadingScreen from '@/components/ui/LoadingScreen';
import {
  PRODUCT_PLANS,
  SERVICE_PLANS,
  MIXED_PLANS,
  PlanCardData,
  PlanCategory,
} from '@/types/planTypes';
import './planes.css';

type PaymentMethod = 'mercadopago' | 'tarjeta';
type PaymentStep = 'select' | 'processing' | 'success';

export default function PlanesPage() {
  const { selectPlan, cancelPlan, productPlanTier, servicePlanTier } = usePlan();
  const { isLoggedIn, isVendor, phone } = useAuth();
  const [activeTab, setActiveTab] = useState<PlanCategory>('productos');
  const [isActivating, setIsActivating] = useState(false);
  const [authModal, setAuthModal] = useState<{show: boolean, type: 'login' | 'vendor'}>({show: false, type: 'login'});
  const router = useRouter();

  // Estado del modal de pago
  const [paymentModal, setPaymentModal] = useState<{show: boolean, plan: PlanCardData | null}>({show: false, plan: null});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercadopago');
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('select');

  const getPlans = (): PlanCardData[] => {
    if (activeTab === 'productos') return PRODUCT_PLANS;
    if (activeTab === 'servicios') return SERVICE_PLANS;
    return MIXED_PLANS;
  };

  const handleSelectPlan = (plan: PlanCardData) => {
    if (!isLoggedIn) {
      setAuthModal({ show: true, type: 'login' });
      return;
    }
    if (!isVendor) {
      setAuthModal({ show: true, type: 'vendor' });
      return;
    }
    
    const hasTelefono = !!phone && phone.trim() !== '';

    if (!hasTelefono) {
      alert('Debes completar tus datos obligatorios (incluyendo tu teléfono) en la Configuración antes de elegir un plan.');
      router.push('/configuracion');
      return;
    }

    // Plan gratuito → activar directo sin pago
    if (plan.price === 0) {
      setIsActivating(true);
      setTimeout(() => {
        selectPlan(plan.tier, activeTab);
        router.push('/configuracion');
      }, 2500);
      return;
    }

    // Plan de pago → abrir modal de pago
    setPaymentModal({ show: true, plan });
    setPaymentStep('select');
    setPaymentMethod('mercadopago');
  };

  const handleConfirmPayment = () => {
    if (!paymentModal.plan) return;
    
    setPaymentStep('processing');
    
    // Simulación de procesamiento de pago (3 segundos)
    setTimeout(() => {
      setPaymentStep('success');
      
      // Después de mostrar el éxito 2 segundos, activar el plan
      setTimeout(() => {
        selectPlan(paymentModal.plan!.tier, activeTab);
        setPaymentModal({ show: false, plan: null });
        setPaymentStep('select');
        router.push('/configuracion');
      }, 2000);
    }, 3000);
  };

  const isCurrentPlan = (plan: PlanCardData): boolean => {
    if (activeTab === 'productos') return plan.tier === productPlanTier;
    if (activeTab === 'servicios') return plan.tier === servicePlanTier;
    if (activeTab === 'mixto') return plan.tier === productPlanTier && plan.tier === servicePlanTier;
    return false;
  };

  const handleCancelPlan = (plan: PlanCardData) => {
    cancelPlan(activeTab);
  };

  if (isActivating) {
    return <LoadingScreen />;
  }

  return (
    <div className="planes-container">
      <div className="planes-hero" style={{ paddingTop: '10px' }}>
        <div className="planes-tabs-wrapper">
          <div className="planes-tabs glass-panel">
            <button
              className={`tab-btn ${activeTab === 'productos' ? 'active' : ''}`}
              onClick={() => setActiveTab('productos')}
            >
              Productos
            </button>
            <button
              className={`tab-btn ${activeTab === 'servicios' ? 'active' : ''}`}
              onClick={() => setActiveTab('servicios')}
            >
              Servicios
            </button>
            <button
              className={`tab-btn ${activeTab === 'mixto' ? 'active' : ''}`}
              onClick={() => setActiveTab('mixto')}
            >
              Mixtos
              <span className="discount-badge">Ahorro</span>
            </button>
          </div>
        </div>

        {activeTab === 'servicios' && (
          <p className="planes-no-free-notice">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Los servicios no tienen plan gratuito. Se requiere al menos el plan Básico.
          </p>
        )}
      </div>

      <div className="planes-content">
        <div className={`plans-grid ${activeTab === 'productos' ? 'plans-grid-5' : ''}`}>
          {getPlans().map((plan, index) => (
            <div key={`${activeTab}-${index}`} className={`plan-card glass-panel ${plan.recommended && !isCurrentPlan(plan) ? 'recommended' : ''} ${isCurrentPlan(plan) ? 'current-plan' : ''}`}>
              {plan.recommended && !isCurrentPlan(plan) && <div className="plan-badge">MÁS ELEGIDO</div>}
              {isCurrentPlan(plan) && <div className="plan-badge current-badge">TU PLAN</div>}

              <div className="plan-header">
                <span className="plan-category-label">{activeTab === 'mixto' ? 'Plan Mixto' : activeTab === 'productos' ? 'Plan Productos' : 'Plan Servicios'}</span>
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price">
                  <span className="currency">$</span>
                  <span className="amount">{plan.price}</span>
                  <span className="period">{plan.price === 0 ? '' : '/mes'}</span>
                </div>
                {plan.originalPrice && (
                  <div className="plan-original-price">
                    Antes: <s>${plan.originalPrice}</s>
                  </div>
                )}
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className={feature.included ? 'feature-included' : 'feature-excluded'}>
                    {feature.included ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="check-icon feature-icon-yes">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="check-icon feature-icon-no">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    )}
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`btn ${isCurrentPlan(plan) ? 'btn-danger' : plan.recommended ? 'btn-primary' : 'btn-outline'} plan-btn`}
                onClick={() => isCurrentPlan(plan) ? handleCancelPlan(plan) : handleSelectPlan(plan)}
                style={isCurrentPlan(plan) ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: '#ef4444' } : {}}
              >
                {isCurrentPlan(plan) ? 'Darse de baja' : plan.price === 0 ? 'Comenzar Gratis' : 'Elegir Plan'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE VALIDACIÓN */}
      {authModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(5px)', padding: '20px'
        }}>
          <div style={{
            background: '#1a1a1a', borderRadius: '16px', width: '100%', maxWidth: '450px',
            padding: '30px', position: 'relative', border: '1px solid #333',
            boxShadow: '0 10px 40px rgba(0,0,0,0.8)', textAlign: 'center'
          }}>
            <button 
              onClick={() => setAuthModal({ show: false, type: 'login' })}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#888', fontSize: '1.5rem', cursor: 'pointer' }}
            >×</button>
            
            <div style={{ 
              width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255, 115, 0, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              color: 'var(--color-primary)', fontSize: '2rem', fontWeight: 'bold', border: '2px solid var(--color-primary)'
            }}>!</div>
            
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3rem', color: 'white' }}>
              {authModal.type === 'login' ? 'Inicia sesión para continuar' : 'Configura tu Negocio'}
            </h3>
            
            <p style={{ color: '#aaa', fontSize: '0.95rem', margin: '0 0 25px 0', lineHeight: 1.5 }}>
              {authModal.type === 'login' 
                ? 'Para poder adquirir y gestionar un plan, necesitas tener una cuenta en CazaMarket.' 
                : 'Antes de elegir un plan comercial, necesitas completar los datos obligatorios de tu negocio en la configuración.'}
            </p>
            
            <button 
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '1.05rem', fontWeight: 600 }}
              onClick={() => {
                setAuthModal({ show: false, type: 'login' });
                router.push(authModal.type === 'login' ? '/registro' : '/configuracion');
              }}
            >
              {authModal.type === 'login' ? 'Ir a Iniciar Sesión / Registrarse' : 'Completar datos del negocio'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE PAGO (SIMULACIÓN) */}
      {paymentModal.show && paymentModal.plan && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(8px)', padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #111 100%)', borderRadius: '20px', width: '100%', maxWidth: '480px',
            padding: '0', position: 'relative', border: '1px solid #2a2a2a',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9)', overflow: 'hidden'
          }}>
            {/* Header del modal de pago */}
            <div style={{
              background: 'linear-gradient(135deg, var(--color-primary), #e06500)',
              padding: '24px 30px',
              position: 'relative'
            }}>
              {paymentStep === 'select' && (
                <button 
                  onClick={() => setPaymentModal({ show: false, plan: null })}
                  style={{ position: 'absolute', top: '15px', right: '18px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '1.5rem', cursor: 'pointer' }}
                >×</button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                <div>
                  <h3 style={{ margin: 0, color: 'white', fontSize: '1.15rem', fontWeight: 700 }}>
                    {paymentStep === 'success' ? 'Pago exitoso' : paymentStep === 'processing' ? 'Procesando pago...' : 'Finalizar compra'}
                  </h3>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
                    {paymentStep === 'success' ? 'Tu plan ha sido activado' : paymentStep === 'processing' ? 'No cierres esta ventana' : 'Simulación de pago'}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: '28px 30px' }}>
              {/* PASO 1: Seleccionar método de pago */}
              {paymentStep === 'select' && (
                <>
                  {/* Resumen del plan */}
                  <div style={{
                    background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px',
                    marginBottom: '24px', border: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plan seleccionado</p>
                        <p style={{ margin: '4px 0 0', color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>{paymentModal.plan.name}</p>
                        <p style={{ margin: '2px 0 0', color: '#666', fontSize: '0.85rem' }}>
                          {activeTab === 'mixto' ? 'Productos + Servicios' : activeTab === 'productos' ? 'Solo Productos' : 'Solo Servicios'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, color: 'var(--color-primary)', fontSize: '1.6rem', fontWeight: 800 }}>
                          ${paymentModal.plan.price}
                        </p>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>/mes</p>
                      </div>
                    </div>
                  </div>

                  {/* Métodos de pago */}
                  <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Método de pago
                  </p>

                  {/* Opción: Mercado Pago */}
                  <div
                    onClick={() => setPaymentMethod('mercadopago')}
                    style={{
                      background: paymentMethod === 'mercadopago' ? 'rgba(0, 158, 227, 0.08)' : 'rgba(255,255,255,0.03)',
                      border: paymentMethod === 'mercadopago' ? '2px solid #009ee3' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px', padding: '16px', marginBottom: '10px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '10px', background: '#009ee3',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <span style={{ color: 'white', fontWeight: 900, fontSize: '1.1rem' }}>MP</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Mercado Pago</p>
                      <p style={{ margin: '2px 0 0', color: '#777', fontSize: '0.8rem' }}>Billetera digital, QR, transferencia</p>
                    </div>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      border: paymentMethod === 'mercadopago' ? '6px solid #009ee3' : '2px solid #444',
                      transition: 'all 0.2s ease'
                    }}></div>
                  </div>

                  {/* Opción: Tarjeta de Débito */}
                  <div
                    onClick={() => setPaymentMethod('tarjeta')}
                    style={{
                      background: paymentMethod === 'tarjeta' ? 'rgba(255, 115, 0, 0.08)' : 'rgba(255,255,255,0.03)',
                      border: paymentMethod === 'tarjeta' ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px', padding: '16px', marginBottom: '24px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--color-primary), #e06500)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Tarjeta de Débito</p>
                      <p style={{ margin: '2px 0 0', color: '#777', fontSize: '0.8rem' }}>Visa, Mastercard, Cabal</p>
                    </div>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      border: paymentMethod === 'tarjeta' ? '6px solid var(--color-primary)' : '2px solid #444',
                      transition: 'all 0.2s ease'
                    }}></div>
                  </div>

                  {/* Disclaimer de simulación */}
                  <div style={{
                    background: 'rgba(255, 193, 7, 0.08)', borderRadius: '8px', padding: '10px 14px',
                    marginBottom: '20px', border: '1px solid rgba(255, 193, 7, 0.2)',
                    display: 'flex', alignItems: 'center', gap: '10px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffc107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p style={{ margin: 0, color: '#cca700', fontSize: '0.78rem', lineHeight: 1.4 }}>
                      Simulación de pago. Los cobros reales se activarán próximamente con Mercado Pago.
                    </p>
                  </div>

                  {/* Botón de pagar */}
                  <button
                    onClick={handleConfirmPayment}
                    style={{
                      width: '100%', padding: '14px', fontSize: '1.05rem', fontWeight: 700,
                      background: 'linear-gradient(135deg, var(--color-primary), #e06500)',
                      border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer',
                      transition: 'all 0.2s ease', boxShadow: '0 4px 15px rgba(255, 115, 0, 0.3)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    Pagar ${paymentModal.plan.price}/mes
                  </button>
                </>
              )}

              {/* PASO 2: Procesando pago */}
              {paymentStep === 'processing' && (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)',
                    margin: '0 auto 24px', animation: 'spin 1s linear infinite'
                  }}></div>
                  <p style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600, margin: '0 0 8px' }}>
                    Procesando tu pago...
                  </p>
                  <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
                    {paymentMethod === 'mercadopago' ? 'Conectando con Mercado Pago' : 'Verificando tarjeta de débito'}
                  </p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {/* PASO 3: Pago exitoso */}
              {paymentStep === 'success' && (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: 'rgba(34, 197, 94, 0.15)', border: '2px solid #22c55e',
                    margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <p style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600, margin: '0 0 8px' }}>
                    Pago confirmado
                  </p>
                  <p style={{ color: '#888', fontSize: '0.9rem', margin: '0 0 4px' }}>
                    Plan <strong style={{ color: 'var(--color-primary)' }}>{paymentModal.plan.name}</strong> activado
                  </p>
                  <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>
                    Redirigiendo a tu configuración...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
