'use client';

import React, { useState, use, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomSelect from '@/components/ui/CustomSelect';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { PlanTier, isAtLeast } from '@/types/planTypes';
import { usePlan } from '@/contexts/PlanContext';
import { NEGOCIOS_DATA, PRODUCTOS_DATA } from '@/data/mock';
import { useThemeColors } from '@/hooks/useThemeColors';
import { createClient } from '@/lib/supabase/client';

const PROVINCES_MAP: Record<string, string> = {
  "02": "Ciudad Autónoma de Buenos Aires",
  "06": "Buenos Aires",
  "10": "Catamarca",
  "14": "Córdoba",
  "18": "Corrientes",
  "22": "Chaco",
  "26": "Chubut",
  "30": "Entre Ríos",
  "34": "Formosa",
  "38": "Jujuy",
  "42": "La Pampa",
  "46": "La Rioja",
  "50": "Mendoza",
  "54": "Misiones",
  "58": "Neuquén",
  "62": "Río Negro",
  "66": "Salta",
  "70": "San Juan",
  "74": "San Luis",
  "78": "Santa Cruz",
  "82": "Santa Fe",
  "86": "Santiago del Estero",
  "90": "Tucumán",
  "94": "Tierra del Fuego"
};

function getProvinceName(prov: string) {
  if (!prov) return '';
  return PROVINCES_MAP[prov] || prov;
}

function getSocialUrl(platform: string, handle: string) {
  if (handle.startsWith('http') || handle.startsWith('www')) {
    return handle.startsWith('www') ? `https://${handle}` : handle;
  }
  const cleanHandle = handle.replace(/^@/, '');
  switch (platform.toLowerCase()) {
    case 'instagram': return `https://instagram.com/${cleanHandle}`;
    case 'facebook': return `https://facebook.com/${cleanHandle}`;
    case 'x':
    case 'twitter': return `https://x.com/${cleanHandle}`;
    case 'tiktok': return `https://tiktok.com/@${cleanHandle}`;
    case 'youtube': return `https://youtube.com/@${cleanHandle}`;
    case 'linkedin': return `https://linkedin.com/in/${cleanHandle}`;
    case 'snapchat': return `https://snapchat.com/add/${cleanHandle}`;
    default: return null;
  }
}

const BLANK_NEGOCIO = {
  id: 1,
  name: 'Mi Negocio',
  rating: 0,
  reviews: 0,
  image: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?q=80&w=1200&auto=format&fit=crop',
  avatar: 'https://ui-avatars.com/api/?name=Mi+Negocio&background=ff7300&color=fff',
  planTier: 'comercial' as PlanTier,
  description: 'Bienvenido a mi tienda oficial en CazaMarket.',
  businessType: 'Tienda',
  categories: [],
  locations: [],
  otherLocations: [],
  productSections: [],
  serviceSections: [],
  productsCount: 0,
  servicesCount: 0,
  phone: 'No especificado',
  hours: 'Consultar horarios',
  socials: []
};

export default function NegocioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [activeTab, setActiveTab] = useState('productos');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categoria, setCategoria] = useState('');
  const [condicion, setCondicion] = useState('');
  const [envio, setEnvio] = useState('');
  const [duracion, setDuracion] = useState('');
  const [extras, setExtras] = useState<any>('');
  
  const negocioId = parseInt(unwrappedParams.id);
  const [negocio, setNegocio] = useState<any>(BLANK_NEGOCIO);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasFeature, permissions } = usePlan();
  const themeColors = useThemeColors();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['productos', 'servicios', 'informacion', 'comunidad'].includes(tab)) {
      setActiveTab(tab);
      // Wait for React to render the new tab, then scroll down to the contact section
      if (window.location.hash === '#contacto') {
        setTimeout(() => {
          document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(unwrappedParams.id);

    if (isUuid) {
      // It's a Supabase UUID, load from Supabase
      const loadSupabaseProfile = async () => {
        const supabase = createClient();
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', unwrappedParams.id).single();
        
        if (profile) {
          const { data: prods } = await supabase.from('products').select('*').eq('user_id', unwrappedParams.id).limit(permissions.maxProductos);
          const { data: servs } = await supabase.from('services').select('*').eq('user_id', unwrappedParams.id).limit(permissions.maxServicios);
          
          let avgRating = 0;
          let totalReviews = 0;
          const { data: revs } = await supabase.from('reviews')
            .select('id, seller_rating, comment, created_at, interactions!inner(seller_id, buyer_id)')
            .eq('interactions.seller_id', unwrappedParams.id)
            .eq('is_published', true)
            .not('seller_rating', 'is', null)
            .order('created_at', { ascending: false });

          let reviewList: any[] = [];
          if (revs && revs.length > 0) {
            totalReviews = revs.length;
            const sum = revs.reduce((acc, r: any) => acc + (r.seller_rating || 0), 0);
            avgRating = parseFloat((sum / totalReviews).toFixed(1));
            
            // Fetch profiles for the buyers
            const buyerIds = revs.map((r: any) => r.interactions?.buyer_id).filter(Boolean);
            const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', buyerIds);
            const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
            
            reviewList = revs.map((r: any) => {
              const buyer = profileMap.get(r.interactions?.buyer_id) || {};
              return {
                id: r.id,
                rating: r.seller_rating,
                comment: r.comment,
                date: r.created_at,
                buyerName: buyer.first_name ? `${buyer.first_name} ${buyer.last_name || ''}`.trim() : 'Usuario',
                buyerAvatar: buyer.avatar_url || null
              };
            });
          }
          
          setNegocio({
            ...BLANK_NEGOCIO,
            id: unwrappedParams.id,
            name: profile.store_name || profile.full_name || 'Mi Negocio',
            rating: avgRating,
            reviews: totalReviews,
            reviewsList: reviewList,
            description: profile.store_description || 'Bienvenido a mi tienda oficial en CazaMarket.',
            avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=200&auto=format&fit=crop',
            phone: profile.phone || 'No especificado',
            productsCount: prods ? prods.length : 0,
            servicesCount: servs ? servs.length : 0,
            productSections: prods && prods.length > 0 ? [{ name: 'Catálogo', products: prods }] : [],
            serviceSections: servs && servs.length > 0 ? [{ name: 'Catálogo', services: servs }] : []
          });
        } else {
          // If no profile found but it's a valid UUID, just show blank (maybe deleted user)
          setNegocio({ ...BLANK_NEGOCIO, id: unwrappedParams.id });
        }
        setIsLoading(false);
      };
      loadSupabaseProfile();
      return;
    }

    if (negocioId === 1) {
      const savedProfile = localStorage.getItem('cazamarket_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        
        const parsedLocations: any[] = [];
        if (parsed.provincia || parsed.calle) {
          parsedLocations.push({
            province: getProvinceName(parsed.provincia),
            city: parsed.localidad || '',
            address: `${parsed.calle || ''} ${parsed.numero || ''}`.trim()
          });
        }
        if (parsed.sucursales) {
          parsed.sucursales.forEach((suc: any) => {
            parsedLocations.push({
              province: getProvinceName(suc.provincia),
              city: suc.localidad || '',
              address: `${suc.calle || ''} ${suc.numero || ''}`.trim()
            });
          });
        }

        const parsedSocials = (parsed.redesSociales || [])
          .filter((r: any) => r.usuario && r.usuario.trim() !== '')
          .map((r: any) => ({ platform: r.red, handle: r.usuario }));

        setNegocio((prev: any) => ({
          ...prev,
          name: parsed.storeName || parsed.username || parsed.nombre || prev.name,
          description: parsed.storeDescription || prev.description,
          avatar: parsed.avatar || prev.avatar,
          phone: parsed.telefono || prev.phone,
          locations: parsedLocations,
          socials: parsedSocials.length > 0 ? parsedSocials : prev.socials,
          businessType: parsed.businessType || prev.businessType,
          categories: parsed.categories ? (Array.isArray(parsed.categories) ? parsed.categories : [parsed.categories]) : prev.categories,
          horarios: parsed.horarios || prev.horarios,
          theme: parsed.theme || prev.theme
        }));
      }

      const fetchStoreProducts = async () => {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          
          let avgRating = 0;
          let totalReviews = 0;
          const { data: revs } = await supabase.from('reviews')
            .select('id, seller_rating, comment, created_at, interactions!inner(seller_id, buyer_id)')
            .eq('interactions.seller_id', userData.user.id)
            .eq('is_published', true)
            .not('seller_rating', 'is', null)
            .order('created_at', { ascending: false });

          let reviewList: any[] = [];
          if (revs && revs.length > 0) {
            totalReviews = revs.length;
            const sum = revs.reduce((acc, r: any) => acc + (r.seller_rating || 0), 0);
            avgRating = parseFloat((sum / totalReviews).toFixed(1));
            
            const buyerIds = revs.map((r: any) => r.interactions?.buyer_id).filter(Boolean);
            const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', buyerIds);
            const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
            
            reviewList = revs.map((r: any) => {
              const buyer = profileMap.get(r.interactions?.buyer_id) || {};
              return {
                id: r.id,
                rating: r.seller_rating,
                comment: r.comment,
                date: r.created_at,
                buyerName: buyer.first_name ? `${buyer.first_name} ${buyer.last_name || ''}`.trim() : 'Usuario',
                buyerAvatar: buyer.avatar_url || null
              };
            });
          }

          setNegocio((prev: any) => ({
            ...prev,
            rating: avgRating,
            reviews: totalReviews,
            reviewsList: reviewList
          }));

          const { data, error } = await supabase.from('products').select('*').eq('user_id', userData.user.id).limit(permissions.maxProductos);
          if (data && !error && data.length > 0) {
            setNegocio((prev: any) => {
              const hasSection = prev.productSections.some((s: any) => s.name === 'Mis Productos');
              if (hasSection) return prev;
              
              const formattedProducts = data.map(p => {
                const localProf = localStorage.getItem('cazamarket_profile');
                let parsedProf: any = null;
                if (localProf) {
                  try { parsedProf = JSON.parse(localProf); } catch(e) {}
                }
                const fallbackStore = parsedProf ? (parsedProf.storeName || parsedProf.username || parsedProf.firstName) : 'Usuario Anónimo';
                const fallbackAvatar = parsedProf?.avatar ? parsedProf.avatar : 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=200&auto=format&fit=crop';
                return {
                  ...p,
                  store: fallbackStore,
                  avatar: fallbackAvatar,
                  branches: parsedProf?.branches || []
                };
              });

              return {
                ...prev,
                productsCount: prev.productsCount + formattedProducts.length,
                productSections: [
                  { name: 'Mis Productos', products: formattedProducts },
                  ...prev.productSections
                ]
              };
            });
          }
        }
      };
      fetchStoreProducts().finally(() => {
        setIsLoading(false);
      });

      const savedServicesStr = localStorage.getItem('cazamarket_my_services');
      if (savedServicesStr) {
        let savedServices = JSON.parse(savedServicesStr);
        if (savedServices && Array.isArray(savedServices)) {
          savedServices = savedServices.slice(0, permissions.maxServicios);
          if (savedServices.length > 0) {
            setNegocio((prev: any) => {
              const hasSection = prev.serviceSections && prev.serviceSections.some((s: any) => s.name === 'Catálogo de Servicios');
              if (hasSection) return prev;
              return {
                ...prev,
                servicesCount: prev.servicesCount + savedServices.length,
                serviceSections: [
                  { name: 'Catálogo de Servicios', services: savedServices },
                  ...(prev.serviceSections || [])
                ]
              };
            });
          }
        }
      }
    } else {
      const found = NEGOCIOS_DATA.find((n: any) => n.id === negocioId);
      if (found) {
        const businessProducts = PRODUCTOS_DATA.filter((p: any) => p.seller && p.seller.id === negocioId);
        
        setNegocio({
          ...BLANK_NEGOCIO,
          ...found,
          productsCount: businessProducts.length,
          productSections: businessProducts.length > 0 ? [
            { name: 'Catálogo', products: businessProducts }
          ] : []
        });
      }
      setIsLoading(false);
    }
  }, [unwrappedParams.id, negocioId, permissions.maxProductos, permissions.maxServicios]);

  useEffect(() => {
    if (panelRef.current) {
      // Small timeout ensures layout is fully painted before scrolling
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Cargando negocio..." />;
  }

  if (negocioId === 1 && !hasFeature('tiendaVirtual')) {
    return (
      <div className="container-page" style={{ paddingTop: '80px', paddingBottom: '40px', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '60px 40px', borderRadius: 'var(--radius-lg)', maxWidth: '500px' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '24px' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <h2 style={{ color: 'var(--color-text-main)', marginBottom: '16px', fontSize: '1.5rem' }}>Tienda Virtual no disponible</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px', lineHeight: 1.5 }}>
            Tu plan actual no incluye el beneficio de Tienda Virtual propia. Sube de plan para habilitar tu perfil público y agrupar tus productos y servicios en un solo lugar.
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/planes')} style={{ padding: '12px 32px', borderRadius: 'var(--radius-full)' }}>
            Ver Planes
          </button>
        </div>
      </div>
    );
  }

  const isCustomColorsAllowed = negocioId === 1 ? hasFeature('coloresPersonalizados') : isAtLeast(negocio.planTier, 'empresarial');
  const customStyles: React.CSSProperties = {
    paddingTop: '40px', 
    paddingBottom: '40px',
    ...(isCustomColorsAllowed && negocio.theme ? {
      '--color-primary': negocio.theme.primaryColor,
      '--color-text-main': themeColors.isLight ? '#1a1c18' : negocio.theme.textColor,
      '--color-bg-base': themeColors.isLight ? '#f5f3ee' : negocio.theme.bgColor,
      backgroundColor: themeColors.isLight ? '#f5f3ee' : negocio.theme.bgColor
    } as any : {})
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: (isCustomColorsAllowed && negocio.theme) ? (themeColors.isLight ? '#f5f3ee' : negocio.theme.bgColor) : 'var(--color-bg-base)',
      transition: 'background-color 0.3s ease'
    }}>
      <div className="container-page" style={customStyles}>
      <div ref={panelRef} className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: 0, position: 'relative' }}>
        {/* Banner */}
        {(negocioId === 1 ? hasFeature('banner') : isAtLeast(negocio.planTier, 'emprendedor')) ? (
          <div style={{ 
            height: '280px', 
            backgroundImage: `url(${negocio.image})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center',
            position: 'relative',
            borderTopLeftRadius: 'var(--radius-lg)',
            borderTopRightRadius: 'var(--radius-lg)'
          }}>
             <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.8))', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }} />
          </div>
        ) : (
          <div style={{ height: '80px' }} /> // Espaciador si no hay banner
        )}

        <div style={{ padding: '0 var(--spacing-5) var(--spacing-5) var(--spacing-5)', position: 'relative' }}>
          
          {/* Header Info (Avatar & Title) */}
          <div style={{ 
            display: 'flex', 
            gap: '32px', 
            alignItems: 'flex-end',
            marginTop: (negocioId === 1 ? hasFeature('banner') : isAtLeast(negocio.planTier, 'emprendedor')) ? '-60px' : '-40px',
            marginBottom: '32px',
            position: 'relative',
            zIndex: 10
          }}>
            {/* Avatar */}
            <div style={{ 
              width: '140px', 
              height: '140px', 
              borderRadius: '50%',
              border: '6px solid var(--color-primary)',
              backgroundImage: `url(${negocio.avatar})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: 'var(--color-bg-surface-elevated)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              flexShrink: 0,
              position: 'relative'
            }}>
              {(negocioId === 1 ? hasFeature('insigniaVerificada') : negocio.verified) && (
                <span title="Negocio Verificado" style={{ position: 'absolute', bottom: '2px', right: '2px', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid var(--color-bg-surface)', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </span>
              )}
            </div>

            {/* Title & Key Stats */}
            <div style={{ flex: 1, paddingBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ fontSize: '2.5rem', margin: '0 0 12px 0', color: 'var(--color-text-main)', lineHeight: 1.1, textShadow: themeColors.isLight ? '0 0 4px #ffffff, 0 0 8px #ffffff' : '0 0 4px rgba(0,0,0,0.5), 0 0 8px rgba(0,0,0,0.5)' }}>{negocio.name}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: 'var(--color-text-muted)', fontSize: '1rem' }}>
                    {negocio.rating > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFD700', fontWeight: 'bold' }} title={`${negocio.reviews} reseña${negocio.reviews !== 1 ? 's' : ''}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        {negocio.rating}
                      </span>
                    )}
                    {negocio.locations && negocio.locations.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span>{negocio.locations.slice(0, 2).map((l: any) => [l.city, l.province].filter(Boolean).join(', ')).join(' | ')}</span>
                          {negocio.locations.length > 2 && (
                            <div 
                              title={negocio.locations.slice(2).map((l: any) => [l.city, l.province].filter(Boolean).join(', ')).join('\n')}
                              style={{
                                background: 'rgba(255,255,255,0.1)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.85rem',
                                cursor: 'help'
                              }}
                            >
                              +{negocio.locations.length - 2}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Tags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)', padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: '0.9rem', border: '1px solid var(--color-primary)', fontWeight: 600 }}>
                {negocio.businessType}
              </span>
              {negocio.categories && negocio.categories
                .filter((cat: any) => typeof cat === 'string' && cat.trim() !== '')
                .map((cat: string, i: number) => (
                  <span key={i} style={{ background: themeColors.bgSubtle, color: themeColors.textWhite, padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: '0.9rem', border: `1px solid ${themeColors.borderSubtle2}` }}>
                    {cat}
                  </span>
                ))}
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '800px', margin: 0 }}>
              {negocio.description}
            </p>
          </div>

          {/* Tabs Navigation */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '32px' }}>
            {['productos', 'servicios', 'informacion', 'reseñas'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ 
                  padding: '16px 32px', 
                  fontSize: '1.05rem', 
                  fontWeight: 600,
                  color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  borderBottom: activeTab === tab ? '3px solid var(--color-primary)' : '3px solid transparent',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s'
                }}
              >
                {tab === 'informacion' ? 'Información' : tab}
              </button>
            ))}
          </div>

          {/* Tab Content Area */}
          <div style={{ minHeight: '400px' }}>
            
            {/* PRODUCTOS TAB */}
            {activeTab === 'productos' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Catálogo de Productos</h3>
                  <div style={{ display: 'flex', gap: '12px', flex: '1', maxWidth: '500px', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      </span>
                      <input 
                        type="text" 
                        placeholder="Buscar productos..." 
                        style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', background: 'var(--color-bg-base)', color: 'var(--color-text-main)', fontSize: '0.95rem' }} 
                      />
                    </div>
                    <button className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '0.95rem', fontWeight: 600, borderRadius: 'var(--radius-full)', flexShrink: 0, background: 'var(--color-primary)', color: '#fff', border: 'none' }}>
                      Buscar
                    </button>
                    <button onClick={() => setIsFiltersOpen(!isFiltersOpen)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.95rem', fontWeight: 600, borderRadius: 'var(--radius-full)', border: `1px solid ${themeColors.borderSubtle3}`, background: themeColors.bgSubtle4, color: themeColors.textWhite, flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = themeColors.hoverBg2; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = themeColors.bgSubtle4; }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="6" cy="14" r="3"></circle>
                        <line x1="6" y1="3" x2="6" y2="11"></line>
                        <line x1="6" y1="17" x2="6" y2="21"></line>
                        <circle cx="12" cy="8" r="3"></circle>
                        <line x1="12" y1="3" x2="12" y2="5"></line>
                        <line x1="12" y1="11" x2="12" y2="21"></line>
                        <circle cx="18" cy="16" r="3"></circle>
                        <line x1="18" y1="3" x2="18" y2="13"></line>
                        <line x1="18" y1="19" x2="18" y2="21"></line>
                      </svg>
                      Filtros
                    </button>
                  </div>
                </div>

                {/* Filtros Panel (Productos) */}
                <div style={{
                  height: isFiltersOpen ? 'auto' : '0px',
                  opacity: isFiltersOpen ? 1 : 0,
                  visibility: isFiltersOpen ? 'visible' : 'hidden',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  marginBottom: isFiltersOpen ? '24px' : '0'
                }}>
                  <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={{ zIndex: 120 }}>
                      <CustomSelect 
                        options={[
                          { value: '', label: 'Categoría (Todas)' },
                          { value: 'armeria', label: 'Armería' },
                          { value: 'pesca', label: 'Pesca' },
                          { value: 'camping', label: 'Camping' }
                        ]} 
                        value={categoria} 
                        onChange={setCategoria} 
                        placeholder="Categoría" 
                      />
                    </div>
                    <div style={{ zIndex: 110 }}>
                      <CustomSelect 
                        options={[
                          { value: '', label: 'Envío (Todos)' },
                          { value: 'envio', label: 'Envío' },
                          { value: 'envio_gratis', label: 'Envío Gratis' },
                          { value: 'retiro', label: 'Retiro en sucursal' }
                        ]} 
                        value={envio} 
                        onChange={setEnvio} 
                        placeholder="Envío" 
                      />
                    </div>
                    <div style={{ zIndex: 100 }}>
                      <CustomSelect 
                        options={[
                          { value: '', label: 'Condición (Todas)' },
                          { value: 'nuevo', label: 'Nuevo' },
                          { value: 'usado', label: 'Usado' }
                        ]} 
                        value={condicion} 
                        onChange={setCondicion} 
                        placeholder="Condición" 
                      />
                    </div>
                  </div>
                </div>
                
                {(() => {
                  const hasCategories = negocioId === 1 ? hasFeature('categorias') : isAtLeast(negocio.planTier, 'emprendedor');
                  const hasSections = negocio.productSections && negocio.productSections.length > 0;
                  
                  if (!hasSections) {
                    return (
                      <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                        <h3 style={{ color: 'var(--color-text-main)', marginBottom: '8px' }}>No hay productos publicados</h3>
                        <p>Este negocio aún no ha publicado productos.</p>
                      </div>
                    );
                  }

                  if (hasCategories) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        {negocio.productSections.map((section: any, idx: number) => (
                          <div key={idx}>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                              {section.name}
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
                              {section.products.map((p: any, index: number) => {
                                const isObj = typeof p === 'object';
                                const id = isObj ? p.id : p;
                                const name = isObj ? p.name : `Producto ${p}`;
                                const priceStr = isObj ? (typeof p.price === 'number' ? `$ ${p.price.toLocaleString('es-AR')}` : p.price) : `$ ${(p * 24500).toLocaleString('es-AR')}`;
                                const image = isObj && p.image ? p.image : '';
                                
                                return (
                                  <div key={id || index} className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: 'var(--radius-md)', transition: 'transform 0.2s', cursor: 'pointer' }}
                                       onClick={() => router.push(`/productos/${id}`)}
                                       onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                       onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                                    <div style={{ position: 'relative', height: '180px', background: image ? `url(${image}) center/cover` : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--color-border)' }}>
                                       {!image && <span style={{ opacity: 0.3, fontSize: '0.9rem' }}>Foto del Producto</span>}
                                       {/* Product Rating Top Right */}
                                       <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 5 }}>
                                         <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                         <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>4.8</span>
                                       </div>
                                    </div>
                                    <div style={{ padding: '16px' }}>
                                      <div style={{ marginBottom: '8px' }}>
                                        <h4 style={{ margin: '0', fontSize: '1rem', color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</h4>
                                      </div>
                                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>{section.name}</div>
                                      <p style={{ color: 'var(--color-primary)', fontWeight: 'bold', margin: 0, fontSize: '1.2rem' }}>{priceStr}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  // Flat list for basic plan without "categorias" feature
                  const flatProducts = negocio.productSections.flatMap((s: any) => s.products);
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
                      {flatProducts.map((p: any, index: number) => {
                        const isObj = typeof p === 'object';
                        const id = isObj ? p.id : p;
                        const name = isObj ? p.name : `Producto ${p}`;
                        const priceStr = isObj ? (typeof p.price === 'number' ? `$ ${p.price.toLocaleString('es-AR')}` : p.price) : `$ ${(p * 24500).toLocaleString('es-AR')}`;
                        const image = isObj && p.image ? p.image : '';

                        return (
                          <div key={id || index} className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: 'var(--radius-md)', transition: 'transform 0.2s', cursor: 'pointer' }}
                               onClick={() => router.push(`/productos/${id}`)}
                               onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                               onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                            <div style={{ position: 'relative', height: '180px', background: image ? `url(${image}) center/cover` : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--color-border)' }}>
                               {!image && <span style={{ opacity: 0.3, fontSize: '0.9rem' }}>Foto del Producto</span>}
                               {/* Product Rating Top Right */}
                               <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 5 }}>
                                 <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                 <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>4.8</span>
                               </div>
                            </div>
                            <div style={{ padding: '16px' }}>
                              <div style={{ marginBottom: '8px' }}>
                                        <h4 style={{ margin: '0', fontSize: '1rem', color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</h4>
                              </div>
                              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>Categoría General</div>
                              <p style={{ color: 'var(--color-primary)', fontWeight: 'bold', margin: 0, fontSize: '1.2rem' }}>{priceStr}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
            
            {/* SERVICIOS TAB */}
            {activeTab === 'servicios' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Catálogo de Servicios</h3>
                  {negocio.servicesCount > 0 && (
                    <div style={{ display: 'flex', gap: '12px', flex: '1', maxWidth: '500px', justifyContent: 'flex-end' }}>
                      <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </span>
                        <input 
                          type="text" 
                          placeholder="Buscar servicios..." 
                          style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', background: 'var(--color-bg-base)', color: 'var(--color-text-main)', fontSize: '0.95rem' }} 
                        />
                      </div>
                      <button className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '0.95rem', fontWeight: 600, borderRadius: 'var(--radius-full)', flexShrink: 0, background: 'var(--color-primary)', color: '#fff', border: 'none' }}>
                        Buscar
                      </button>
                      <button onClick={() => setIsFiltersOpen(!isFiltersOpen)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.95rem', fontWeight: 600, borderRadius: 'var(--radius-full)', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--color-text-main)', flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="6" cy="14" r="3"></circle>
                          <line x1="6" y1="3" x2="6" y2="11"></line>
                          <line x1="6" y1="17" x2="6" y2="21"></line>
                          <circle cx="12" cy="8" r="3"></circle>
                          <line x1="12" y1="3" x2="12" y2="5"></line>
                          <line x1="12" y1="11" x2="12" y2="21"></line>
                          <circle cx="18" cy="16" r="3"></circle>
                          <line x1="18" y1="3" x2="18" y2="13"></line>
                          <line x1="18" y1="19" x2="18" y2="21"></line>
                        </svg>
                        Filtros
                      </button>
                    </div>
                  )}
                </div>

                {/* Filtros Panel (Servicios) */}
                <div style={{
                  height: isFiltersOpen ? 'auto' : '0px',
                  opacity: isFiltersOpen ? 1 : 0,
                  visibility: isFiltersOpen ? 'visible' : 'hidden',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  marginBottom: isFiltersOpen ? '24px' : '0'
                }}>
                  <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={{ zIndex: 120 }}>
                      <CustomSelect 
                        options={[
                          { value: '', label: 'Categoría (Todas)' },
                          { value: 'armeria', label: 'Armería' },
                          { value: 'pesca', label: 'Pesca' },
                          { value: 'camping', label: 'Camping' }
                        ]} 
                        value={categoria} 
                        onChange={setCategoria} 
                        placeholder="Categoría" 
                      />
                    </div>
                    <div style={{ zIndex: 110 }}>
                      <CustomSelect 
                        options={[
                          { value: 'equipamiento', label: 'Equipamiento' },
                          { value: 'transporte', label: 'Transporte' },
                          { value: 'comida', label: 'Comida/Bebida' },
                          { value: 'seguro', label: 'Seguro' }
                        ]} 
                        value={extras} 
                        onChange={setExtras} 
                        placeholder="Extras incluidos" 
                        multiple={true}
                      />
                    </div>
                    <div style={{ zIndex: 100 }}>
                      <CustomSelect 
                        options={[
                          { value: '', label: 'Duración (Todas)' },
                          { value: '1-4', label: '1-4 horas' },
                          { value: '5-8', label: '5-8 hs' },
                          { value: '9-12', label: '9-12 hs' },
                          { value: '+12', label: '+12 horas' }
                        ]} 
                        value={duracion} 
                        onChange={setDuracion} 
                        placeholder="Duración" 
                      />
                    </div>
                  </div>
                </div>

                {negocio.servicesCount === 0 ? (
                  <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ color: 'var(--color-text-main)', marginBottom: '8px' }}>No hay servicios publicados</h3>
                    <p>Este negocio aún no ha configurado su catálogo de servicios.</p>
                  </div>
                ) : isAtLeast(negocio.planTier, 'emprendedor') && negocio.serviceSections && negocio.serviceSections.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    {negocio.serviceSections.map((section: any, idx: number) => (
                      <div key={idx}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                          {section.name}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
                          {section.services.map((servicio: any, idx: number) => {
                            const isRealObject = typeof servicio === 'object' && servicio !== null;
                            const servId = isRealObject ? servicio.id : servicio;
                            const servName = isRealObject ? servicio.name : `Servicio ${servicio}`;
                            const servPrice = isRealObject ? (typeof servicio.price === 'string' ? servicio.price : `$${servicio.price?.toLocaleString('es-AR')}`) : `$ ${(servicio * 50000).toLocaleString('es-AR')}`;
                            const servImage = isRealObject ? (servicio.media && servicio.media.length > 0 ? servicio.media[0].url : servicio.image) : '';
                            
                            return (
                              <div key={servId || idx} className="glass-panel" 
                                   onClick={() => router.push(`/servicios/${servId}`)}
                                   style={{ padding: 0, overflow: 'hidden', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}
                                   onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                   onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                                
                                <div style={{ height: '180px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--color-border)', position: 'relative' }}>
                                  {servImage ? (
                                    <img src={servImage} alt={servName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1542673898-7c85854b73b2?q=80&w=1200&auto=format&fit=crop'; }} />
                                  ) : (
                                    <span style={{ opacity: 0.3 }}>Sin Imagen</span>
                                  )}
                                </div>
                                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: 'var(--color-text-main)' }}>{servName}</h4>
                                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>{isRealObject ? (servicio.category || section.name) : section.name}</div>
                                  <div style={{ marginTop: 'auto' }}>
                                    <p style={{ color: 'var(--color-primary)', fontWeight: 'bold', margin: 0 }}>{servPrice}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }} />
                )}
              </div>
            )}

            {/* INFORMACION TAB */}
            {activeTab === 'informacion' && (
              <div id="contacto" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', scrollMarginTop: '100px' }}>
                <div>
                  <h3 style={{ margin: '0 0 24px 0', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    Contacto Directo
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--color-text-main)', fontSize: '1.05rem' }}>
                    
                    {/* Horarios de Atención */}
                    {/* Horarios de Atención */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Horarios
                      </div>
                      {Array.isArray(negocio.horarios) ? (() => {
                        const groups: any[] = [];
                        let currentGroup: any = null;
                        
                        const formatGroupedDays = (days: string[]) => {
                          if (days.length === 1) return days[0];
                          if (days.length === 2) return `${days[0]} y ${days[1]}`;
                          return `${days[0]} a ${days[days.length - 1]}`;
                        };

                        negocio.horarios.forEach((h: any) => {
                          const scheduleStr = h.closed ? 'Cerrado' : h.shifts.map((s: any) => `${s.open} - ${s.close}`).join(' y ');
                          if (!currentGroup) {
                            currentGroup = { days: [h.day], schedule: scheduleStr, closed: h.closed };
                          } else if (currentGroup.schedule === scheduleStr) {
                            currentGroup.days.push(h.day);
                          } else {
                            groups.push({ ...currentGroup, daysStr: formatGroupedDays(currentGroup.days) });
                            currentGroup = { days: [h.day], schedule: scheduleStr, closed: h.closed };
                          }
                        });
                        if (currentGroup) {
                          groups.push({ ...currentGroup, daysStr: formatGroupedDays(currentGroup.days) });
                        }

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '26px' }}>
                            {groups.map((g: any, i: number) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                                <span style={{ color: 'var(--color-text-muted)', width: '130px' }}>{g.daysStr}</span>
                                <span style={{ color: g.closed ? '#ef4444' : 'var(--color-text-main)', fontWeight: g.closed ? 500 : 400 }}>
                                  {g.schedule}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })() : (
                        <strong style={{ paddingLeft: '26px' }}>{negocio.horarios || negocio.hours}</strong>
                      )}
                    </div>

                    {/* Teléfono de Contacto */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                      <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        Teléfono
                      </span>
                      {isAtLeast(negocio.planTier, 'emprendedor') && negocio.phone && negocio.phone !== 'No especificado' ? (
                        <a 
                          href={`https://wa.me/${negocio.phone.replace(/\\D/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 'bold' }}
                        >
                          {negocio.phone}
                        </a>
                      ) : (
                        <strong style={{ color: 'var(--color-primary)' }}>{negocio.phone}</strong>
                      )}
                    </div>

                    {/* Redes Sociales */}
                    {negocio.socials && negocio.socials.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Otras Redes</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {negocio.socials.map((social: any, i: number) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 500, color: 'var(--color-text-main)' }}>
                                {social.platform === 'Instagram' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>}
                                {social.platform === 'Facebook' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>}
                                {social.platform === 'Sitio Web' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>}
                                {social.platform}
                              </span>
                              {isAtLeast(negocio.planTier, 'emprendedor') ? (
                                <a 
                                  href={getSocialUrl(social.platform, social.handle) || '#'} 
                                  target={getSocialUrl(social.platform, social.handle) ? "_blank" : "_self"} 
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.95rem' }}
                                >
                                  {social.handle.startsWith('@') || social.handle.startsWith('http') || social.handle.startsWith('www') ? social.handle : `@${social.handle}`}
                                </a>
                              ) : (
                                <span style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                                  {social.handle.startsWith('@') || social.handle.startsWith('http') || social.handle.startsWith('www') ? social.handle : `@${social.handle}`}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                   {/* Sucursales Block */}
                   <div>
                     <h3 style={{ margin: '0 0 24px 0', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      Sucursales
                     </h3>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                       {negocio.locations && negocio.locations.map((loc: any, i: number) => (
                         <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-primary)' }}>
                           <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px' }}>
                             {loc.city ? loc.city : 'Sucursal'}
                           </div>
                           <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>
                             {loc.province ? `Provincia de ${loc.province}` : ''}
                           </div>
                           {loc.address && (
                             <div style={{ color: 'var(--color-text-main)', fontSize: '0.95rem', marginTop: '8px' }}>
                               📍 {loc.address}
                             </div>
                           )}
                         </div>
                       ))}
                       {(!negocio.locations || negocio.locations.length === 0) && (
                         <div style={{ color: 'var(--color-text-muted)' }}>
                           No hay ubicaciones registradas.
                         </div>
                       )}
                     </div>
                   </div>

                   {/* Otras Direcciones Block */}
                   {negocio.otherLocations && negocio.otherLocations.length > 0 && (
                     <div>
                       <h3 style={{ margin: '0 0 24px 0', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        Otras Direcciones
                       </h3>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                         {negocio.otherLocations.map((loc: any, i: number) => (
                           <div key={`other-${i}`} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-text-muted)' }}>
                             <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--color-text-main)', marginBottom: '4px' }}>{loc.name}</div>
                             <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>{loc.description}</div>
                             <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                               {loc.city}, Provincia de {loc.province}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                </div>
              </div>
            )}
            
            {/* RESEÑAS TAB */}
            {activeTab === 'reseñas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    Reseñas del Negocio
                    {negocio.rating > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,215,0,0.1)', color: '#FFD700', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '1.1rem' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        {negocio.rating}
                      </span>
                    )}
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Valoración general basada en las opiniones de los compradores.</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {negocio.reviewsList && negocio.reviewsList.length > 0 ? (
                    negocio.reviewsList.map((review: any) => (
                      <div key={review.id} style={{ padding: '24px', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {review.buyerAvatar ? (
                              <img src={review.buyerAvatar} alt={review.buyerName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                                {review.buyerName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h4 style={{ margin: '0 0 2px 0', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>{review.buyerName}</h4>
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                {new Date(review.date).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill={star <= (review.rating || 0) ? "#FFD700" : "none"} stroke="#FFD700" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            ))}
                          </div>
                        </div>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '1rem' }}>
                          "{review.comment}"
                        </p>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                      No hay reseñas todavía.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
      </div>
    </div>
  );
}
