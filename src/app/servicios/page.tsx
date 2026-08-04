'use client';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import SkeletonCard from '@/components/ui/SkeletonCard';
import LoadingScreen from '@/components/ui/LoadingScreen';

import { useFavorites } from '@/contexts/FavoritesContext';
import { useCart } from '@/contexts/CartContext';
import { usePlan } from '@/contexts/PlanContext';

const SERVICIOS_DATA: any[] = [];

function formatAddress(raw: string) {
  if (!raw) return 'Ubicación a consultar';
  const parts = raw.split(',').map(p => p.trim());
  if (parts.length < 4) return raw;

  const p0 = parts[0];
  const p1 = parts[1];
  let addressLine = isNaN(Number(p0)) ? p0 : `${p1} ${p0}`;

  const filtered = parts.filter(p => {
    const pLow = p.toLowerCase();
    if (pLow.includes('municipio') || pLow.includes('pedanía') || pLow.includes('departamento')) return false;
    if (p.match(/^[A-Z0-9]{4,8}$/)) return false;
    return true;
  });

  if (!raw) return '';
  return raw.length > 35 ? raw.substring(0, 32) + '...' : raw;
}

function ServiciosContent() {
  const { isVendorModeActive } = useAuth();
  const { hasFeature, permissions } = usePlan();
  const [localServices, setLocalServices] = useState<any[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [theme, setTheme] = useState<{primaryColor?: string, textColor?: string, bgColor?: string} | null>(null);
  
  const searchParams = useSearchParams();
  const q = searchParams?.get('q')?.toLowerCase() || '';
  const filterCategoria = searchParams?.get('categoria') || '';

  const allowedMisServicios = localServices.slice(0, permissions.maxServicios);
  const rawDisplayData = isVendorModeActive ? allowedMisServicios : [...localServices, ...SERVICIOS_DATA];
  
  const displayData = rawDisplayData.filter(servicio => {
    if (q) {
      const titleMatch = servicio.name?.toLowerCase().includes(q);
      const descMatch = servicio.description?.toLowerCase().includes(q);
      if (!titleMatch && !descMatch) return false;
    }

    if (filterCategoria) {
      const sCat = servicio.category?.toLowerCase() || '';
      const sSub = servicio.subcategory?.toLowerCase() || '';
      const fCat = filterCategoria.toLowerCase();
      const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normFCat = normalize(fCat);
      if (normalize(sCat) !== normFCat && normalize(sSub) !== normFCat) return false;
    }

    return true;
  });

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart, canAddToCart } = useCart();

  const handleDeleteService = (e: React.MouseEvent, id: any) => {
    e.stopPropagation();
    const updated = localServices.filter(s => String(s.id) !== String(id));
    setLocalServices(updated);
    localStorage.setItem('cazamarket_my_services', JSON.stringify(updated));

    const prodsStr = localStorage.getItem('cazamarket_my_products');
    if (prodsStr) {
      try {
        const prods = JSON.parse(prodsStr);
        const updatedProds = prods.filter((p: any) => String(p.id) !== String(id));
        localStorage.setItem('cazamarket_my_products', JSON.stringify(updatedProds));
      } catch (err) {}
    }
  };

  useEffect(() => {
    const existingStr = localStorage.getItem('cazamarket_my_services');
    if (existingStr) {
      setLocalServices(JSON.parse(existingStr));
    }
    const savedProfile = localStorage.getItem('cazamarket_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.theme) setTheme(parsed.theme);
      } catch (e) {}
    }
    setIsLoading(false);
  }, []);

  return (
    <div style={{ padding: 'var(--spacing-8) var(--spacing-4)', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
      
      {(isVendorModeActive && permissions.maxServicios > 0) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
          <div>
            <h1 style={{ fontSize: '2rem', margin: 0, color: 'var(--color-text-main)' }}>Mis Servicios</h1>
            <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>Administra los servicios que ofreces.</p>
          </div>
          <button className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: 'var(--radius-full)' }} onClick={() => router.push('/mis-tiendas/nuevo-servicio')}>
            + Nuevo Servicio
          </button>
        </div>
      )}

      <div className="responsive-grid-280">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : displayData.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-lg)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            {(isVendorModeActive && permissions.maxServicios > 0) ? (
              <>
                <h3 style={{ color: 'var(--color-text-main)', fontSize: '1.2rem', marginBottom: '8px' }}>No tienes servicios publicados</h3>
                <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', marginBottom: '24px' }}>Empieza a ofrecer tus servicios, cursos o guías en CazaMarket. Llega a miles de clientes buscando tu experiencia.</p>
                <button className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: 'var(--radius-full)' }} onClick={() => router.push('/mis-tiendas')}>
                  Crear mi primer servicio
                </button>
              </>
            ) : (
              <>
                <h3 style={{ color: 'var(--color-text-main)', fontSize: '1.2rem', marginBottom: '8px' }}>No hay servicios disponibles</h3>
                <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px' }}>Aún no hay servicios publicados en esta categoría.</p>
              </>
            )}
          </div>
        ) : (
          displayData.map(servicio => {
            const cardTheme = (servicio.storeId === 1 && permissions.coloresPersonalizados && theme) ? theme : (servicio.seller?.theme ? servicio.seller.theme : null);
            const cardStyles = cardTheme ? {
              '--color-primary': cardTheme.primaryColor,
              '--color-text-main': cardTheme.textColor,
              '--color-bg-base': cardTheme.bgColor,
              backgroundColor: cardTheme.bgColor
            } as React.CSSProperties : {};
            
            return (
          <div key={servicio.id} className="glass-panel" 
               onClick={() => router.push(`/servicios/${servicio.id}`)}
               style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'pointer', ...cardStyles }}
               onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>

            {/* Favoritos */}
            <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 10 }}>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleFavorite('servicios', servicio.id.toString()); }}
                style={{ 
                  background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  color: isFavorite('servicios', servicio.id.toString()) ? '#ff4d4d' : 'rgba(255,255,255,0.7)', transition: 'all 0.2s', backdropFilter: 'blur(4px)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ff4d4d'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = isFavorite('servicios', servicio.id.toString()) ? '#ff4d4d' : 'rgba(255,255,255,0.7)'; e.currentTarget.style.transform = 'scale(1)'; }}
                title={isFavorite('servicios', servicio.id.toString()) ? "Quitar de favoritos" : "Añadir a favoritos"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite('servicios', servicio.id.toString()) ? '#ff4d4d' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              </button>
            </div>

            {/* Menú de 3 Puntos (Editar / Eliminar) */}
            {(isVendorModeActive || localServices.some(s => s.id === servicio.id)) && (
              <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 20 }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === servicio.id ? null : servicio.id); }}
                  style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', transition: 'all 0.2s', backdropFilter: 'blur(4px)' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                </button>
                
                {openMenuId === servicio.id && (
                  <div style={{ position: 'absolute', top: '40px', right: '0', background: '#1f241a', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '120px', boxShadow: '0 4px 12px rgba(0,0,0,0.8)', zIndex: 30 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); router.push(`/mis-tiendas/nuevo-servicio?editId=${servicio.id}`); }}
                      style={{ background: 'transparent', border: 'none', padding: '8px 12px', textAlign: 'left', color: 'var(--color-text-main)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      Editar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleDeleteService(e, servicio.id); }}
                      style={{ background: 'transparent', border: 'none', padding: '8px 12px', textAlign: 'left', color: '#ef4444', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="aspect-image-16-9" style={{ backgroundImage: `url(${(servicio.media && servicio.media.length > 0 ? servicio.media[0].url : servicio.image) || 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?q=80&w=1200&auto=format&fit=crop'})` }}>
              <span style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '85%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatAddress(servicio.serviceLocation || servicio.location)}</span>
              </span>
            </div>
            <div className="card-content-fluid">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                 <div 
                   style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: (servicio.storeId === 1 && !hasFeature('tiendaVirtual')) ? 'default' : 'pointer' }}
                   onClick={(e) => {
                     e.stopPropagation();
                     if (servicio.storeId === 1 && !hasFeature('tiendaVirtual')) return;
                     if (servicio.storeId) router.push(`/negocios/${servicio.storeId}`);
                   }}
                 >
                   <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
                     <img 
                       src={servicio.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(servicio.store || servicio.provider || 'Mi Negocio')}&background=ff7300&color=fff`} 
                       alt={servicio.provider || servicio.store || 'Vendedor'} 
                       onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(servicio.store || servicio.provider || 'Mi Negocio')}&background=ff7300&color=fff`; }}
                       style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-border)' }} 
                     />
                     {(servicio.storeId === 1 ? hasFeature('insigniaVerificada') : servicio.verified) && (
                       <span title="Negocio Verificado" style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-bg-base)' }}>
                         <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                       </span>
                     )}
                   </div>
                   <span style={{ color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                     {servicio.provider || servicio.store || servicio.seller?.name || 'Mi Negocio'}
                   </span>
                 </div>
              </div>
              <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-main)', margin: 0 }}>{servicio.title || servicio.name}</h3>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(servicio.category || servicio.categoria) && (
                    <span style={{ fontSize: '0.75rem', background: 'rgba(255,115,0,0.15)', color: 'var(--color-primary)', border: '1px solid rgba(255,115,0,0.3)', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontWeight: 600, display: 'inline-block' }}>
                      {servicio.category || servicio.categoria}
                    </span>
                  )}
                  {servicio.subcategory && (
                    <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', color: 'var(--color-text-muted)', border: '1px solid rgba(255,255,255,0.15)', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontWeight: 500, display: 'inline-block' }}>
                      {servicio.subcategory}
                    </span>
                  )}
                </div>
              </div>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 var(--spacing-4) 0', flex: 1 }}>
                {servicio.features?.map((feature: any, i: number) => (
                  <li key={i} style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--color-primary)' }}>✓</span> {feature}
                  </li>
                ))}
              </ul>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', display: 'block', marginBottom: '2px' }}>Precio Base</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    {servicio.price}
                    {servicio.pricePeriod && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: '4px' }}>
                        {servicio.pricePeriod.startsWith('/') ? servicio.pricePeriod : `/ ${servicio.pricePeriod}`}
                      </span>
                    )}
                  </span>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/servicios/${servicio.id}`);
                  }}
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: 'var(--radius-full)', 
                    color: 'var(--color-primary)', 
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    background: 'transparent',
                    border: '1px solid var(--color-primary)',
                    cursor: 'pointer'
                  }}
                >
                  Ver servicio
                </button>
              </div>
            </div>
          </div>
          );
        }))}
      </div>
    </div>
  );
}

export default function ServiciosPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: 'var(--spacing-8) var(--spacing-4)', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
        <div className="responsive-grid-280">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    }>
      <ServiciosContent />
    </Suspense>
  );
}
