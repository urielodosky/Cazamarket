'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  BuildingStorefrontIcon, 
  MapIcon, 
  ShoppingBagIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  EyeIcon,
  CursorArrowRaysIcon
} from '@heroicons/react/24/outline';

const TOP_NEGOCIOS: any[] = [];
const TOP_SERVICIOS: any[] = [];
const TOP_PRODUCTOS: any[] = [];

export default function TrendingSection() {
  const [showAllBusinesses, setShowAllBusinesses] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);

  const formatNumber = (num: number) => new Intl.NumberFormat('es-AR').format(num);

  const renderList = (
    title: string, 
    icon: React.ReactNode, 
    items: any[], 
    showAll: boolean, 
    setShowAll: (v: boolean) => void,
    type: 'negocios' | 'servicios' | 'productos'
  ) => {
    const displayedItems = showAll ? items : items.slice(0, 5);

    return (
      <div className="trending-column" style={{ background: 'var(--color-bg-surface-elevated)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: '1.25rem', color: 'var(--color-primary)', marginBottom: 'var(--spacing-4)', paddingBottom: 'var(--spacing-2)', borderBottom: '1px solid var(--color-border)' }}>
          {icon}
          {title}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          {displayedItems.map((item, index) => (
            <Link 
              key={item.id} 
              href={`/${type}/${item.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', textDecoration: 'none', color: 'inherit', padding: 'var(--spacing-2)', borderRadius: 'var(--radius-md)', transition: 'background 0.2s', minHeight: '44px' }}
              className="trending-item-hover"
            >
              <div style={{ position: 'relative' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-border)', backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              </div>
              
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.name}</h4>
                
                {type === 'negocios' && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{item.type}</p>}
                {type === 'servicios' && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{item.location}</p>}
                {type === 'productos' && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>-</p>}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {type === 'negocios' ? (
                    <><EyeIcon style={{ width: '14px', height: '14px' }} /> {formatNumber(item.views)} visitas</>
                  ) : (
                    <><CursorArrowRaysIcon style={{ width: '14px', height: '14px' }} /> {formatNumber(item.clicks)} clics</>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <button 
          onClick={() => setShowAll(!showAll)}
          style={{ width: '100%', marginTop: 'var(--spacing-4)', minHeight: '44px', padding: 'var(--spacing-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-2)', background: 'transparent', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-primary)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold' }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(220,100,0,0.05)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {showAll ? (
            <>Ver Menos <ChevronUpIcon style={{ width: '16px' }} /></>
          ) : (
            <>Mostrar Más (Top 10) <ChevronDownIcon style={{ width: '16px' }} /></>
          )}
        </button>
      </div>
    );
  };

  return (
    <section className="trending-section" style={{ width: '100%', padding: '0 var(--spacing-3)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-5)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 var(--spacing-2) 0' }}>Los Más Populares</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Descubre lo más visitado y buscado por la comunidad esta semana.</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-5)' }}>
        {renderList("Top Negocios", <BuildingStorefrontIcon style={{ width: '24px' }} />, TOP_NEGOCIOS, showAllBusinesses, setShowAllBusinesses, 'negocios')}
        {renderList("Top Servicios", <MapIcon style={{ width: '24px' }} />, TOP_SERVICIOS, showAllServices, setShowAllServices, 'servicios')}
        {renderList("Top Productos", <ShoppingBagIcon style={{ width: '24px' }} />, TOP_PRODUCTOS, showAllProducts, setShowAllProducts, 'productos')}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .trending-item-hover:hover {
          background-color: rgba(255,255,255,0.05);
          transform: translateX(5px);
        }
      `}} />
    </section>
  );
}
