'use client';

import { useState, useEffect } from 'react';
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
import { createClient } from '@/lib/supabase/client';

export default function TrendingSection() {
  const [activeTab, setActiveTab] = useState<'negocios' | 'servicios' | 'productos'>('negocios');
  const [showAll, setShowAll] = useState(false);
  const [topNegocios, setTopNegocios] = useState<any[]>([]);
  const [topServicios, setTopServicios] = useState<any[]>([]);
  const [topProductos, setTopProductos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchTopData = async () => {
      setIsLoading(true);
      try {
        const { data: nData } = await supabase.rpc('get_top_negocios_semanal');
        if (nData) setTopNegocios(nData);

        const { data: pData } = await supabase.rpc('get_top_productos_semanal');
        if (pData) setTopProductos(pData);

        const { data: sData } = await supabase.rpc('get_top_servicios_semanal');
        if (sData) setTopServicios(sData);
      } catch (err) {
        console.error('Error fetching top data:', err);
      }
      setIsLoading(false);
    };

    fetchTopData();
  }, []);

  const formatNumber = (num: number) => new Intl.NumberFormat('es-AR').format(num);

  const tabs = [
    { id: 'negocios', label: 'Top Negocios', icon: <BuildingStorefrontIcon style={{ width: '20px' }} />, data: topNegocios },
    { id: 'servicios', label: 'Top Servicios', icon: <MapIcon style={{ width: '20px' }} />, data: topServicios },
    { id: 'productos', label: 'Top Productos', icon: <ShoppingBagIcon style={{ width: '20px' }} />, data: topProductos }
  ];

  const activeTabData = tabs.find(t => t.id === activeTab)!;
  const displayedItems = showAll ? activeTabData.data : activeTabData.data.slice(0, 5);

  return (
    <section className="trending-section" style={{ width: '100%', padding: '0 var(--spacing-3)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-5)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 var(--spacing-2) 0' }}>Empieza a explorar</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Empieza a explorar sobre el nicho cacería, pesca, outdoor en las siguientes secciones</p>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.name || 'Sin nombre'}</h4>
                  <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {item.ventas_concretadas} ventas
                  </span>
                </div>
                
                {activeTab === 'negocios' && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{item.type || 'Negocio'}</p>}
                {activeTab === 'servicios' && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{item.location || 'Argentina'}</p>}
                {activeTab === 'productos' && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>-</p>}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <CursorArrowRaysIcon style={{ width: '14px', height: '14px' }} /> {formatNumber(item.total_clicks || item.clicks || 0)} interacciones
                </div>
              </div>
            </Link>
          )) : (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-4) 0' }}>
              {isLoading ? 'Cargando ranking semanal...' : `No hay ${activeTabData.label.toLowerCase()} para mostrar esta semana.`}
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
