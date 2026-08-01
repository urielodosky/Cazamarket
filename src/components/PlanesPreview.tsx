import Link from 'next/link';
import { PRODUCT_PLANS, SERVICE_PLANS, MIXED_PLANS } from '@/types/planTypes';
import '../app/planes/planes.css';

// Obtener los planes "Comercial" (los más elegidos) de cada categoría
const productComercial = PRODUCT_PLANS.find(p => p.tier === 'comercial')!;
const mixedComercial = MIXED_PLANS.find(p => p.tier === 'comercial')!;
const serviceComercial = SERVICE_PLANS.find(p => p.tier === 'comercial')!;

const PREVIEW_PLANS = [
  {
    ...productComercial,
    category: 'Productos',
    recommended: true
  },
  {
    ...mixedComercial,
    category: 'Mixto',
    recommended: true
  },
  {
    ...serviceComercial,
    category: 'Servicios',
    recommended: true
  }
];

export default function PlanesPreview() {
  return (
    <section className="planes-preview-section" style={{ width: '100%', padding: '0 var(--spacing-4)' }}>
      <h2 className="section-title">Nuestros Planes</h2>
      <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-6)' }}>Comienza gratis o elige un plan diseñado para impulsar tu negocio.</p>
      <div className="plans-grid preview-grid">
        {PREVIEW_PLANS.map((plan: any, index) => (
          <div key={index} className={`plan-card preview-card glass-panel ${plan.recommended ? 'recommended' : ''}`}>
            {plan.recommended && <div className="plan-badge">MÁS ELEGIDO</div>}
            
            <div className="plan-header">
              <span className="plan-category-label">Plan {plan.category}</span>
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price">
                <span className="currency">$</span>
                <span className="amount">{plan.price}</span>
                <span className="period">/mes</span>
              </div>
              {plan.originalPrice && (
                <div className="plan-original-price">
                  Antes: <s>${plan.originalPrice}</s>
                </div>
              )}
            </div>

            <ul className="plan-features">
              {plan.features.map((feature: any, fIndex: number) => (
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

            <Link href="/planes" className={`btn ${plan.recommended ? 'btn-primary' : 'btn-outline'} plan-btn`}>
              Elegir Plan
            </Link>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-6)' }}>
        <Link href="/planes" className="btn btn-outline" style={{ padding: '12px 32px', fontSize: '1.1rem' }}>
          Ver todos los planes
        </Link>
      </div>
    </section>
  );
}
