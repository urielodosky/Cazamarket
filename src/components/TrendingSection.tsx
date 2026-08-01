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
  const [activeTab, setActiveTab] = useState<'negocios' | 'servicios' | 'productos'>('negocios');
  const [showAll, setShowAll] = useState(false);

  const formatNumber = (num: number) => new Intl.NumberFormat('es-AR').format(num);

  const tabs = [
    { id: 'negocios', label: 'Top Negocios', icon: <BuildingStorefrontIcon style={{ width: '20px' }} />, data: TOP_NEGOCIOS },
    { id: 'servicios', label: 'Top Servicios', icon: <MapIcon style={{ width: '20px' }} />, data: TOP_SERVICIOS },
    { id: 'productos', label: 'Top Productos', icon: <ShoppingBagIcon style={{ width: '20px' }} />, data: TOP_PRODUCTOS }
  ];

  const activeTabData = tabs.find(t => t.id === activeTab)!;
  const displayedItems = showAll ? activeTabData.data : activeTabData.data.slice(0, 5);

  return (
    <section className="trending-section" style={{ width: '100%', padding: '0 var(--spacing-3)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-5)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 var(--spacing-2) 0' }}>Los Más Populares</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Descubre lo más visitado y buscado por la comunidad esta semana.</p>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setShowAll(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)',
              padding: 'var(--spacing-2) var(--spacing-4)',
              borderRadius: 'var(--radius-full)',
              background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--color-text-muted)',
              border: `1px solid ${activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
              minHeight: '44px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--color-bg-surface-elevated)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          {displayedItems.length > 0 ? displayedItems.map((item, index) => (
            <Link 
              key={item.id} 
              href={`/${activeTab}/${item.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', textDecoration: 'none', color: 'inherit', padding: 'var(--spacing-2)', borderRadius: 'var(--radius-md)', transition: 'background 0.2s', minHeight: '44px' }}
              className="trending-item-hover"
            >
              <div style={{ position: 'relative' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-border)', backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              </div>
              
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.name}</h4>
                
                {activeTab === 'negocios' && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{item.type}</p>}
                {activeTab === 'servicios' && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{item.location}</p>}
                {activeTab === 'productos' && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>-</p>}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {activeTab === 'negocios' ? (
                    <><EyeIcon style={{ width: '14px', height: '14px' }} /> {formatNumber(item.views)} visitas</>
                  ) : (
                    <><CursorArrowRaysIcon style={{ width: '14px', height: '14px' }} /> {formatNumber(item.clicks)} clics</>
                  )}
                </div>
              </div>
            </Link>
          )) : (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-4) 0' }}>
              No hay {activeTabData.label.toLowerCase()} para mostrar esta semana.
            </p>
          )}
        </div>

        {activeTabData.data.length > 5 && (
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
        )}
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
