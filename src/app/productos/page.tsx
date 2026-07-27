'use client';
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import SkeletonCard from '@/components/ui/SkeletonCard';
import LoadingScreen from '@/components/ui/LoadingScreen';

import { useFavorites } from '@/contexts/FavoritesContext';
import { useCart } from '@/contexts/CartContext';
import { usePlan } from '@/contexts/PlanContext';

import { PRODUCTOS_DATA } from '@/data/mock';

const MIS_PRODUCTOS_DATA: typeof PRODUCTOS_DATA = [];

function ProductosContent() {
  const { isVendorModeActive } = useAuth();
  const { hasFeature, permissions } = usePlan();
  const displayData = isVendorModeActive ? MIS_PRODUCTOS_DATA : PRODUCTOS_DATA;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart, canAddToCart } = useCart();
  const [localProducts, setLocalProducts] = useState<any[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [theme, setTheme] = useState<{primaryColor?: string, textColor?: string, bgColor?: string} | null>(null);

  const handleDeleteProduct = (e: React.MouseEvent, id: any) => {
    e.stopPropagation();
    const updated = localProducts.filter(p => String(p.id) !== String(id));
    setLocalProducts(updated);
    localStorage.setItem('cazamarket_my_products', JSON.stringify(updated));

    const servsStr = localStorage.getItem('cazamarket_my_services');
    if (servsStr) {
      try {
        const servs = JSON.parse(servsStr);
        const updatedServs = servs.filter((s: any) => String(s.id) !== String(id));
        localStorage.setItem('cazamarket_my_services', JSON.stringify(updatedServs));
      } catch (err) {}
    }
  };

  useEffect(() => {
    const existingStr = localStorage.getItem('cazamarket_my_products');
    if (existingStr) {
      setLocalProducts(JSON.parse(existingStr));
    }
    const savedProfile = localStorage.getItem('cazamarket_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.theme) setTheme(parsed.theme);
      } catch (e) {}
    }
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const searchParams = useSearchParams();
  const q = searchParams?.get('q')?.toLowerCase() || '';
  const filterCategoria = searchParams?.get('categoria') || '';
  const filterProvincia = searchParams?.get('provincia') || '';
  const filterLocalidad = searchParams?.get('localidad') || '';
  const filterOfrece = searchParams?.get('ofrece') || '';
  const filterTipo = searchParams?.get('tipo') || '';

  const allowedLocalProducts = localProducts.slice(0, permissions.maxProductos);
  const rawMergedData = [...allowedLocalProducts, ...displayData];
  
  const mergedData = rawMergedData.filter((producto) => {
    // 1. Filtrar por búsqueda de texto (q)
    if (q) {
      const titleMatch = producto.name?.toLowerCase().includes(q);
      const descMatch = producto.description?.toLowerCase().includes(q);
      
      // Buscar en características si existen
      let featuresMatch = false;
      if (producto.features && Array.isArray(producto.features)) {
        featuresMatch = producto.features.some((f: any) => 
          f.name?.toLowerCase().includes(q) || f.value?.toLowerCase().includes(q)
        );
      }
      
      if (!titleMatch && !descMatch && !featuresMatch) return false;
    }
    
    // 2. Filtrar por categoría (ej: "armeria", "pesca", etc.)
    // Note: Navbar uses lowercase 'armeria', product might be 'Armería'
    if (filterCategoria) {
      const pCat = producto.category?.toLowerCase() || '';
      const pSub = producto.subcategory?.toLowerCase() || '';
      const fCat = filterCategoria.toLowerCase();
      const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normFCat = normalize(fCat);
      if (normalize(pCat) !== normFCat && normalize(pSub) !== normFCat) return false;
    }

    // 3. Filtrar por tipo (Condición: 'nuevo' o 'usado')
    if (filterTipo && producto.condition?.toLowerCase() !== filterTipo.toLowerCase()) {
      return false;
    }

    // 4. Filtrar por ofrece (Envío, Envío gratis, Retiro)
    if (filterOfrece) {
      // In a real app we'd check real properties. We approximate for now.
      if (filterOfrece === 'envio_gratis') {
        // Assume seller.shippingCost === 0 means free shipping, or product has it
        if (producto.seller?.shippingCost !== 0 && producto.shippingCost !== 0) return false;
      }
      // 'retiro' implies branches exist
      if (filterOfrece === 'retiro') {
        if (!producto.seller?.branches || producto.seller.branches.length === 0) return false;
      }
    }
    
    // 5. Filtrar por provincia
    if (filterProvincia) {
      if (!producto.seller?.branches || producto.seller.branches.length === 0) return false;
      const hasProvincia = producto.seller.branches.some((b: any) => b.province === filterProvincia);
      if (!hasProvincia) return false;
    }

    // 6. Filtrar por localidad
    if (filterLocalidad) {
      if (!producto.seller?.branches || producto.seller.branches.length === 0) return false;
      const hasLocalidad = producto.seller.branches.some((b: any) => b.city === filterLocalidad);
      if (!hasLocalidad) return false;
    }

    return true;
  });

  return (
    <div style={{ padding: 'var(--spacing-8) var(--spacing-4)', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
      {isVendorModeActive && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
          <div>
            <h1 style={{ fontSize: '2rem', margin: 0, color: 'var(--color-text-main)' }}>Mis Productos</h1>
            <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>Administra tu inventario y publicaciones.</p>
          </div>
          <button className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: 'var(--radius-full)' }} onClick={() => router.push('/mis-tiendas/nuevo-producto')}>
            + Nuevo Producto
          </button>
        </div>
      )}

      <div className="responsive-grid-250">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : mergedData.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-lg)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            {isVendorModeActive ? (
              <>
                <h3 style={{ color: 'var(--color-text-main)', fontSize: '1.2rem', marginBottom: '8px' }}>No tienes productos publicados</h3>
                <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', marginBottom: '24px' }}>Comienza a vender en CazaMarket creando tu primer producto. Puedes agregar fotos, descripciones y gestionar tu inventario.</p>
                <button className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: 'var(--radius-full)' }} onClick={() => router.push('/mis-tiendas')}>
                  Crear mi primer producto
                </button>
              </>
            ) : (
              <>
                <h3 style={{ color: 'var(--color-text-main)', fontSize: '1.2rem', marginBottom: '8px' }}>No hay productos disponibles</h3>
                <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px' }}>Aún no hay productos publicados en esta categoría.</p>
              </>
            )}
          </div>
        ) : (
          mergedData.map(producto => {
            const cardTheme = (producto.storeId === 1 && permissions.coloresPersonalizados && theme) ? theme : (producto.seller?.theme ? producto.seller.theme : null);
            const cardStyles = cardTheme ? {
              '--color-primary': cardTheme.primaryColor,
              '--color-text-main': cardTheme.textColor,
              '--color-bg-base': cardTheme.bgColor,
              backgroundColor: cardTheme.bgColor
            } as React.CSSProperties : {};
            
            return (
          <div key={producto.id} className="glass-panel" 
               onClick={() => router.push(`/productos/${producto.id}`)}
               style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'pointer', ...cardStyles }}
               onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>

            {/* Menu Button (Only for vendor's own products) */}
            {isVendorModeActive && producto.storeId === 1 && (
              <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 20 }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === producto.id ? null : producto.id); }}
                  style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', transition: 'all 0.2s', backdropFilter: 'blur(4px)' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                </button>
                
                {openMenuId === producto.id && (
                  <div style={{ position: 'absolute', top: '40px', right: '0', background: '#1f241a', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '120px', boxShadow: '0 4px 12px rgba(0,0,0,0.8)', zIndex: 30 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); router.push(`/mis-tiendas/nuevo-producto?editId=${producto.id}`); }}
                      style={{ background: 'transparent', border: 'none', padding: '8px 12px', textAlign: 'left', color: 'var(--color-text-main)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      Editar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleDeleteProduct(e, producto.id); }}
                      style={{ background: 'transparent', border: 'none', padding: '8px 12px', textAlign: 'left', color: '#ef4444', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Favoritos */}
            <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 10 }}>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleFavorite('productos', producto.id.toString()); }}
                style={{ 
                  background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  color: isFavorite('productos', producto.id.toString()) ? '#ff4d4d' : 'rgba(255,255,255,0.7)', transition: 'all 0.2s', backdropFilter: 'blur(4px)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ff4d4d'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = isFavorite('productos', producto.id.toString()) ? '#ff4d4d' : 'rgba(255,255,255,0.7)'; e.currentTarget.style.transform = 'scale(1)'; }}
                title={isFavorite('productos', producto.id.toString()) ? "Quitar de favoritos" : "Añadir a favoritos"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite('productos', producto.id.toString()) ? '#ff4d4d' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              </button>
            </div>
            <div className="aspect-image-4-3" style={{ backgroundImage: `url(${producto.image})` }}>
            </div>
            <div className="card-content-fluid" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                 <div 
                   style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: (producto.storeId === 1 && !hasFeature('tiendaVirtual')) ? 'default' : 'pointer' }}
                   onClick={(e) => {
                     e.stopPropagation();
                     if (producto.storeId === 1 && !hasFeature('tiendaVirtual')) return;
                     if (producto.storeId) router.push(`/negocios/${producto.storeId}`);
                   }}
                 >
                   <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
                     <img 
                       src={producto.avatar} 
                       alt={producto.store} 
                       style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-border)', color: 'transparent' }} 
                     />
                     {(producto.storeId === 1 ? hasFeature('insigniaVerificada') : producto.verified) && (
                       <span title="Negocio Verificado" style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-bg-base)' }}>
                         <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                       </span>
                     )}
                   </div>
                   <span style={{ color: 'var(--color-primary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                     {producto.store}
                   </span>
                 </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      {producto.category}
                    </span>
                    {producto.subcategory && (
                      <span style={{ background: 'rgba(255, 115, 0, 0.1)', color: 'var(--color-primary)', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255, 115, 0, 0.2)' }}>
                        {producto.subcategory}
                      </span>
                    )}
                  </div>
              </div>

              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-main)', margin: '0 0 var(--spacing-2) 0' }}>{producto.name}</h3>
              
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.4, margin: '0 0 var(--spacing-4) 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {producto.description}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{producto.condition}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    {producto.price.includes(' ') ? (
                      <>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#a8b87c' }}>{producto.price.split(' ').slice(1).join(' ')}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#a8b87c' }}>{producto.price.split(' ')[0]}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#a8b87c' }}>{producto.price}</span>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/productos/${producto.id}`);
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
                  Ver
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

export default function ProductosPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  if (!mounted) {
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <ProductosContent />
    </Suspense>
  );
}
