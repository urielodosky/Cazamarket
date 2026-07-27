'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TrendingSection() {
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);

  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [showAllBusinesses, setShowAllBusinesses] = useState(false);

  useEffect(() => {
    try {
      const pStr = localStorage.getItem('cazamarket_my_products');
      if (pStr) setProducts(JSON.parse(pStr));
      
      const sStr = localStorage.getItem('cazamarket_my_services');
      if (sStr) setServices(JSON.parse(sStr));
      
      const profileStr = localStorage.getItem('cazamarket_profile');
      if (profileStr) {
        const parsed = JSON.parse(profileStr);
        setBusinesses([{
          id: 1,
          name: parsed.storeName || parsed.nombre || parsed.username || 'Mi Negocio',
          location: parsed.localidad || parsed.provincia || 'Ubicación no definida',
          image: parsed.avatar || 'https://ui-avatars.com/api/?name=Mi+Negocio&background=ff7300&color=fff'
        }]);
      }
    } catch(e) {}
  }, []);

  if (products.length === 0 && services.length === 0 && businesses.length === 0) {
    return null;
  }

  const displayedProducts = showAllProducts ? products : products.slice(0, 3);
  const displayedServices = showAllServices ? services : services.slice(0, 3);
  const displayedBusinesses = showAllBusinesses ? businesses : businesses.slice(0, 3);

  return (
    <section className="trending-section">
      <h2 className="section-title">Destacados de la Semana</h2>
      
      <div className="trending-grid">
        {/* Productos */}
        <div className="trending-column">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
            </svg>
            Top Productos
          </h3>
          <div className="trending-list">
            {displayedProducts.map(p => (
              <div key={p.id} className="trending-item glass-panel" style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/productos/${p.id}`}>
                <div className="item-img" style={{ backgroundImage: `url(${p.image || p.images?.[0]})` }}></div>
                <div className="item-info">
                  <h4>{p.name}</h4>
                  <span className="price">{p.price}</span>
                </div>
              </div>
            ))}
          </div>
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', marginTop: '16px', padding: '8px', fontSize: '0.9rem' }}
            onClick={() => setShowAllProducts(!showAllProducts)}
          >
            {showAllProducts ? 'Ver Menos' : 'Ver Más'}
          </button>
        </div>

        {/* Servicios */}
        <div className="trending-column">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Top Servicios
          </h3>
          <div className="trending-list">
            {displayedServices.map(s => (
              <div key={s.id} className="trending-item glass-panel" style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/servicios/${s.id}`}>
                <div className="item-img" style={{ backgroundImage: `url(${s.image || s.media?.[0]?.url || 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?q=80&w=1200&auto=format&fit=crop'})` }}></div>
                <div className="item-info">
                  <h4>{s.title || s.name}</h4>
                  <span className="location">{s.location || s.serviceLocation || 'Ubicación a consultar'}</span>
                </div>
              </div>
            ))}
          </div>
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', marginTop: '16px', padding: '8px', fontSize: '0.9rem' }}
            onClick={() => setShowAllServices(!showAllServices)}
          >
            {showAllServices ? 'Ver Menos' : 'Ver Más'}
          </button>
        </div>

        {/* Negocios */}
        <div className="trending-column">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
              <path d="M4 22h16"></path>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path>
            </svg>
            Top Negocios
          </h3>
          <div className="trending-list">
            {displayedBusinesses.map(b => (
              <div key={b.id} className="trending-item glass-panel" style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/negocios/${b.id}`}>
                <div className="item-icon-wrapper" style={{ overflow: 'hidden' }}>
                   {b.image.includes('unsplash') || b.image.includes('ui-avatars') || b.image.startsWith('data:') ? (
                     <img src={b.image} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
                      <path d="M12 2L2 22h20L12 2z"></path>
                    </svg>
                   )}
                </div>
                <div className="item-info">
                  <h4>{b.name}</h4>
                  <span className="location">{b.location}</span>
                </div>
              </div>
            ))}
          </div>
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', marginTop: '16px', padding: '8px', fontSize: '0.9rem' }}
            onClick={() => setShowAllBusinesses(!showAllBusinesses)}
          >
            {showAllBusinesses ? 'Ver Menos' : 'Ver Más'}
          </button>
        </div>
      </div>
    </section>
  );
}
