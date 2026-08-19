'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { mockPremiumPayment } from '@/app/actions/mockPayment';
import {
  PRODUCT_PLANS,
  SERVICE_PLANS,
  MIXED_PLANS,
  PlanCardData,
  PlanCategory,
} from '@/types/planTypes';
import './planes.css';

type PaymentMethod = 'mercadopago' | 'tarjeta';
type PaymentStep = 'select' | 'card' | 'processing' | 'success';

export default function PlanesPage() {
  const { 
    selectPlan, 
    cancelPlan, 
    productPlanTier, 
    servicePlanTier,
    pendingProductPlanTier,
    pendingServicePlanTier,
    calculateNextBillingDate,
    acceleratePlan,
    isPaidPlan
  } = usePlan();
  const { isLoggedIn, isVendor, phone, personType, birthDate, cuit, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<PlanCategory>('productos');
  const [isActivating, setIsActivating] = useState(false);
  const [isMockLoading, setIsMockLoading] = useState(false);
  const [authModal, setAuthModal] = useState<{show: boolean, type: 'login' | 'vendor'}>({show: false, type: 'login'});
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});
  const router = useRouter();

  // Estado del modal de pago
  const [paymentModal, setPaymentModal] = useState<{show: boolean, plan: PlanCardData | null, isAccelerating?: boolean}>({show: false, plan: null});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercadopago');
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('select');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [exchangeRate, setExchangeRate] = useState<number>(1400); // Default fallback

  useEffect(() => {
    if (paymentModal.show) {
      fetch('/api/dolar')
        .then(res => res.json())
        .then(data => {
          if (data.venta) setExchangeRate(data.venta);
        })
        .catch(err => console.error('Error fetching dollar rate:', err));
    }
  }, [paymentModal.show]);

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
    const hasTelefono = !!phone && phone.trim() !== '';
    // Física necesita Fecha de nacimiento, Jurídica necesita CUIT
    const hasMandatoryFields = hasTelefono && (personType === 'fisica' ? !!birthDate && birthDate.trim() !== '' : !!cuit && cuit.trim() !== '');

    if (!hasMandatoryFields) {
      setAuthModal({ show: true, type: 'vendor' });
      return;
    }

    // Si tiene todos los datos pero todavía no es 'negocio' oficialmente, lo actualizamos ahora
    if (!isVendor) {
      updateUser({ role: 'negocio' });
    }

    const isUpgradingFromPaid = (activeTab === 'productos' || activeTab === 'mixto') && productPlanTier !== 'gratis' 
                             || (activeTab === 'servicios' || activeTab === 'mixto') && servicePlanTier !== 'gratis';

    // Plan gratuito o cambio de plan de pago a otro de pago → activar/pendiente directo sin pago
    if (plan.price === 0 || isUpgradingFromPaid) {
      setIsActivating(true);
      setTimeout(() => {
        selectPlan(plan.tier, activeTab);
        setIsActivating(false);
        if (plan.price === 0) {
          router.push('/configuracion');
        }
      }, 1500);
      return;
    }

    // Plan de pago (primera vez) → abrir modal de pago
    setPaymentModal({ show: true, plan });
    setPaymentStep('select');
    setPaymentMethod('mercadopago');
  };

  const handleConfirmPayment = () => {
    if (!paymentModal.plan) return;
    
    if (paymentMethod === 'tarjeta' && paymentStep === 'select') {
      setPaymentStep('card');
      return;
    }
    
    setPaymentStep('processing');
    
    // Simulación de procesamiento de pago (3 segundos)
    setTimeout(() => {
      setPaymentStep('success');
      
      // Después de mostrar el éxito 2 segundos, activar el plan
      setTimeout(() => {
        if (paymentModal.isAccelerating) {
          acceleratePlan(activeTab);
        } else {
          selectPlan(paymentModal.plan!.tier, activeTab);
        }
        setPaymentModal({ show: false, plan: null, isAccelerating: false });
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

  const isPendingPlan = (plan: PlanCardData): boolean => {
    if (activeTab === 'productos') return plan.tier === pendingProductPlanTier;
    if (activeTab === 'servicios') return plan.tier === pendingServicePlanTier;
    if (activeTab === 'mixto') return plan.tier === pendingProductPlanTier && plan.tier === pendingServicePlanTier;
    return false;
  };

  const nextBillingDate = calculateNextBillingDate();
  const formattedNextBillingDate = nextBillingDate ? new Date(nextBillingDate).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long'
  }) : '';

  const handleCancelPlan = (plan: PlanCardData) => {
    cancelPlan(activeTab);
  };

  if (isActivating) {
    return <LoadingScreen />;
  }

  return (
    <div className="planes-container">
      <h1 className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>Planes y Precios</h1>
      <div className="planes-hero" style={{ paddingTop: '10px' }}>
        
        {/* BOTÓN MOCK SOLO PARA DESARROLLO */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <button 
              className="btn" 
              onClick={async () => {
                if (!isLoggedIn) {
                  setAuthModal({ show: true, type: 'login' });
                  return;
                }
                setIsMockLoading(true);
                try {
                  const res = await mockPremiumPayment();
                  if (res.success) {
                    // Sincronizar UI instantáneamente sin recargar
                    updateUser({ role: 'negocio' });
                    selectPlan('empresarial', 'mixto');
                    alert('¡Simulación Exitosa! Ahora eres Empresarial.');
                    router.push('/configuracion');
                  } else {
                    alert('Error en simulación: ' + res.error);
                  }
                } catch (error) {
                  console.error(error);
                } finally {
                  setIsMockLoading(false);
                }
              }}
              style={{ 
                background: 'linear-gradient(90deg, #ff00cc, #333399)', 
                color: 'white', 
                border: 'none', 
                padding: '10px 20px', 
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(255, 0, 204, 0.4)'
              }}
              disabled={isMockLoading}
            >
              {isMockLoading ? (
                 <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</span>
              ) : (
                 <span>🚀 Simular Pago Premium (DEV)</span>
              )}
            </button>
          </div>
        )}

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
            <div key={`${activeTab}-${index}`} className={`plan-card glass-panel ${plan.recommended && !isCurrentPlan(plan) && !isPendingPlan(plan) ? 'recommended' : ''} ${isCurrentPlan(plan) ? 'current-plan' : ''} ${isPendingPlan(plan) ? 'pending-plan' : ''}`} style={isPendingPlan(plan) ? { border: '1px dashed var(--color-primary)' } : {}}>
              {plan.recommended && !isCurrentPlan(plan) && !isPendingPlan(plan) && <div className="plan-badge">MÁS ELEGIDO</div>}
              {isCurrentPlan(plan) && <div className="plan-badge current-badge">TU PLAN</div>}
              {isPendingPlan(plan) && <div className="plan-badge" style={{ background: 'var(--color-primary)' }}>EN PROCESO</div>}

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

              <button 
                className="plan-features-toggle" 
                onClick={() => setExpandedPlans(prev => ({...prev, [`${activeTab}-${index}`]: !prev[`${activeTab}-${index}`]}))}
              >
                {expandedPlans[`${activeTab}-${index}`] ? 'Ocultar características' : 'Ver características'}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', marginLeft: '4px', transform: expandedPlans[`${activeTab}-${index}`] ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              <div className={`plan-features-container ${expandedPlans[`${activeTab}-${index}`] ? 'expanded' : ''}`}>
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
              </div>

              <button
                className={`btn ${isCurrentPlan(plan) ? 'btn-danger' : isPendingPlan(plan) ? 'btn-outline' : plan.recommended ? 'btn-primary' : 'btn-outline'} plan-btn`}
                onClick={() => {
                  if (isCurrentPlan(plan)) {
                    handleCancelPlan(plan);
                  } else if (isPendingPlan(plan)) {
                    // Do nothing, wait for billing
                  } else {
                    handleSelectPlan(plan);
                  }
                }}
                style={isCurrentPlan(plan) ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: '#ef4444' } : (isPendingPlan(plan) ? { backgroundColor: 'rgba(255, 255, 255, 0.04)', color: '#999', borderColor: 'rgba(255, 255, 255, 0.1)', cursor: 'default', opacity: 1, padding: '12px 10px' } : {})}
              >
                {isCurrentPlan(plan) ? 'Darse de baja' : isPendingPlan(plan) ? 'Cambio en curso' : plan.price === 0 ? 'Comenzar Gratis' : 'Elegir Plan'}
              </button>

              {isPendingPlan(plan) && formattedNextBillingDate && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    Este plan entrará en vigencia automáticamente el <strong>{formattedNextBillingDate}</strong>.
                  </p>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '6px 12px', fontSize: '0.85rem', width: '100%', borderRadius: 'var(--radius-full)' }}
                    onClick={() => {
                      setPaymentModal({ show: true, plan, isAccelerating: true });
                      setPaymentStep('select');
                      setPaymentMethod('mercadopago');
                    }}
                  >
                    Acelerar ahora
                  </button>
                </div>
              )}
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
              padding: '24px 30px',
              position: 'relative',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              {paymentStep === 'select' && (
                <button 
                  onClick={() => setPaymentModal({ show: false, plan: null })}
                  style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', transition: 'background 0.2s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >×</button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255, 115, 0, 0.1)', border: '1px solid rgba(255, 115, 0, 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
                    {paymentStep === 'success' ? 'Pago exitoso' : paymentStep === 'processing' ? 'Procesando pago...' : paymentStep === 'card' ? 'Datos de Tarjeta' : 'Finalizar compra'}
                  </h3>
                  <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                    {paymentStep === 'success' ? 'Tu plan ha sido activado' : paymentStep === 'processing' ? 'No cierres esta ventana' : paymentStep === 'card' ? 'Ingresa los datos de forma segura' : 'Simulación de pago segura'}
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
                          ${(paymentModal.plan.price * exchangeRate).toLocaleString('es-AR')}
                        </p>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>ARS / mes</p>
                        <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.75rem' }}>
                          (Eq. a ${paymentModal.plan.price} USD)
                        </p>
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
                      width: '44px', height: '44px', borderRadius: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      overflow: 'hidden'
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <Image 
                        src="/mercadopago-logo.png" 
                        alt="Mercado Pago" 
                        width={44}
                        height={44}
                        style={{ objectFit: 'contain' }}
                      />
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
                      <p style={{ margin: '2px 0 0', color: '#777', fontSize: '0.8rem' }}>Visa, Mastercard, Cabal (No crédito)</p>
                    </div>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      border: paymentMethod === 'tarjeta' ? '6px solid var(--color-primary)' : '2px solid #444',
                      transition: 'all 0.2s ease'
                    }}></div>
                  </div>

                  {/* Disclaimer de simulación */}
                  {isPaidPlan && (
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
                        <strong>Importante:</strong> El cambio de plan se aplicará a partir de tu <strong>próximo ciclo de facturación</strong>. No se realizarán cobros extra este mes, a menos que uses la opción <strong>Acelerar</strong> desde el panel principal.
                      </p>
                    </div>
                  )}

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
                    Pagar ${(paymentModal.plan.price * exchangeRate).toLocaleString('es-AR')} ARS/mes
                  </button>
                </>
              )}

              {/* PASO 1.5: Ingreso de Tarjeta */}
              {paymentStep === 'card' && (
                <div>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <p style={{ margin: 0, color: '#ff8a8a', fontSize: '0.85rem' }}>Solo aceptamos <strong>Tarjetas de Débito</strong>. Las tarjetas de crédito serán rechazadas automáticamente.</p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    <input 
                      type="text" 
                      placeholder="Número de Tarjeta de Débito" 
                      value={cardData.number}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        val = val.replace(/(.{4})/g, '$1 ').trim();
                        setCardData({...cardData, number: val.substring(0, 19)});
                      }}
                      maxLength={19}
                      inputMode="numeric"
                      style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '1rem' }} 
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input 
                        type="text" 
                        placeholder="MM/AA" 
                        value={cardData.expiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length >= 2) val = val.substring(0,2) + '/' + val.substring(2,4);
                          setCardData({...cardData, expiry: val});
                        }}
                        maxLength={5}
                        inputMode="numeric"
                        style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'white', flex: 1, fontSize: '1rem' }} 
                      />
                      <input 
                        type="text" 
                        placeholder="CVC" 
                        value={cardData.cvc}
                        onChange={(e) => setCardData({...cardData, cvc: e.target.value.replace(/\D/g, '').substring(0, 4)})}
                        maxLength={4}
                        inputMode="numeric"
                        style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'white', flex: 1, fontSize: '1rem' }} 
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Nombre en la tarjeta" 
                      value={cardData.name}
                      onChange={(e) => setCardData({...cardData, name: e.target.value.replace(/[^a-zA-Z\s]/g, '')})}
                      style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '1rem' }} 
                    />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(34, 197, 94, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <span style={{ lineHeight: 1.4 }}><strong>Tus datos están encriptados.</strong> Nunca guardamos el número completo de tu tarjeta en nuestra base de datos. Solo guardamos un token seguro validado por nuestra pasarela de pagos, cumpliendo con la normativa internacional PCI DSS.</span>
                  </div>
                  <button
                    onClick={handleConfirmPayment}
                    style={{
                      width: '100%', padding: '14px', fontSize: '1.05rem', fontWeight: 700,
                      background: 'linear-gradient(135deg, var(--color-primary), #e06500)',
                      border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer',
                      transition: 'all 0.2s ease', boxShadow: '0 4px 15px rgba(255, 115, 0, 0.3)'
                    }}
                  >
                    Pagar ${(paymentModal.plan!.price * exchangeRate).toLocaleString('es-AR')} ARS Seguro
                  </button>
                  <button
                    onClick={() => setPaymentStep('select')}
                    style={{
                      width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 600,
                      background: 'transparent',
                      border: 'none', color: '#888', cursor: 'pointer', marginTop: '12px'
                    }}
                  >
                    Volver atrás
                  </button>
                </div>
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
                    Cambio de plan programado
                  </p>
                  <p style={{ color: '#888', fontSize: '0.9rem', margin: '0 0 4px' }}>
                    El plan <strong style={{ color: 'var(--color-primary)' }}>{paymentModal.plan.name}</strong> se activará en tu próximo cobro.
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
