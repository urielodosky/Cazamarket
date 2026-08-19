'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { useFavorites } from '@/contexts/FavoritesContext';
import { PlanTier, isAtLeast } from '@/types/planTypes';
import SkeletonCard from '@/components/ui/SkeletonCard';
import Pagination from '@/components/ui/Pagination';

import { useThemeColors } from '@/hooks/useThemeColors';
import { createClient } from '@/lib/supabase/client';

export default function NegociosPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isVendorModeActive, supabaseUser } = useAuth();
  const { permissions, planTier } = usePlan();
  const searchParams = useSearchParams();
  const themeColors = useThemeColors();
  const [negocios, setNegocios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [negociosError, setNegociosError] = useState<any>(null);

  const ITEMS_PER_PAGE = 24;

  const q = searchParams?.get('q')?.toLowerCase() || '';
  const filterCategoria = searchParams?.get('categoria') || '';
  const filterProvincia = searchParams?.get('provincia') || '';
  const filterLocalidad = searchParams?.get('localidad') || '';
  const filterTipo = searchParams?.get('tipo') || '';
  const filterRating = searchParams?.get('rating') || '';

  useEffect(() => {
    const loadBusinesses = async () => {
      setIsLoading(true);
      setNegociosError(null);
      
      try {
        const { data: businesses, error } = await supabase
          .rpc('search_businesses', {
            p_search_term: q,
            p_category: filterCategoria,
            p_province: filterProvincia,
            p_locality: filterLocalidad,
            p_business_type: filterTipo,
            p_rating: filterRating,
            p_page_number: currentPage,
            p_items_per_page: ITEMS_PER_PAGE
          });

        if (error) {
          console.error('Error fetching businesses:', error);
          setNegociosError(error);
          setIsLoading(false);
          return;
        }

        if (businesses) {
          const total = businesses.length > 0 ? Number(businesses[0].total_count) : 0;
          setTotalPages(Math.ceil(total / ITEMS_PER_PAGE) || 1);

          const mappedBusinesses = businesses.map((parsed: any) => {
            const pCount = parsed.productos_count || 0;
            const sCount = parsed.servicios_count || 0;

            const parsedLocations: any[] = [];
            if (parsed.branches && Array.isArray(parsed.branches)) {
              parsed.branches.forEach((suc: any) => {
                if (suc.provincia || suc.localidad || suc.province || suc.city) {
                  parsedLocations.push({ 
                    province: suc.provincia || suc.province || '', 
                    city: suc.localidad || suc.city || '' 
                  });
                }
              });
            }

            const pTier = parsed.product_plan_tier || 'gratis';
            const sTier = parsed.service_plan_tier || 'gratis';
            const isEmprendedorOrHigher = pTier === 'empresarial' || pTier === 'comercial' || pTier === 'emprendedor' ||
                                          sTier === 'empresarial' || sTier === 'comercial' || sTier === 'emprendedor';

            const planTierStr = isEmprendedorOrHigher ? 'emprendedor' : (pTier !== 'gratis' ? pTier : sTier);

            return {
              id: parsed.id,
              name: parsed.store_name || parsed.full_name || 'Mi Negocio',
              rating: 0, 
              reviews: 0,
              image: parsed.cover_url || parsed.store_image || null,
              avatar: parsed.avatar_url || 'https://ui-avatars.com/api/?name=Mi+Negocio&background=ff7300&color=fff',
              planTier: planTierStr,
              description: parsed.store_description || 'Bienvenido a mi tienda oficial en CazaMarket.',
              businessType: parsed.business_type || 'Tienda',
              categories: parsed.store_categories ? (Array.isArray(parsed.store_categories) ? parsed.store_categories : [parsed.store_categories]) : [],
              locations: parsedLocations,
              productsCount: pCount,
              servicesCount: sCount,
              theme: parsed.store_theme || null,
              verified: parsed.verified || false
            };
          });
          
          setNegocios(mappedBusinesses);
        }
      } catch (err) {
        console.error("Unexpected error loading businesses:", err);
        setNegociosError(err);
      }
      setIsLoading(false);
    };
    
    loadBusinesses();
  }, [supabase, q, filterCategoria, filterProvincia, filterLocalidad, filterTipo, filterRating, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [q, filterCategoria, filterProvincia, filterLocalidad, filterTipo, filterRating]);

  return (
    <div className="container-page" style={{ maxWidth: '1200px', margin: '0 auto', minHeight: '60vh', paddingBottom: 'var(--spacing-12)' }}>
      {isVendorModeActive && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
          <div>
            <h1 style={{ fontSize: '2rem', margin: 0, color: 'var(--color-text-main)' }}>Mis Tiendas</h1>
            <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>Administra tus negocios y perfiles comerciales.</p>
          </div>
          <button className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: 'var(--radius-full)' }} onClick={() => router.push('/mis-tiendas')}>
            Configurar Tienda
          </button>
        </div>
      )}

      <div className="responsive-grid-300">
        {isLoading ? (
          <>{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</>
        ) : negociosError ? (
          <div style={{ gridColumn: '1 / -1', padding: '20px', background: 'rgba(255,0,0,0.1)', color: 'red', borderRadius: '8px' }}>
            <h3>Error de Base de Datos (Negocios)</h3>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{negociosError.message || JSON.stringify(negociosError)}</pre>
          </div>
        ) : negocios.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', opacity: 0.5 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.5rem', color: 'var(--color-text-main)' }}>No hay negocios disponibles</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>No se encontraron negocios con esos filtros.</p>
            <button className="btn btn-primary highlight-mode" onClick={() => router.push('/configuracion')} style={{ padding: '12px 24px', borderRadius: 'var(--radius-full)' }}>
              Crea tu primer negocio
            </button>
          </div>
        ) : negocios.map(negocio => {
          const isCustomColorsAllowed = negocio.id === 1 ? permissions.coloresPersonalizados : isAtLeast(negocio.planTier, 'empresarial');
          const useForceCustom = isCustomColorsAllowed && negocio.theme && negocio.theme.forceCustom;
          const customStyles = (isCustomColorsAllowed && negocio.theme) ? {
            '--color-primary': negocio.theme.primaryColor,
            '--color-text-main': (!useForceCustom && themeColors.isLight) ? '#1a1c18' : negocio.theme.textColor,
            '--color-bg-base': (!useForceCustom && themeColors.isLight) ? '#f5f3ee' : negocio.theme.bgColor,
            backgroundColor: (!useForceCustom && themeColors.isLight) ? 'var(--color-bg-base)' : negocio.theme.bgColor,
            border: useForceCustom ? '1px solid var(--color-border)' : undefined
          } as React.CSSProperties : {};

          return (
          <div key={negocio.id} className={useForceCustom ? "" : "glass-panel"} 
               onClick={() => router.push(`/negocios/${negocio.id}`)}
               style={{ ...customStyles, position: 'relative', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'pointer' }}
               onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
            
            {/* Favoritos */}
            <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 30 }}>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleFavorite('negocios', negocio.id.toString()); }}
                style={{ 
                  background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  color: isFavorite('negocios', negocio.id.toString()) ? '#ff4d4d' : 'rgba(255,255,255,0.7)', transition: 'all 0.2s', backdropFilter: 'blur(4px)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ff4d4d'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = isFavorite('negocios', negocio.id.toString()) ? '#ff4d4d' : 'rgba(255,255,255,0.7)'; e.currentTarget.style.transform = 'scale(1)'; }}
                title={isFavorite('negocios', negocio.id.toString()) ? "Quitar de favoritos" : "Añadir a favoritos"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite('negocios', negocio.id.toString()) ? '#ff4d4d' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              </button>
            </div>
            
            {/* Rating removed */}

            {(isAtLeast(negocio.planTier, 'emprendedor') && negocio.image) && (
              <div className="aspect-image-16-9" style={{ minHeight: '120px', height: '120px', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', position: 'relative', overflow: 'hidden' }}>
                <img 
                  src={negocio.image} 
                  alt={negocio.name || "Negocio"} 
                  loading="lazy" 
                  style={{ position: 'absolute', top: 0, left: 0, boxSizing: "border-box", width: "100%", height: '100%', objectFit: 'cover' }} 
                />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6))' }} />
              </div>
            )}

            <div className="card-content-fluid" style={{ paddingTop: (isAtLeast(negocio.planTier, 'emprendedor') && negocio.image) ? '0px' : '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              
              {/* Avatar and Username */}
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                marginBottom: '16px',
                position: 'relative',
                zIndex: 20, /* Higher than the rating (10) so tooltips don't get covered */
                alignItems: 'center'
              }}>
                {/* Avatar Wrapper */}
                <div style={{ 
                  width: '80px', 
                  height: (isAtLeast(negocio.planTier, 'emprendedor') && negocio.image) ? '40px' : '80px', /* Only takes up bottom half if banner is present */
                  position: 'relative',
                  flexShrink: 0
                }}>
                  <div style={{ 
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%',
                    backgroundImage: `url(${negocio.avatar})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '3px solid var(--color-primary)', /* Matches verified badge color */
                    boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                    backgroundColor: 'var(--color-bg-surface-elevated)'
                  }}>
                    {(negocio.id === 1 ? permissions.insigniaVerificada : negocio.verified) && (
                      <span title="Negocio Verificado" style={{ position: 'absolute', bottom: '2px', right: '2px', width: '22px', height: '22px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-bg-surface-elevated)', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Wrapper for Title & Location */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center',
                  flex: 1,
                  minWidth: 0,
                  paddingRight: '36px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-main)', margin: '0', lineHeight: 1.2, wordBreak: 'break-word' }}>
                      {negocio.name}
                    </h3>
                    {(negocio.calculatedRating || negocio.rating) ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: '#FFD700', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        {negocio.calculatedRating || negocio.rating}
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--color-text-muted)', flexShrink: 0, padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)' }}>
                        Nuevo
                      </span>
                    )}
                  </div>
                  
                  {/* Location moved below name */}
                  {negocio.locations && negocio.locations.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {negocio.locations[0].province}, {negocio.locations[0].city}
                        {negocio.locations.length > 1 && (
                          <div className="loc-tooltip-container">
                            <span style={{ 
                              background: 'rgba(255, 255, 255, 0.08)', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontSize: '0.75rem', 
                              cursor: 'help',
                              border: '1px solid var(--color-border)',
                              fontWeight: 600
                            }}>
                              +{negocio.locations.length - 1}
                            </span>
                            <div className="loc-tooltip">
                              <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '0.8rem', color: 'var(--color-primary)' }}>Más sucursales:</div>
                              {negocio.locations.slice(1).map((loc: any, idx: number) => (
                                <div key={idx} style={{ fontSize: '0.8rem', marginBottom: idx !== negocio.locations.length - 2 ? '4px' : '0' }}>
                                  • {loc.province}, {loc.city}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Description */}
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {negocio.description}
              </p>

              {/* Business Type and Category (as tags) */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px', marginTop: 'auto' }}>
                <span style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', border: '1px solid var(--color-primary)', fontWeight: 500 }}>
                  {negocio.businessType}
                </span>
                {(() => {
                  const activeCats = (negocio.categories || []).filter((cat: any) => typeof cat === 'string' && cat.trim() !== '');
                  if (activeCats.length === 0) return null;

                  let sortedCats = [...activeCats];
                  if (filterCategoria) {
                    const matchIdx = sortedCats.findIndex((c: string) => c.toLowerCase().includes(filterCategoria.toLowerCase()));
                    if (matchIdx > 0) {
                      const [matched] = sortedCats.splice(matchIdx, 1);
                      sortedCats.unshift(matched);
                    }
                  }

                  const firstCat = sortedCats[0];
                  const remainingCats = sortedCats.slice(1);

                  return (
                    <>
                      <span 
                        title={firstCat}
                        style={{ 
                          background: themeColors.bgSubtle, 
                          color: themeColors.textWhite, 
                          padding: '4px 10px', 
                          borderRadius: 'var(--radius-full)', 
                          fontSize: '0.78rem', 
                          border: `1px solid ${themeColors.borderSubtle2}`,
                          maxWidth: '130px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'inline-block',
                          verticalAlign: 'middle'
                        }}
                      >
                        {firstCat}
                      </span>
                      {remainingCats.length > 0 && (
                        <div className="loc-tooltip-container">
                          <span style={{ 
                            background: themeColors.bgSubtle2, 
                            color: themeColors.textWhite, 
                            padding: '4px 10px', 
                            borderRadius: 'var(--radius-full)', 
                            fontSize: '0.78rem', 
                            border: `1px solid ${themeColors.borderSubtle3}`, 
                            fontWeight: 600,
                            cursor: 'help'
                          }}>
                            +{remainingCats.length}
                          </span>
                          <div className="loc-tooltip">
                            <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '0.8rem', color: 'var(--color-primary)' }}>Otras categorías:</div>
                            {remainingCats.map((cat: string, idx: number) => (
                              <div key={idx} style={{ fontSize: '0.8rem', marginBottom: idx !== remainingCats.length - 1 ? '4px' : '0' }}>
                                • {cat}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: 'auto' }}>
                <div style={{ display: 'flex', gap: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  <span><strong>{negocio.productsCount}</strong> prods</span>
                  <span><strong>{negocio.servicesCount}</strong> servs</span>
                </div>
                <div className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 16px', fontSize: '0.9rem', borderRadius: 'var(--radius-full)', color: themeColors.textWhite, borderColor: themeColors.borderSubtle3 }}>
                  Visitar Tienda
                </div>
              </div>
            </div>
          </div>
        )})}
      </div>
      
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} 
      />
    </div>
  );
}

