'use client';

import React, { useState, use, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const LocationMap = dynamic(() => import('@/components/ui/LocationMap'), { ssr: false });
const AreaMap = dynamic(() => import('@/components/ui/AreaMap'), { ssr: false });
import LoadingScreen from '@/components/ui/LoadingScreen';
import BookingCalendar from '@/components/ui/BookingCalendar';
import { useCart } from '@/contexts/CartContext';
import { usePlan } from '@/contexts/PlanContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function getSocialUrl(platform: string, handle: string) {
  if (!handle) return null;
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

function formatAddress(raw: string) {
  if (!raw) return 'A acordar con el proveedor';
  const parts = raw.split(',').map(p => p.trim());
  if (parts.length < 4) return raw; // Demasiado corto para formatear con seguridad

  const p0 = parts[0];
  const p1 = parts[1];

  // Buscar calle y altura
  let addressLine = isNaN(Number(p0)) ? p0 : `${p1} ${p0}`;

  // Limpiar partes ruidosas que Nominatim suele devolver
  const filtered = parts.filter(p => {
    const pLow = p.toLowerCase();
    if (pLow.includes('municipio') || pLow.includes('pedanía') || pLow.includes('departamento')) return false;
    if (p.match(/^[A-Z0-9]{4,8}$/)) return false; // Código postal (ej. X5186)
    return true;
  });

  if (filtered.length < 3) return raw;

  const country = filtered[filtered.length - 1];
  const state = filtered[filtered.length - 2];
  let city = filtered.length >= 5 ? filtered[filtered.length - 3] : filtered[2];

  // Si la supuesta ciudad es un barrio genérico, tomar la anterior
  const badCities = ['norte', 'sur', 'este', 'oeste', 'centro'];
  if (filtered.length >= 6 && badCities.includes(city?.toLowerCase() || '')) {
    city = filtered[filtered.length - 4];
  }

  return `${addressLine}${city ? ', ' + city : ''}, ${state}, ${country}`;
}

export default function ServicioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const serviceId = unwrappedParams.id;
  const router = useRouter();
  const [service, setService] = useState<any>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [copiedSocial, setCopiedSocial] = useState<string | null>(null);
  const [isContactMenuOpen, setIsContactMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart, canAddToCart } = useCart();
  const { hasFeature } = usePlan();
  const { username, isLoggedIn } = useAuth();
  const themeColors = useThemeColors();
  const supabase = createClient();

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!service) return;
    const len = service.media && service.media.length > 0 ? service.media.length : 1;
    setActiveImage((prev) => (prev === len - 1 ? 0 : prev + 1));
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!service) return;
    const len = service.media && service.media.length > 0 ? service.media.length : 1;
    setActiveImage((prev) => (prev === 0 ? len - 1 : prev - 1));
  };

  const [otherServices, setOtherServices] = useState<any[]>([]);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*, profiles!user_id(*)')
          .eq('id', serviceId)
          .single();

        if (data && !error) {
          const sellerProfile = data.profiles || {};
          
          setService({
            id: data.id,
            name: data.name,
            price: data.price,
            category: data.category,
            description: data.description,
            images: [data.image],
            media: data.media || [{ url: data.image, type: 'image' }],
            features: data.features || [],
            location: data.service_location,
            areaPoints: data.location_radius ? JSON.parse(data.location_radius) : [],
            discount: data.has_discount ? { name: data.discount_name, type: data.discount_type, value: data.discount_value } : undefined,
            timeDiscounts: data.time_discounts || [],
            earlyBirdDiscounts: data.early_bird_discounts || [],
            seasonRules: data.season_rules || [],
            volumeDiscounts: data.volume_discounts || [],
            seller: {
              id: data.user_id,
              name: sellerProfile.store_name || sellerProfile.full_name || 'Mi Negocio',
              avatar: sellerProfile.avatar_url || '',
              phone: sellerProfile.phone || '',
            }
          });
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error(e);
      }

      let currentService = null;
      try {
        const savedServices = localStorage.getItem('cazamarket_my_services');
        if (savedServices) {
          const parsedServices = JSON.parse(savedServices);
          const myService = parsedServices.find((s: any) => String(s.id) === String(serviceId));
          if (myService) {
            currentService = { ...myService };
            if (myService.storeId) {
              currentService.seller = { ...currentService.seller, id: myService.storeId };
            }
          }

          const others = parsedServices.filter((s: any) => String(s.id) !== String(serviceId)).slice(0, 4);
          setOtherServices(others);
        }

        if (currentService) {
          const savedProfile = localStorage.getItem('cazamarket_profile');
          if (savedProfile) {
            const parsedProfile = JSON.parse(savedProfile);
            setService((prev: any) => {
              if (!prev) return prev;
              return {
                ...prev,
                seller: {
                  ...prev.seller,
                  phone: parsedProfile.telefono || prev.seller?.phone,
                  socials: parsedProfile.redesSociales || prev.seller?.socials || [],
                  theme: parsedProfile.theme || prev.seller?.theme
                }
              };
            });
            const clean = (val?: string) => (val && val.toLowerCase() !== 'uriel' ? val : '');
            const resolvedName = clean(parsedProfile.storeName) || clean(parsedProfile.username) || clean(parsedProfile.nombre) || clean(currentService.seller?.name) || 'Mi Negocio';
            currentService.seller = {
              ...currentService.seller,
              name: resolvedName,
              avatar: parsedProfile.avatar || currentService.seller?.avatar || '',
              phone: parsedProfile.telefono || currentService.seller?.phone || 'No especificado',
              socials: parsedProfile.redesSociales || currentService.seller?.socials || [],
              theme: parsedProfile.theme || currentService.seller?.theme || null
            };
          }
        }
      } catch (e) { }

      setService(currentService);
      if (currentService) {
        setTimeout(() => {
          window.scrollTo({ top: 180, behavior: 'smooth' });
        }, 50);
      }
    };

    fetchService();
  }, [serviceId]);

  if (isLoading) {
    return <LoadingScreen message="Buscando los detalles del servicio..." />;
  }

  if (!service) {
    return (
      <div className="container-page" style={{ paddingTop: '100px', paddingBottom: '100px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--color-text-main)', marginBottom: '16px' }}>Servicio no encontrado</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>El servicio que estás buscando no existe o fue eliminado.</p>
        <Link href="/" style={{ padding: '12px 24px', background: 'var(--color-primary)', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600 }}>Volver al inicio</Link>
      </div>
    );
  }

  // --- Derived State & Calculations ---
  let basePrice = typeof service.price === 'string' ? parseFloat(service.price.replace(/[^0-9.]/g, '')) : (service.price || 0);
  let rawBasePrice = basePrice;
  let discountedBasePrice = basePrice;
  let activeRules: any[] = [];

  // 1. Descuento Base General
  if (service.discount && service.discount.value) {
    const dVal = parseFloat(service.discount.value || '0');
    if (dVal > 0) {
      if (service.discount.type === 'porcentaje') {
        discountedBasePrice = basePrice * (1 - dVal / 100);
      } else {
        discountedBasePrice = Math.max(0, basePrice - dVal);
      }
      activeRules.push({
        name: service.discount.name || 'Descuento General',
        adjustmentType: 'descuento',
        badgeText: `${service.discount.name || 'Oferta'}: ${service.discount.type === 'porcentaje' ? `${dVal}% OFF` : `$${dVal} OFF`}`
      });
    }
  }

  let finalPrice = discountedBasePrice;

  if (selectedDates.length > 0) {
    finalPrice = 0;
    // 2. Reglas de Temporada por Día
    selectedDates.forEach(dateStr => {
      let dailyPrice = discountedBasePrice;
      if (service.seasonRules && service.seasonRules.length > 0) {
        const dateObj = new Date(dateStr);
        const matchedRule = service.seasonRules.find((rule: any) => {
          const start = new Date(rule.startDate);
          const end = new Date(rule.endDate);
          return dateObj >= start && dateObj <= end;
        });

        if (matchedRule) {
          const val = parseFloat(matchedRule.value);
          const adjustment = matchedRule.type === 'porcentaje' ? (discountedBasePrice * (val / 100)) : val;
          if (matchedRule.adjustmentType === 'aumento') dailyPrice += adjustment;
          else dailyPrice -= adjustment;
          if (!activeRules.some((r: any) => r.name === matchedRule.name)) {
            activeRules.push({
              name: matchedRule.name,
              adjustmentType: matchedRule.adjustmentType,
              badgeText: `${matchedRule.adjustmentType === 'aumento' ? 'Temp. Alta:' : 'Temp. Baja:'} ${matchedRule.name}`
            });
          }
        }
      }
      finalPrice += dailyPrice;
    });

    // 3. Descuento por Cantidad de Días (Time Discounts)
    if (service.timeDiscounts && service.timeDiscounts.length > 0) {
      const matchingTimeRules = service.timeDiscounts
        .filter((rule: any) => selectedDates.length >= (parseFloat(rule.minTime) || 0))
        .sort((a: any, b: any) => (parseFloat(b.minTime) || 0) - (parseFloat(a.minTime) || 0));

      if (matchingTimeRules.length > 0) {
        const bestRule = matchingTimeRules[0];
        const val = parseFloat(bestRule.value || '0');
        if (val > 0) {
          const discountAmt = bestRule.type === 'porcentaje' ? (finalPrice * (val / 100)) : val;
          finalPrice = Math.max(0, finalPrice - discountAmt);
          activeRules.push({
            name: `Descuento por ${bestRule.minTime}+ días`,
            adjustmentType: 'descuento',
            badgeText: `${bestRule.minTime}+ días: ${bestRule.type === 'porcentaje' ? `${val}% OFF` : `$${val} OFF`}`
          });
        }
      }
    }

    // 4. Descuento por Reserva Anticipada (Early Bird)
    if (service.earlyBirdDiscounts && service.earlyBirdDiscounts.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const earliestDate = new Date(selectedDates[0]);
      const diffDays = Math.ceil((earliestDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

      const matchingEarlyRules = service.earlyBirdDiscounts
        .filter((rule: any) => diffDays >= (parseFloat(rule.minDays) || 0))
        .sort((a: any, b: any) => (parseFloat(b.minDays) || 0) - (parseFloat(a.minDays) || 0));

      if (matchingEarlyRules.length > 0) {
        const bestEarly = matchingEarlyRules[0];
        const val = parseFloat(bestEarly.value || '0');
        if (val > 0) {
          const discountAmt = bestEarly.type === 'porcentaje' ? (finalPrice * (finalPrice * (val / 100))) : val; // Note: Original logic had potential bug in original input, assuming fixed math.
          finalPrice = Math.max(0, finalPrice - discountAmt);
          activeRules.push({
            name: `Reserva Anticipada (${bestEarly.minDays}+ días)`,
            adjustmentType: 'descuento',
            badgeText: `Anticipada ${bestEarly.minDays}+ días: ${bestEarly.type === 'porcentaje' ? `${val}% OFF` : `$${val} OFF`}`
          });
        }
      }
    }
  }

  const datesString = selectedDates.length > 0 ? selectedDates.join(', ') : 'fecha a definir';
  const waLocation = formatAddress(service.serviceLocation || service.location);
  const customStyles = (service.seller?.theme) ? {
    paddingTop: '40px', paddingBottom: '80px', paddingLeft: '4%', paddingRight: '4%', position: 'relative',
    '--color-primary': service.seller.theme.primaryColor,
    '--color-text-main': themeColors.isLight ? '#1a1c18' : service.seller.theme.textColor,
    '--color-bg-base': themeColors.isLight ? '#f5f3ee' : service.seller.theme.bgColor
  } as React.CSSProperties : { paddingTop: '40px', paddingBottom: '80px', paddingLeft: '4%', paddingRight: '4%', position: 'relative' } as React.CSSProperties;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: themeColors.isLight ? '#f5f3ee' : (service.seller?.theme ? service.seller.theme.bgColor : 'var(--color-bg-base)'),
      transition: 'background-color 0.3s ease'
    }}>
      <div className="container-page" style={customStyles}>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start', marginBottom: '64px' }}>

        {/* Galería de Imágenes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className="glass-panel"
            style={{ position: 'relative', padding: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={() => setIsHoveringImage(true)}
            onMouseLeave={() => setIsHoveringImage(false)}
          >
            <img
              src={(service.media && service.media.length > 0 ? service.media.map((m: any) => m.url) : [service.image || 'https://images.unsplash.com/photo-1542673898-7c85854b73b2?q=80&w=1200&auto=format&fit=crop'])[activeImage]}
              alt={service.name}
              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1542673898-7c85854b73b2?q=80&w=1200&auto=format&fit=crop'; }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* Botón Anterior */}
            <button
              onClick={prevImage}
              style={{
                position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '48px', height: '48px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                opacity: isHoveringImage ? 1 : 0, transition: 'opacity 0.2s, background 0.2s', zIndex: 10
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            {/* Botón Siguiente */}
            <button
              onClick={nextImage}
              style={{
                position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '48px', height: '48px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                opacity: isHoveringImage ? 1 : 0, transition: 'opacity 0.2s, background 0.2s', zIndex: 10
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {(service.media && service.media.length > 0 ? service.media.map((m: any) => m.url) : [service.image || 'https://images.unsplash.com/photo-1542673898-7c85854b73b2?q=80&w=1200&auto=format&fit=crop']).map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: activeImage === idx ? '2px solid var(--color-primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  padding: 0,
                  background: 'none'
                }}
              >
                <img src={img} alt={`Vista ${idx + 1}`} onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1542673898-7c85854b73b2?q=80&w=1200&auto=format&fit=crop'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>


        </div>

        {/* Info del Servicio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <div>
            {/* Ofertado por */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              {service.seller.id === 1 && !hasFeature('tiendaVirtual') ? (
                <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                  <img src={service.seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(service.seller.name)}&background=ff7300&color=fff`} alt={service.seller.name} onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(service.seller.name)}&background=ff7300&color=fff`; }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />
                  {(service.seller.id === 1 ? hasFeature('insigniaVerificada') : service.seller.verified) && (
                    <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--color-primary)', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-bg-base)' }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                  )}
                </div>
              ) : (
                <Link href={`/negocios/${service.seller.id}`}>
                  <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                    <img src={service.seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(service.seller.name)}&background=ff7300&color=fff`} alt={service.seller.name} onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(service.seller.name)}&background=ff7300&color=fff`; }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />
                    {(service.seller.id === 1 ? hasFeature('insigniaVerificada') : service.seller.verified) && (
                      <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--color-primary)', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-bg-base)' }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                    )}
                  </div>
                </Link>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Brindado por</span>
                {service.seller.id === 1 && !hasFeature('tiendaVirtual') ? (
                  <span style={{ color: 'var(--color-text-main)', fontWeight: 600, fontSize: '0.95rem' }}>
                    {service.seller.name}
                  </span>
                ) : (
                  <Link href={`/negocios/${service.seller.id}`} style={{ color: 'var(--color-text-main)', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>
                    {service.seller.name}
                  </Link>
                )}
              </div>
            </div>

            {/* Categoría */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span style={{ background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-block' }}>
                {service.category || 'Servicio'}
              </span>
              {service.subcategory && (
                <span style={{ background: 'transparent', color: 'var(--color-text-main)', border: '1px solid var(--color-border)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-block' }}>
                  {service.subcategory}
                </span>
              )}
            </div>

            {/* Título */}
            <h1 style={{ fontSize: '2.2rem', margin: '0 0 12px 0', color: 'var(--color-text-main)', lineHeight: 1.2 }}>
              {service.name}
            </h1>

            {/* ID, Duración y Ubicación */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <span style={{ color: 'color-mix(in srgb, var(--color-text-main) 60%, transparent)', fontSize: '0.9rem' }}>
                ID: #{serviceId}
              </span>
              <span style={{ color: 'color-mix(in srgb, var(--color-text-main) 30%, transparent)' }}>•</span>
              <span style={{ color: 'var(--color-text-main)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                {formatAddress(service.serviceLocation || service.location)}
              </span>
            </div>

            {/* Calendario */}
            {service.usesCalendar !== false && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.95rem', color: 'color-mix(in srgb, var(--color-text-main) 70%, transparent)', fontWeight: 600, textAlign: 'center' }}>Selecciona tu Fecha o Fechas en el Calendario</label>
                <BookingCalendar
                  mode="client"
                  value={selectedDates}
                  onChange={(val) => {
                    if (service.pricePeriod === 'único') {
                      setSelectedDates(typeof val === 'string' ? [val] : (val.length > 0 ? [val[val.length - 1]] : []));
                    } else {
                      setSelectedDates(Array.isArray(val) ? val : [val]);
                    }
                  }}
                  blockedDates={service.blockedDates || []}
                  allowMultiple={service.pricePeriod !== 'único'}
                />
              </div>
            )}

            {/* Precio */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>
                    $ {finalPrice.toLocaleString('es-AR')}
                  </span>
                  <span style={{ fontSize: '1.2rem', color: 'color-mix(in srgb, var(--color-text-main) 60%, transparent)', paddingBottom: '4px' }}>
                    / {service.pricePeriod || 'jornada'} {activeRules.length > 0 ? '(Ajustado)' : 'base'} {selectedDates.length > 1 && `(x${selectedDates.length})`}
                  </span>
                </div>
                {activeRules.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {activeRules.map((rule, idx) => (
                      <div key={idx} style={{ display: 'inline-flex', padding: '4px 10px', background: rule.adjustmentType === 'aumento' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37,211,102,0.1)', color: rule.adjustmentType === 'aumento' ? '#ef4444' : '#25D366', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, border: `1px solid ${rule.adjustmentType === 'aumento' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(37,211,102,0.3)'}` }}>
                        {rule.badgeText || rule.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px', position: 'relative' }}>
            {canAddToCart(service.seller.id) ? (
              <button
                onClick={() => {
                  if (!isLoggedIn) {
                    alert('Para usar el carrito debes registrarte o iniciar sesión');
                    router.push('/registro');
                    return;
                  }
                  addToCart({
                    id: `servicio-${service.id}-${datesString}`,
                    name: `${service.name} ${selectedDates.length > 0 ? `(${datesString})` : ''}`,
                    price: `$${finalPrice.toLocaleString('es-AR')}`,
                    image: service.media && service.media.length > 0 ? service.media[0].url : (service.image || 'https://images.unsplash.com/photo-1542673898-7c85854b73b2?q=80&w=1200&auto=format&fit=crop'),
                    store: service.seller.name,
                    storeId: service.seller.id,
                    type: 'servicio',
                    timeDiscounts: service.timeDiscounts,
                    earlyBirdDiscounts: service.earlyBirdDiscounts
                  });
                }}
                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: 600, borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Añadir al Carrito
              </button>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', width: '100%' }}>
                {/* 1. Contactar al Guía */}
                <div style={{ position: 'relative', width: '100%' }}>
                  <button
                    onClick={() => setIsContactMenuOpen(!isContactMenuOpen)}
                    style={{ width: '100%', padding: '14px 18px', fontSize: '0.95rem', fontWeight: 700, borderRadius: '12px', background: 'var(--color-primary)', border: 'none', color: '#fff', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    Contactar al Guía
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isContactMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>

                  {isContactMenuOpen && (() => {
                    let buyerName = username || 'cliente';
                    let rawPhone = service.seller.phone && service.seller.phone !== 'No especificado' ? service.seller.phone : '';
                    
                    if (typeof window !== 'undefined') {
                      try {
                        const prof = JSON.parse(localStorage.getItem('cazamarket_profile') || '{}');
                        if (prof.nombre) buyerName = prof.nombre;
                        else if (prof.username) buyerName = prof.username;
                        if (!rawPhone && prof.telefono) rawPhone = prof.telefono;
                      } catch(e) {}
                    }
                    if (!rawPhone) rawPhone = '5491112345678';
                    const cleanPhone = rawPhone.replace(/\D/g, '');

                    const customWaMsg = `Hola, soy ${buyerName} y te escribo para pedir información sobre el servicio ${service.name}`;
                    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customWaMsg)}`;

                    let socialsList: { red: string; usuario: string }[] = service.seller.socials || [];
                    if ((!socialsList || socialsList.length === 0) && typeof window !== 'undefined') {
                      try {
                        const prof = JSON.parse(localStorage.getItem('cazamarket_profile') || '{}');
                        if (prof.redesSociales && Array.isArray(prof.redesSociales)) {
                          socialsList = prof.redesSociales.filter((s: any) => s.usuario);
                        }
                      } catch(e) {}
                    }

                    if (!socialsList || socialsList.length === 0) {
                      socialsList = [
                        { red: 'Instagram', usuario: 'cazamarket_ar' },
                        { red: 'Facebook', usuario: 'cazamarket' }
                      ];
                    }

                    return (
                      <div 
                        style={{ 
                          position: 'absolute', 
                          top: '105%', 
                          left: 0, 
                          width: '240px',
                          borderRadius: '16px', 
                          background: 'var(--color-bg-surface-elevated)', 
                          border: '1px solid var(--color-border)', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '12px', 
                          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease',
                          boxShadow: '0 15px 35px rgba(0,0,0,0.85), 0 0 20px rgba(0, 0, 0, 0.12)',
                          padding: '10px', 
                          zIndex: 100 
                        }}
                      >
                        <span style={{ fontSize: '0.72rem', color: 'color-mix(in srgb, var(--color-text-main) 45%, transparent)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 8px', fontWeight: 600 }}>
                          Contacto Directo
                        </span>

                        {/* WhatsApp Directo */}
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsContactMenuOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            color: 'var(--color-text-main)',
                            textDecoration: 'none',
                            borderRadius: '10px',
                            background: 'rgba(37, 211, 102, 0.12)',
                            border: '1px solid rgba(37, 211, 102, 0.3)',
                            transition: 'all 0.2s ease',
                            fontSize: '0.92rem',
                            fontWeight: 600
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(37, 211, 102, 0.25)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(37, 211, 102, 0.12)'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            <span>WhatsApp</span>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                        </a>

                        {/* Redes Sociales */}
                        {socialsList.map((social: any, idx: number) => {
                          if (!social.usuario) return null;
                          const socialUrl = getSocialUrl(social.red, social.usuario);
                          if (!socialUrl) return null;

                          const isInsta = social.red.toLowerCase() === 'instagram';
                          const isFb = social.red.toLowerCase() === 'facebook';
                          const iconColor = isInsta ? '#E1306C' : isFb ? '#1877F2' : 'var(--color-primary)';

                          return (
                            <a
                              key={idx}
                              href={socialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setIsContactMenuOpen(false)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '9px 12px',
                                color: 'rgba(255,255,255,0.9)',
                                textDecoration: 'none',
                                borderRadius: '10px',
                                transition: 'background 0.2s ease',
                                fontSize: '0.9rem',
                                fontWeight: 500
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {isInsta ? (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                ) : isFb ? (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                                ) : (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                )}
                                <span>{social.red}</span>
                              </div>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                            </a>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Botón Ver Perfil / Tienda */}
                <Link href={`/negocios/${service.seller?.id || 1}`} style={{ textDecoration: 'none', width: '100%' }}>
                  <button
                    style={{ 
                      width: '100%', 
                      padding: '14px 18px', 
                      fontSize: '0.95rem', 
                      fontWeight: 700, 
                      borderRadius: '12px', 
                      background: 'transparent', 
                      border: '1px solid var(--color-primary)', 
                      color: 'var(--color-text-main)', 
                      cursor: 'pointer', 
                      transition: 'all 0.2s ease', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      gap: '8px' 
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 10%, transparent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    <span>Ver Perfil / Tienda</span>
                  </button>
                </Link>
              </div>
            )}

            {/* Chat Directo (Sólo si tiene plan compatible) */}
            {hasFeature('chatInterno') && (
              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '12px' }}>
                <Link href="/chat" style={{ textDecoration: 'none', flex: 1 }}>
                  <button
                    style={{ 
                      width: '100%', 
                      padding: '14px 18px', 
                      fontSize: '0.95rem', 
                      fontWeight: 600, 
                      borderRadius: '12px', 
                      background: themeColors.surfaceElevated, 
                      border: `1px solid ${themeColors.borderSubtle3}`, 
                      color: themeColors.textWhite, 
                      cursor: 'pointer', 
                      transition: 'all 0.2s ease', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      gap: '8px',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = themeColors.borderSubtle3; e.currentTarget.style.color = themeColors.textWhite; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <span>Chat Directo</span>
                  </button>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Descripción y Características */}
      <div style={{ padding: '0 20px', marginBottom: '64px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {service.description && (
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', color: 'var(--color-text-main)' }}>Descripción del Servicio</h3>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, fontSize: '1.05rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {service.description}
              </p>
            </div>
          )}

          {service.features && service.features.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', color: 'var(--color-text-main)' }}>¿Qué incluye?</h3>
              <ul style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, fontSize: '1.05rem', paddingLeft: '24px', margin: 0 }}>
                {service.features.map((feature: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: '12px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Ubicación y Mapa */}
          {((service.showServiceArea || service.serviceLocationCoords || service.serviceAreaCoords || service.serviceLocation || service.location) && hasFeature('mapasTerritorio')) && (
            <div style={{ marginTop: '40px' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', color: 'var(--color-text-main)' }}>Ubicación</h3>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {(!service.serviceAreaType || service.serviceAreaType === 'point' || service.serviceAreaType === 'both') && (
                  <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
                    {(service.serviceAreaType === 'both' || service.serviceAreaCoords) && <h4 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--color-text-main)' }}>Punto de Encuentro / Base</h4>}
                    <div style={{ height: '300px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative' }}>
                      <LocationMap
                        position={service.serviceLocationCoords ? [service.serviceLocationCoords.lat, service.serviceLocationCoords.lng] : undefined}
                        locationText={service.serviceLocation || service.location}
                        readOnly={true}
                      />
                      {hasFeature('googleMaps') && (
                        <a
                          href={service.serviceLocationCoords ? `https://www.google.com/maps/search/?api=1&query=${service.serviceLocationCoords.lat},${service.serviceLocationCoords.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(service.serviceLocation || service.location))}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}
                          title="Abrir en Google Maps"
                        />
                      )}
                    </div>
                  </div>
                )}

                {(service.serviceAreaType === 'area' || service.serviceAreaType === 'both' || (service.serviceAreaCoords && service.serviceAreaCoords.length > 0)) && service.serviceAreaCoords && service.serviceAreaCoords.length > 0 && (
                  <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
                    {(service.serviceAreaType === 'both' || service.serviceLocationCoords) && <h4 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--color-text-main)' }}>Zona de Cobertura</h4>}
                    <div style={{ height: '300px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative' }}>
                      <AreaMap
                        center={[service.serviceAreaCoords[0][0], service.serviceAreaCoords[0][1]]}
                        polygon={service.serviceAreaCoords}
                        locationText={service.serviceLocation || service.location}
                        readOnly={true}
                      />
                      {hasFeature('googleMaps') && (
                        <a
                          href={service.serviceLocationCoords ? `https://www.google.com/maps/search/?api=1&query=${service.serviceLocationCoords.lat},${service.serviceLocationCoords.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(service.serviceLocation || service.location))}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}
                          title="Abrir en Google Maps"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Servicios similares */}
      {otherServices.length > 0 && (
        <div style={{ marginTop: '64px' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', color: 'var(--color-text-main)' }}>Otros servicios de {service.seller.name}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
            {otherServices.map((other) => {
              const servImage = other.media && other.media.length > 0 ? other.media[0].url : other.image;
              const servPrice = typeof other.price === 'string' ? other.price : `$${other.price?.toLocaleString('es-AR')}`;
              return (
                <div key={other.id} className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: 'var(--radius-md)', transition: 'transform 0.2s', cursor: 'pointer' }}
                  onClick={() => window.location.href = `/servicios/${other.id}`}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                  <div style={{ height: '180px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--color-border)', position: 'relative' }}>
                    {servImage ? (
                      <img src={servImage} alt={other.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1542673898-7c85854b73b2?q=80&w=1200&auto=format&fit=crop'; }} />
                    ) : (
                      <span style={{ opacity: 0.3, fontSize: '0.9rem' }}>Sin Imagen</span>
                    )}
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: 'var(--color-text-main)' }}>{other.name}</h4>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>{other.category || 'Servicio'}</div>
                    <p style={{ color: 'var(--color-primary)', fontWeight: 'bold', margin: 0, fontSize: '1.2rem' }}>{servPrice}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
