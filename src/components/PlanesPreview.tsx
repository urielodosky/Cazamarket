import Link from 'next/link';
import '../app/planes/planes.css';

const PREVIEW_PLANS = [
  {
    name: 'Emprendedor',
    category: 'Productos',
    price: 18,
    features: [
      { text: '40 Productos', included: true },
      { text: 'Banner + Categorías', included: true },
      { text: 'Botón WhatsApp', included: true },
      { text: 'Chat interno', included: false },
    ],
    recommended: false
  },
  {
    name: 'Comercial',
    category: 'Mixto',
    originalPrice: 64,
    price: 60,
    features: [
      { text: '100 Prods + 10 Servs', included: true },
      { text: 'Carrito a WhatsApp', included: true },
      { text: 'Chat + Mapas', included: true },
      { text: 'Bot asesor', included: false },
    ],
    recommended: true
  },
  {
    name: 'Emprendedor',
    category: 'Servicios',
    price: 18,
    features: [
      { text: '5 Servicios', included: true },
      { text: 'Banner + Categorías', included: true },
      { text: 'Botón WhatsApp', included: true },
      { text: 'Mapas ni calendario', included: false },
    ],
    recommended: false
  }
];

export default function PlanesPreview() {
  return (
    <section className="planes-preview-section" style={{ width: '100%', maxWidth: '1200px', marginTop: 'var(--spacing-4)', marginBottom: 'var(--spacing-8)', padding: 'var(--spacing-2) 0' }}>
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
