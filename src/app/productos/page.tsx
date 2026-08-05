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
import { createClient } from '@/lib/supabase/client';

function ProductosContent() {
  const { isVendorModeActive } = useAuth();
  const { hasFeature, permissions } = usePlan();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart, canAddToCart } = useCart();
  const [localProducts, setLocalProducts] = useState<any[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [theme, setTheme] = useState<{primaryColor?: string, textColor?: string, bgColor?: string} | null>(null);

  const handleDeleteProduct = async (e: React.MouseEvent, id: any) => {
    e.stopPropagation();
    
    const supabase = createClient();
    // Delete from Supabase (solo funciona si el usuario es el dueño gracias a RLS)
    await supabase.from('products').delete().eq('id', id);

    const updated = localProducts.filter(p => String(p.id) !== String(id));
    setLocalProducts(updated);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const supabase = createClient();
      let query = supabase.from('products').select('*, profiles(first_name, last_name, full_name, avatar_url, store_name, branches)');
      
      // En modo vendedor en esta vista específica, mostramos solo sus productos
      // Opcional: si queremos que el vendedor vea el marketplace completo, podemos quitar esto
      // pero mantenemos el comportamiento actual por ahora.
      const { data: userData } = await supabase.auth.getUser();
      if (isVendorModeActive && userData?.user) {
        query = query.eq('user_id', userData.user.id);
      }
      
      const { data, error } = await query;
      if (data && !error) {
        const ratingsMap: Record<number, { sum: number, count: number }> = {};
        try {
          const { data: allReviews, error: revError } = await supabase
            .from('reviews')
            .select('product_rating, interactions!inner(product_id)')
            .eq('interactions.status', 'published')
            .not('interactions.product_id', 'is', null);
            
          if (allReviews && !revError) {
            allReviews.forEach((r: any) => {
              const pId = r.interactions?.product_id;
              if (pId && r.product_rating) {
                if (!ratingsMap[pId]) ratingsMap[pId] = { sum: 0, count: 0 };
                ratingsMap[pId].sum += r.product_rating;
                ratingsMap[pId].count += 1;
              }
            });
          }
        } catch (e) {
          console.warn('Could not fetch reviews rating', e);
        }

        // Fallback al perfil guardado localmente si es el mismo usuario
        const localProf = localStorage.getItem('cazamarket_profile');
        let parsedProf: any = null;
        if (localProf) {
          try { parsedProf = JSON.parse(localProf); } catch (e) {}
        }
        
        const formattedData = data.map(p => {
          const isOwn = userData?.user?.id === p.user_id;
          const fallbackStore = isOwn && parsedProf ? (parsedProf.storeName || parsedProf.username || parsedProf.firstName) : 'Usuario Anónimo';
          const fallbackAvatar = isOwn && parsedProf?.avatar ? parsedProf.avatar : 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=200&auto=format&fit=crop';
          
          const ratingData = ratingsMap[p.id];
          const averageRating = ratingData ? (ratingData.sum / ratingData.count).toFixed(1) : null;

          return {
            ...p,
            store: p.profiles?.store_name || p.profiles?.full_name || fallbackStore || `${p.profiles?.first_name || ''} ${p.profiles?.last_name || ''}`.trim() || 'Usuario Anónimo',
            avatar: p.profiles?.avatar_url || fallbackAvatar,
            branches: p.profiles?.branches || (isOwn && parsedProf?.branches ? parsedProf.branches : []),
            calculatedRating: averageRating
          };
        });
        setLocalProducts(formattedData);
      }
      setIsLoading(false);
    };
    fetchProducts();

    const savedProfile = localStorage.getItem('cazamarket_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.theme) setTheme(parsed.theme);
      } catch (e) {}
    }
  }, [isVendorModeActive]);

  const searchParams = useSearchParams();
  const q = searchParams?.get('q')?.toLowerCase() || '';
  const filterCategoria = searchParams?.get('categoria') || '';
  const filterProvincia = searchParams?.get('provincia') || '';
  const filterLocalidad = searchParams?.get('localidad') || '';
  const filterOfrece = searchParams?.get('ofrece') || '';
  const filterTipo = searchParams?.get('tipo') || '';

  const allowedLocalProducts = localProducts.slice(0, permissions.maxProductos);
  const rawMergedData = [...allowedLocalProducts];
  
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
               style={{ position: 'relative', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', height: '100%', transition: 'transform 0.2s', cursor: 'pointer', ...cardStyles }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.transform = 'translateY(-5px)';
                 e.currentTarget.style.zIndex = '100';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.transform = 'none';
                 e.currentTarget.style.zIndex = '1';
               }}>

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
            <div className="aspect-image-4-3" style={{ backgroundImage: `url(${producto.image})`, borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', position: 'relative' }}>
              {/* Product Rating Top Right */}
              <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>{producto.calculatedRating || producto.rating || '0.0'}</span>
              </div>
            </div>
            <div className="card-content-fluid" style={{ display: 'flex', flexDirection: 'column', flex: 1, borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
              {/* Foto de perfil + Username */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: (producto.storeId === 1 && !hasFeature('tiendaVirtual')) ? 'default' : 'pointer', marginBottom: '8px' }} onClick={(e) => { e.stopPropagation(); if (producto.storeId === 1 && !hasFeature('tiendaVirtual')) return; if (producto.storeId) router.push(`/negocios/${producto.storeId}`); }}>
                <div style={{ position: 'relative', width: '30px', height: '30px', flexShrink: 0 }}>
                  <img src={producto.avatar} alt={producto.store} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                  {(producto.storeId === 1 ? hasFeature('insigniaVerificada') : producto.verified) && (
                    <span title="Negocio Verificado" style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-bg-base)' }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ color: 'var(--color-primary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold', lineHeight: 1.1 }}>{producto.store}</span>
                </div>
              </div>

              {/* Nombre del producto */}
              <div style={{ marginBottom: '2px' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--color-text-main)', margin: '0' }}>{producto.name}</h3>
              </div>
              
              {/* Descripcion (max 3 lineas) */}
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', lineHeight: 1.3, margin: '0 0 8px 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {producto.description}
              </p>

              {/* Categoria + Subcategoria */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: 'auto', marginBottom: '8px' }}>
                <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 'var(--radius-full)' }}>
                  {producto.category}
                </span>
                {producto.subcategory && (
                  <div 
                    style={{ position: 'relative', display: 'inline-block' }}
                    onMouseEnter={(e) => { 
                      const tooltip = e.currentTarget.querySelector('.custom-tooltip') as HTMLElement;
                      if (tooltip) { tooltip.style.opacity = '1'; tooltip.style.visibility = 'visible'; tooltip.style.transform = 'translateX(-50%) translateY(0)'; }
                    }}
                    onMouseLeave={(e) => { 
                      const tooltip = e.currentTarget.querySelector('.custom-tooltip') as HTMLElement;
                      if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.visibility = 'hidden'; tooltip.style.transform = 'translateX(-50%) translateY(4px)'; }
                    }}
                  >
                    <span style={{ background: 'rgba(255, 115, 0, 0.1)', color: 'var(--color-primary)', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255, 115, 0, 0.2)', cursor: 'default' }}>
                      +1
                    </span>
                    <div 
                      className="custom-tooltip"
                      style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%) translateY(4px)', background: '#1f241a', color: 'var(--color-text-main)', fontSize: '0.7rem', padding: '4px 8px', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap', opacity: 0, visibility: 'hidden', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', pointerEvents: 'none', zIndex: 50, border: '1px solid var(--color-border)' }}
                    >
                      {producto.subcategory}
                      <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', borderWidth: '4px', borderStyle: 'solid', borderColor: '#1f241a transparent transparent transparent' }} />
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ marginTop: '8px' }}>
                {/* Price + Stock */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    {producto.price?.includes && producto.price.includes(' ') ? (
                      <>
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#a8b87c' }}>{producto.price.split(' ').slice(1).join(' ')}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#a8b87c' }}>{producto.price.split(' ')[0]}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#a8b87c' }}>{typeof producto.price === 'number' ? '$ ' + producto.price.toLocaleString('es-AR') : producto.price}</span>
                    )}
                  </div>
                  {(((producto.stock_mode === 'definido' || producto.stockMode === 'definido') && producto.stock !== null && producto.stock !== undefined) || producto.id === 2) && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Stock: {producto.stock !== null && producto.stock !== undefined ? producto.stock : 5}</span>
                  )}
                </div>
                
                {/* Shipping / Retiro */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'color-mix(in srgb, var(--color-text-main) 60%, transparent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {(() => {
                      const hasShipping = producto.shipping_mode === 'gratis' || producto.shipping_mode === 'costo_extra' || typeof producto.seller?.shippingCost === 'number' || typeof producto.shippingCost === 'number';
                      let shippingText = producto.shipping_mode === 'gratis' || producto.seller?.shippingCost === 0 || producto.shippingCost === 0 ? 'Envío gratis' : 'Envío con costo';
                      // Mostrar el costo real si está en producto.shipping_cost
                      if (producto.shipping_mode === 'costo_extra' && producto.shipping_cost) {
                        shippingText = producto.shipping_cost.toLowerCase().includes('envío') || producto.shipping_cost.toLowerCase().includes('envio') 
                          ? producto.shipping_cost 
                          : `Envío: ${producto.shipping_cost}`;
                      }
                      
                      const hasPickup = producto.pickup_available === 'si' || (producto.seller?.branches && producto.seller.branches.length > 0);
                      const branches = producto.branches || producto.seller?.branches || [];
                      const branchesCount = branches.length;
                      
                      const branchesTooltip = branchesCount > 0 
                        ? branches.map((b: any) => `${b.calle || ''} ${b.numero || ''}, ${b.localidad || ''}`.trim().replace(/^,/, '').trim()).join(' | ') 
                        : 'Ver sucursales';

                      const TruckIcon = () => (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="3" width="15" height="13"></rect>
                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                          <circle cx="5.5" cy="18.5" r="2.5"></circle>
                          <circle cx="18.5" cy="18.5" r="2.5"></circle>
                        </svg>
                      );

                      const StoreIcon = () => (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                          <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                      );

                      if (hasShipping) {
                        return (
                          <>
                            <TruckIcon />
                            <span>{shippingText}</span>
                            {hasPickup && (
                              <div 
                                style={{ position: 'relative', display: 'inline-block' }}
                                onMouseEnter={(e) => { 
                                  const tooltip = e.currentTarget.querySelector('.branches-tooltip') as HTMLElement;
                                  if (tooltip) { tooltip.style.opacity = '1'; tooltip.style.visibility = 'visible'; tooltip.style.transform = 'translateX(-50%) translateY(0)'; }
                                }}
                                onMouseLeave={(e) => { 
                                  const tooltip = e.currentTarget.querySelector('.branches-tooltip') as HTMLElement;
                                  if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.visibility = 'hidden'; tooltip.style.transform = 'translateX(-50%) translateY(4px)'; }
                                }}
                              >
                                <span style={{ background: 'rgba(255, 115, 0, 0.1)', color: 'var(--color-primary)', padding: '2px 4px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255,115,0,0.2)', cursor: 'default', fontWeight: 600 }}>
                                  +{branchesCount > 0 ? branchesCount : 1}
                                </span>
                                <div 
                                  className="branches-tooltip"
                                  style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%) translateY(4px)', background: '#1f241a', color: 'var(--color-text-main)', fontSize: '0.7rem', padding: '6px 10px', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap', opacity: 0, visibility: 'hidden', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', pointerEvents: 'none', zIndex: 50, border: '1px solid var(--color-border)', minWidth: '120px', textAlign: 'center' }}
                                >
                                  <div style={{ color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '2px' }}>Retiro en sucursal</div>
                                  <div style={{ color: 'var(--color-text-muted)' }}>{branchesTooltip}</div>
                                  <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', borderWidth: '4px', borderStyle: 'solid', borderColor: '#1f241a transparent transparent transparent' }} />
                                </div>
                              </div>
                            )}
                          </>
                        );
                      } else if (hasPickup) {
                        return (
                          <>
                            <StoreIcon />
                            <span>Retiro en sucursal</span>
                            {branchesCount > 0 && (
                              <div 
                                style={{ position: 'relative', display: 'inline-block' }}
                                onMouseEnter={(e) => { 
                                  const tooltip = e.currentTarget.querySelector('.branches-tooltip') as HTMLElement;
                                  if (tooltip) { tooltip.style.opacity = '1'; tooltip.style.visibility = 'visible'; tooltip.style.transform = 'translateX(-50%) translateY(0)'; }
                                }}
                                onMouseLeave={(e) => { 
                                  const tooltip = e.currentTarget.querySelector('.branches-tooltip') as HTMLElement;
                                  if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.visibility = 'hidden'; tooltip.style.transform = 'translateX(-50%) translateY(4px)'; }
                                }}
                              >
                                <span style={{ background: 'rgba(255, 115, 0, 0.1)', color: 'var(--color-primary)', padding: '2px 4px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255,115,0,0.2)', cursor: 'default', fontWeight: 600 }}>
                                  +{branchesCount}
                                </span>
                                <div 
                                  className="branches-tooltip"
                                  style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%) translateY(4px)', background: '#1f241a', color: 'var(--color-text-main)', fontSize: '0.7rem', padding: '6px 10px', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap', opacity: 0, visibility: 'hidden', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', pointerEvents: 'none', zIndex: 50, border: '1px solid var(--color-border)', minWidth: '120px', textAlign: 'center' }}
                                >
                                  <div style={{ color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '2px' }}>Sucursales disponibles</div>
                                  <div style={{ color: 'var(--color-text-muted)' }}>{branchesTooltip}</div>
                                  <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', borderWidth: '4px', borderStyle: 'solid', borderColor: '#1f241a transparent transparent transparent' }} />
                                </div>
                              </div>
                            )}
                          </>
                        );
                      }
                      return <span>A acordar</span>;
                    })()}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); router.push(`/productos/${producto.id}`); }}
                    style={{ 
                      padding: '4px 12px', 
                      borderRadius: 'var(--radius-full)', 
                      color: 'var(--color-primary)', 
                      fontSize: '0.8rem',
                      fontWeight: 600,
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
          </div>
          );
        }))}
      </div>
    </div>
  );
}

export default function ProductosPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: 'var(--spacing-8) var(--spacing-4)', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
        <div className="responsive-grid-250">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    }>
      <ProductosContent />
    </Suspense>
  );
}
