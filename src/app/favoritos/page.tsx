'use client';

import React, { useState, useEffect } from 'react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useRouter } from 'next/navigation';
import { isAtLeast } from '@/types/planTypes';
import { createClient } from '@/lib/supabase/client';
import { usePlan } from '@/contexts/PlanContext';

export default function FavoritosPage() {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [activeTab, setActiveTab] = useState<'negocios' | 'productos' | 'servicios'>('negocios');
  const router = useRouter();
  const { permissions, planTier } = usePlan();

  const [savedNegocios, setSavedNegocios] = useState<any[]>([]);
  const [savedProductos, setSavedProductos] = useState<any[]>([]);
  const [savedServicios, setSavedServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      const supabase = createClient();

      // Fetch Productos
      if (favorites.productos.length > 0) {
        const { data } = await supabase.from('products').select('*, profiles(first_name, last_name, full_name, avatar_url, store_name, branches)').in('id', favorites.productos);
        if (data) setSavedProductos(data);
      } else {
        setSavedProductos([]);
      }

      // Fetch Servicios
      if (favorites.servicios.length > 0) {
        const { data } = await supabase.from('services').select('*, profiles(first_name, last_name, full_name, avatar_url, store_name, branches)').in('id', favorites.servicios);
        if (data) setSavedServicios(data);
      } else {
        setSavedServicios([]);
      }

      // Fetch Negocios
      const loadedNegocios: any[] = [];
      if (favorites.negocios.includes('1')) {
        // Fallback for mock 'Mi Negocio'
        const savedProfile = localStorage.getItem('cazamarket_profile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          loadedNegocios.push({
            id: '1',
            name: parsed.storeName || parsed.username || parsed.nombre || 'Mi Negocio',
            rating: 0,
            reviews: 0,
            image: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?q=80&w=1200&auto=format&fit=crop',
            avatar: parsed.avatar || 'https://ui-avatars.com/api/?name=Mi+Negocio&background=ff7300&color=fff',
            planTier: planTier,
            description: parsed.storeDescription || 'Bienvenido a mi tienda oficial en CazaMarket.',
            businessType: parsed.businessType || 'Tienda',
            categories: parsed.categories ? (Array.isArray(parsed.categories) ? parsed.categories : [parsed.categories]) : [],
            locations: [],
            productsCount: 0,
            servicesCount: 0,
          });
        }
      }
      // Optional: fetch real businesses from 'profiles' if they have real uuids in the future
      
      setSavedNegocios(loadedNegocios);
      setLoading(false);
    };

    fetchFavorites();
  }, [favorites, planTier]);

  const renderHeart = (type: 'negocios'|'productos'|'servicios', id: string) => (
    <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 10 }}>
      <button 
        onClick={(e) => { e.stopPropagation(); toggleFavorite(type, id); }}
        style={{ 
          background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          color: isFavorite(type, id) ? '#ff4d4d' : 'rgba(255,255,255,0.7)', transition: 'all 0.2s', backdropFilter: 'blur(4px)'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#ff4d4d'; e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = isFavorite(type, id) ? '#ff4d4d' : 'rgba(255,255,255,0.7)'; e.currentTarget.style.transform = 'scale(1)'; }}
        title={isFavorite(type, id) ? "Quitar de favoritos" : "Añadir a favoritos"}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite(type, id) ? '#ff4d4d' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
      </button>
    </div>
  );

  return (
    <div style={{ padding: 'var(--spacing-8) var(--spacing-4)', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
      <div style={{ marginBottom: 'var(--spacing-8)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0, color: 'var(--color-text-main)' }}>Mis Favoritos</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>Aquí encontrarás todo lo que has guardado.</p>
        </div>
        <button 
          onClick={() => router.push('/resenas')}
          style={{
            background: 'rgba(255, 115, 0, 0.1)',
            border: '1px solid var(--color-primary)',
            padding: '8px 16px',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: 'var(--color-primary)',
            borderRadius: '20px',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          Mis Reseñas
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', overflowX: 'auto' }}>
        {(['negocios', 'productos', 'servicios'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px 16px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              textTransform: 'capitalize',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'negocios' && (
        savedNegocios.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No tienes negocios guardados en favoritos.</p>
        ) : (
          <div className="responsive-grid-300">
            {savedNegocios.map(negocio => (
              <div key={negocio.id} className="glass-panel" 
                   onClick={() => router.push(`/negocios/${negocio.id}`)}
                   style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                {renderHeart('negocios', negocio.id.toString())}
                {isAtLeast(negocio.planTier, 'emprendedor') && (
                  <div className="aspect-image-16-9" style={{ backgroundImage: `url(${negocio.image})`, minHeight: '120px', height: '120px' }} />
                )}
                <div className="card-content-fluid" style={{ paddingTop: isAtLeast(negocio.planTier, 'emprendedor') ? '0px' : '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', position: 'relative', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: isAtLeast(negocio.planTier, 'emprendedor') ? '40px' : '80px', position: 'relative', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', bottom: '0', left: '0', width: '80px', height: '80px', borderRadius: '50%', backgroundImage: `url(${negocio.avatar})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '4px solid var(--color-bg-base)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-main)', margin: '0 0 6px 0' }}>{negocio.name}</h3>
                    </div>
                  </div>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>{negocio.description}</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'productos' && (
        savedProductos.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No tienes productos guardados en favoritos.</p>
        ) : (
          <div className="responsive-grid-250">
            {savedProductos.map(producto => (
              <div key={producto.id} className="glass-panel" 
                   onClick={() => router.push(`/productos/${producto.id}`)}
                   style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                {renderHeart('productos', producto.id.toString())}
                <div className="aspect-image-4-3" style={{ backgroundImage: `url(${producto.image})` }} />
                <div className="card-content-fluid" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: 'var(--color-text-main)' }}>{producto.name}</h3>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{producto.condition}</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{producto.price}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'servicios' && (
        savedServicios.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No tienes servicios guardados en favoritos.</p>
        ) : (
          <div className="responsive-grid-280">
            {savedServicios.map(servicio => (
              <div key={servicio.id} className="glass-panel" 
                   onClick={() => router.push(`/servicios/${servicio.id}`)}
                   style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                {renderHeart('servicios', servicio.id.toString())}
                <div className="aspect-image-16-9" style={{ backgroundImage: `url(${servicio.image})` }} />
                <div className="card-content-fluid">
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: 'var(--color-text-main)' }}>{servicio.title}</h3>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{servicio.price}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
