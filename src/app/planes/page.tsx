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

export default function PlanesPage() {
  const { selectPlan, cancelPlan, productPlanTier, servicePlanTier } = usePlan();
  const { isLoggedIn, isVendor } = useAuth();
  const [activeTab, setActiveTab] = useState<PlanCategory>('productos');
  const [isActivating, setIsActivating] = useState(false);
  const [authModal, setAuthModal] = useState<{show: boolean, type: 'login' | 'vendor'}>({show: false, type: 'login'});
  const router = useRouter();

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
    
    setIsActivating(true);
    setTimeout(() => {
      selectPlan(plan.tier, activeTab);
      router.push('/configuracion');
    }, 2500);
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
              <span className="discount-badge">¡Ahorro!</span>
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
    </div>
  );
}
