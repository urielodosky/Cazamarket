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
      <div className="trending-column" style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', color: 'var(--primary-color)', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
          {icon}
          {title}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {displayedItems.map((item, index) => (
            <Link 
              key={item.id} 
              href={`/${type}/${item.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none', color: 'inherit', padding: '10px', borderRadius: 'var(--radius-md)', transition: 'background 0.2s' }}
              className="trending-item-hover"
            >
              <div style={{ position: 'relative' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--border-color)', backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              </div>
              
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.name}</h4>
                
                {type === 'negocios' && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.type}</p>}
                {type === 'servicios' && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.location}</p>}
                {type === 'productos' && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>-</p>}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
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
          style={{ width: '100%', marginTop: '20px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--primary-color)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold' }}
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
    <section className="trending-section" style={{ width: '100%', maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 10px 0' }}>Los Más Populares</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Descubre lo más visitado y buscado por la comunidad esta semana.</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
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
