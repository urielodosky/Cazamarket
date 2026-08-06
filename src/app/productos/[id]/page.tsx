'use client';

import React, { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { HeartIcon } from '@heroicons/react/24/solid';
import { sanitizeInput } from '@/lib/sanitize';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getPlanPermissions } from '@/types/planTypes';
import '../producto.css';
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

import { createClient } from '@/lib/supabase/client';

export default function ProductoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const productId = unwrappedParams.id;
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [isContactMenuOpen, setIsContactMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { cart, addToCart, canAddToCart } = useCart();
  const { hasFeature } = usePlan();
  const { username, isLoggedIn, supabaseUser } = useAuth();
  const themeColors = useThemeColors();
  const supabase = createClient();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isInCart = cart.some(item => item.id === `producto-${product?.id}`);

  const getSellerFeature = (feature: any) => {
    if (!product) return false;
    if (product.seller?.id === 1) {
      return hasFeature(feature);
    }
    if (product.seller?.planTier) {
      const perms = getPlanPermissions(product.seller.planTier, 'gratis');
      const val = perms[feature as keyof typeof perms];
      return val === true || (typeof val === 'number' && val > 0);
    }
    return false;
  };

  // Sistema de notificaciones Toast premium
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info'; action?: { label: string, href: string } } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info', action?: { label: string, href: string }) => {
    setToast({ text, type, action });
    setTimeout(() => setToast(null), 5000); // Dar más tiempo si hay acción
  };

  const handleContactIntent = async () => {
    if (supabaseUser && product?.seller?.id && supabaseUser.id !== product.seller.id) {
      try {
        const sellerId = product.seller.id || '00000000-0000-0000-0000-000000000000';
        // Insert product interaction
        await supabase.from('interactions').insert({
          buyer_id: supabaseUser.id,
          seller_id: sellerId,
          product_id: product.id,
          status: 'pending_time'
        });
      } catch(err) {
        // Silently ignore constraint violations
      }

      try {
        // Insert business interaction (product_id = null)
        await supabase.from('interactions').insert({
          buyer_id: supabaseUser.id,
          seller_id: product.seller.id || '00000000-0000-0000-0000-000000000000',
          product_id: null,
          status: 'pending_time'
        });
      } catch(err) {
        // Silently ignore constraint violations
      }
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product) return;
    const len = product.media ? product.media.length : product.images.length;
    setActiveImage((prev) => (prev === len - 1 ? 0 : prev + 1));
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product) return;
    const len = product.media ? product.media.length : product.images.length;
    setActiveImage((prev) => (prev === 0 ? len - 1 : prev - 1));
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, profiles!user_id(*)')
          .eq('id', productId)
          .single();

        if (data && !error) {
          const sellerProfile = data.profiles || {};
          
          let productRating = 0;
          let productReviewsCount = 0;
          let sellerRating = 0;
          let sellerReviewsCount = 0;

          const { data: prodRevs } = await supabase.from('reviews')
            .select('id, product_rating, comment, created_at, interactions!inner(buyer_id)')
            .eq('product_id', productId)
            .eq('is_published', true)
            .not('product_rating', 'is', null)
            .order('created_at', { ascending: false });

          let productReviewsList: any[] = [];
          if (prodRevs && prodRevs.length > 0) {
            productReviewsCount = prodRevs.length;
            const sum = prodRevs.reduce((acc, r: any) => acc + (r.product_rating || 0), 0);
            productRating = parseFloat((sum / productReviewsCount).toFixed(1));

            const buyerIds = prodRevs.map((r: any) => r.interactions?.buyer_id).filter(Boolean);
            const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', buyerIds);
            const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
            
            productReviewsList = prodRevs.map((r: any) => {
              const buyer = profileMap.get(r.interactions?.buyer_id) || {};
              return {
                id: r.id,
                rating: r.product_rating,
                comment: r.comment,
                date: r.created_at,
                buyerName: buyer.first_name ? `${buyer.first_name} ${buyer.last_name || ''}`.trim() : 'Usuario',
                buyerAvatar: buyer.avatar_url || null
              };
            });
          }

          const { data: sellRevs } = await supabase.from('reviews')
            .select('seller_rating, interactions!inner(seller_id)')
            .eq('interactions.seller_id', data.user_id)
            .eq('is_published', true)
            .not('seller_rating', 'is', null);
          if (sellRevs && sellRevs.length > 0) {
            sellerReviewsCount = sellRevs.length;
            const sum = sellRevs.reduce((acc, r: any) => acc + (r.seller_rating || 0), 0);
            sellerRating = parseFloat((sum / sellerReviewsCount).toFixed(1));
          }

          let relatedList: any[] = [];
          const { data: relProds } = await supabase
            .from('products')
            .select('id, name, price, category, image, media, has_discount, discount_type, discount_value, user_id, profiles!user_id(store_name, full_name)')
            .eq('user_id', data.user_id)
            .eq('category', data.category)
            .neq('id', data.id)
            .limit(4);

          if (relProds && relProds.length > 0) {
            relatedList = relProds.map(p => {
              const prof: any = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
              return {
                id: p.id,
                name: p.name,
                price: p.price,
                category: p.category,
                image: p.image || (p.media && p.media[0]?.url) || 'https://images.unsplash.com/photo-1542673898-7c85854b73b2?q=80&w=300&auto=format&fit=crop',
                seller: { id: p.user_id, name: prof?.store_name || prof?.full_name || 'Mi Negocio' }
              };
            });
          }

          setProduct({
            id: data.id,
            name: data.name,
            price: data.price,
            category: data.category,
            subcategory: data.subcategory,
            condition: data.condition,
            stockMode: data.stock_mode || 'ilimitado',
            stock: data.stock || null,
            description: data.description,
            images: [data.image],
            media: data.media || [{ url: data.image, type: 'image' }],
            features: data.features || [],
            originalPrice: data.has_discount && data.discount_type === 'fijo' && parseFloat(data.discount_value) > 0
              ? (parseFloat(String(data.price).replace(/[^0-9.]/g, '')) + parseFloat(data.discount_value)) 
              : data.has_discount && data.discount_type === 'porcentaje' && parseFloat(data.discount_value) > 0
              ? (parseFloat(String(data.price).replace(/[^0-9.]/g, '')) / (1 - (parseFloat(data.discount_value) / 100))) 
              : undefined,
            discount: data.has_discount ? { name: data.discount_name, type: data.discount_type, value: data.discount_value } : undefined,
            rating: productRating,
            reviewsCount: productReviewsCount,
            reviewsList: productReviewsList,
            seller: {
              id: data.user_id,
              name: sellerProfile.store_name || sellerProfile.full_name || 'Mi Negocio',
              avatar: sellerProfile.avatar_url || '',
              phone: sellerProfile.phone || '',
              shippingCost: data.shipping_cost,
              branches: data.pickup_branches || [],
              rating: sellerRating,
              reviewsCount: sellerReviewsCount,
              planTier: sellerProfile.product_plan_tier || 'gratis'
            },
            relatedProducts: relatedList
          });
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error(e);
      }

      // Fallback a localStorage (antiguo)
      const existingStr = localStorage.getItem('cazamarket_my_products');
      if (existingStr) {
        const existing = JSON.parse(existingStr);
        const customProduct = existing.find((p: any) => p.id.toString() === productId);
        if (customProduct) {
          setProduct({
            id: customProduct.id,
            name: customProduct.name,
            price: customProduct.price,
            category: customProduct.category,
            condition: customProduct.condition,
            description: customProduct.description || '',
            images: customProduct.image ? [customProduct.image] : [],
            media: customProduct.media || (customProduct.image ? [{ url: customProduct.image, type: 'image' }] : []),
            features: customProduct.features || [],
            originalPrice: customProduct.discount ? (customProduct.discount.type === 'fijo' ? (parseFloat(customProduct.price.replace(/[^0-9.]/g, '')) + parseFloat(customProduct.discount.value)) : (parseFloat(customProduct.price.replace(/[^0-9.]/g, '')) / (1 - parseFloat(customProduct.discount.value) / 100))) : undefined,
            discount: customProduct.discount,
            seller: {
              id: customProduct.storeId || 1,
              name: customProduct.store || 'Mi Negocio',
              avatar: customProduct.avatar || '',
              shippingCost: customProduct.shippingCost,
              branches: customProduct.branches || [],
              planTier: 'gratis'
            },
            relatedProducts: []
          });
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(false);
    };

    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        window.scrollTo({ top: 180, behavior: 'smooth' });
      }, 50);
    }
  }, [isLoading]);

  if (isLoading) {
    return <LoadingScreen message="Buscando los detalles del producto..." />;
  }

  if (!product) {
    return (
      <div className="container-page" style={{ paddingTop: '100px', paddingBottom: '100px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--color-text-main)', marginBottom: '16px' }}>Producto no encontrado</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>El producto que estás buscando no existe o fue eliminado.</p>
        <Link href="/" style={{ padding: '12px 24px', background: 'var(--color-primary)', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600 }}>Volver al inicio</Link>
      </div>
    );
  }

  const isCustomColorsAllowed = product.seller.id === 1 ? true : false; // For now assuming mock sellers don't have this plan logic handled deeply, or we just trust if theme exists. Actually let's just check if theme exists.
  const customStyles = (product.seller?.theme) ? {
    paddingTop: '40px', paddingBottom: '80px', paddingLeft: '4%', paddingRight: '4%', position: 'relative',
    '--color-primary': product.seller.theme.primaryColor,
    '--color-text-main': themeColors.isLight ? '#1a1c18' : product.seller.theme.textColor,
    '--color-bg-base': themeColors.isLight ? '#f5f3ee' : product.seller.theme.bgColor
  } as React.CSSProperties : { paddingTop: '40px', paddingBottom: '80px', paddingLeft: '4%', paddingRight: '4%', position: 'relative' } as React.CSSProperties;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: themeColors.isLight ? '#f5f3ee' : (product.seller?.theme ? product.seller.theme.bgColor : 'var(--color-bg-base)'),
      transition: 'background-color 0.3s ease'
    }}>
      <div className="container-page" style={customStyles}>

      {/* Toast Notification Container */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#25D366' : 'var(--color-bg-surface-elevated)',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: 'var(--radius-full)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 9999,
          animation: 'slideUp 0.3s ease-out forwards',
          fontWeight: 500
        }}>
          {toast.type === 'error' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          )}
          {toast.type === 'success' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          )}
          {toast.type === 'info' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          )}
          <span>{toast.text}</span>
          {toast.action && (
            <Link href={toast.action.href} onClick={() => setToast(null)} style={{ marginLeft: '12px', padding: '6px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', color: '#fff', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {toast.action.label}
            </Link>
          )}
        </div>
      )}

      <div className="product-layout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start', marginBottom: '64px' }}>

        {/* Galería de Imágenes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className="glass-panel product-image-container"
            style={{ position: 'relative', padding: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={() => setIsHoveringImage(true)}
            onMouseLeave={() => setIsHoveringImage(false)}
          >
            {product.media && product.media[activeImage]?.type === 'video' ? (
              <video
                src={product.media[activeImage].url}
                controls
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
              />
            ) : (
              <img
                src={(product.media && product.media[activeImage]?.url) || (product.images && product.images[activeImage]) || 'https://images.unsplash.com/photo-1542673898-7c85854b73b2?q=80&w=1200&auto=format&fit=crop'}
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1542673898-7c85854b73b2?q=80&w=1200&auto=format&fit=crop';
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
            {/* Botón Anterior */}
            <button
              onClick={prevImage}
              style={{
                position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '44px', height: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                opacity: isHoveringImage ? 1 : 0, transition: 'all 0.2s', zIndex: 10
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.85)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            {/* Botón Siguiente */}
            <button
              onClick={nextImage}
              style={{
                position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '44px', height: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                opacity: isHoveringImage ? 1 : 0, transition: 'all 0.2s', zIndex: 10
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.85)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {(product.media || product.images.map((img: string) => ({ url: img, type: 'image' }))).map((m: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: activeImage === idx ? '2px solid var(--color-primary)' : '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: activeImage === idx ? '0 0 12px color-mix(in srgb, var(--color-primary) 40%, transparent)' : 'none',
                  cursor: 'pointer',
                  padding: 0,
                  background: 'rgba(0,0,0,0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                <img
                  src={m.url || m}
                  alt={`Vista ${idx + 1}`}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1542673898-7c85854b73b2?q=80&w=1200&auto=format&fit=crop';
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Info del Producto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div>
            {/* Store Avatar + Name + Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', cursor: product.seller?.planTier && product.seller.planTier !== 'gratis' ? 'pointer' : 'default' }} onClick={() => { if (product.seller?.id && product.seller?.planTier && product.seller.planTier !== 'gratis') router.push(`/negocios/${product.seller.id}`); }}>
              <img src={product.seller?.avatar || 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=200&auto=format&fit=crop'} alt={product.seller?.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-border)' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'var(--color-primary)', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold' }}>{product.seller?.name || 'Vendedor'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: (product.seller?.rating || 0) > 0 ? '#FFD700' : 'var(--color-text-muted)', marginTop: '2px' }} title={`${product.seller?.reviewsCount || 0} reseña${product.seller?.reviewsCount !== 1 ? 's' : ''}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={(product.seller?.rating || 0) > 0 ? '#FFD700' : 'currentColor'} stroke={(product.seller?.rating || 0) > 0 ? '#FFD700' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  {(product.seller?.rating || 0) > 0 ? product.seller.rating.toFixed(1) : '0.0 (Nuevo)'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span style={{ background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-block' }}>
                {product.category}
              </span>
              {product.subcategory && (
                <span style={{ background: 'transparent', color: 'var(--color-text-main)', border: '1px solid var(--color-border)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-block' }}>
                  {product.subcategory}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
              <h1 style={{ fontSize: '2.2rem', color: 'var(--color-text-main)', margin: '0', lineHeight: 1.2, fontWeight: 700, letterSpacing: '-0.3px' }}>
                {product.name}
              </h1>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.2rem', color: (product.rating || 0) > 0 ? '#FFD700' : 'var(--color-text-muted)', flexShrink: 0, marginTop: '4px' }} title={`${product.reviewsCount || 0} reseña${product.reviewsCount !== 1 ? 's' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill={(product.rating || 0) > 0 ? '#FFD700' : 'currentColor'} stroke={(product.rating || 0) > 0 ? '#FFD700' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                {(product.rating || 0) > 0 ? product.rating.toFixed(1) : '0.0 (Nuevo)'}
              </span>
            </div>

            {/* ID, Condición y Stock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <span style={{ color: 'color-mix(in srgb, var(--color-text-main) 60%, transparent)', fontSize: '0.9rem' }}>
                ID: #{productId}
              </span>
              <span style={{ color: 'color-mix(in srgb, var(--color-text-main) 30%, transparent)' }}>•</span>
              <span style={{ color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>
                {product.condition}
              </span>
              {(((product.stockMode === 'definido' || product.stock_mode === 'definido') && product.stock !== null && product.stock !== undefined) || Number(productId) === 2) && (
                <>
                  <span style={{ color: 'color-mix(in srgb, var(--color-text-main) 30%, transparent)' }}>•</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Stock disponible: {product.stock !== null && product.stock !== undefined ? product.stock : 5}
                  </span>
                </>
              )}
            </div>

            {/* Precio */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>
                {typeof product.price === 'number' ? '$ ' + product.price.toLocaleString('es-AR') : product.price}
              </span>
              {product.originalPrice && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '1.2rem', color: 'color-mix(in srgb, var(--color-text-main) 40%, transparent)', textDecoration: 'line-through', paddingBottom: '4px' }}>
                    $ {product.originalPrice.toLocaleString('es-AR')}
                  </span>
                  {product.discount && (
                    <span style={{ fontSize: '0.85rem', color: '#25D366', fontWeight: 600 }}>
                      {product.discount.name} ({product.discount.type === 'porcentaje' ? `${product.discount.value}% OFF` : `$${product.discount.value} OFF`})
                    </span>
                  )}
                </div>
              )}
            </div>



            {/* Opciones de Envío y Retiro */}
            {(product.seller.shippingCost || (product.seller.branches && product.seller.branches.length > 0)) && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'color-mix(in srgb, var(--color-text-main) 3%, transparent)', borderRadius: 'var(--radius-md)', border: '1px solid color-mix(in srgb, var(--color-text-main) 8%, transparent)' }}>
                {product.seller.shippingCost && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.95rem', marginBottom: '4px' }}>Opciones de Envío</div>
                      <div style={{ fontSize: '0.85rem', color: 'color-mix(in srgb, var(--color-text-main) 60%, transparent)' }}>{product.seller.shippingCost}</div>
                    </div>
                  </div>
                )}
                {product.seller.branches && product.seller.branches.length > 0 && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.95rem', marginBottom: '4px' }}>Retiro en Sucursal</div>
                      <div style={{ fontSize: '0.85rem', color: 'color-mix(in srgb, var(--color-text-main) 60%, transparent)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {product.seller.branches.map((branch: string, idx: number) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'var(--color-primary)' }}>•</span>
                            <span>{branch}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Banner Condicional ANMaC para Armas */}
          {(product.category === 'Armas' || product.category === 'armas_de_fuego' || product.category?.toLowerCase().includes('arma')) && (
            <div style={{ background: 'rgba(255, 193, 7, 0.1)', border: '1px solid #ffc107', borderRadius: '8px', padding: '12px', marginTop: '16px' }}>
              <p style={{ margin: 0, color: '#ffc107', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <span>⚠️ Atención: La compra/venta de este artículo requiere Credencial de Legítimo Usuario (CLU) vigente y trámite ante ANMaC. CazaMarket no interviene en la transacción.</span>
              </p>
            </div>
          )}

          {/* Botones de Acción */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '16px' }}>

            {/* 1. Contactar Vendedor */}
            <div style={{ position: 'relative', width: '100%' }}>
              <button 
                onClick={(e) => {
                  if (!isLoggedIn) {
                    showToast('Debes iniciar sesión para contactar al vendedor', 'error');
                    return;
                  }
                  if (supabaseUser && supabaseUser.id === product.seller.id) {
                    showToast('No puedes contactarte a ti mismo', 'error');
                    return;
                  }
                  setIsContactMenuOpen(!isContactMenuOpen);
                }}
                style={{ 
                  width: '100%', 
                  padding: '14px 18px', 
                  fontSize: '0.95rem', 
                  fontWeight: 700, 
                  borderRadius: '12px', 
                  background: 'var(--color-primary)', 
                  border: 'none', 
                  color: '#fff', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '8px', 
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)' 
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span>Contactar</span>
              </button>

              {isContactMenuOpen && (() => {
                let buyerName = username || 'cliente';
                let rawPhone = product.seller.phone && product.seller.phone !== 'No especificado' ? product.seller.phone : '';
                
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

                const waMessage = `Hola, soy ${buyerName} y te escribo para pedir información sobre el producto ${product.name}`;
                const isArma = product.category === 'Armas' || product.category === 'armas_de_fuego' || product.category?.toLowerCase().includes('arma');
                const anmacNotice = isArma ? `\n\n---\nAviso de seguridad CazaMarket:* Te recordamos que la transferencia de este artículo debe realizarse estrictamente bajo la normativa de ANMaC, exigiendo CLU vigente.*` : '';
                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage + anmacNotice)}`;



                return (
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: '105%', 
                      left: 0, 
                      width: '240px', 
                      background: 'var(--color-bg-surface-elevated)', 
                      backdropFilter: 'blur(12px)',
                      border: '1px solid color-mix(in srgb, var(--color-text-main) 15%, transparent)', 
                      borderRadius: '16px', 
                      padding: '10px', 
                      zIndex: 100, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '12px', 
                      transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease',
                      boxShadow: '0 15px 35px rgba(0,0,0,0.85), 0 0 20px rgba(0, 0, 0, 0.12)' 
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: 'color-mix(in srgb, var(--color-text-main) 45%, transparent)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 8px', fontWeight: 600 }}>
                      Contacto Directo
                    </span>

                    {/* 1. Link Directo WhatsApp con Mensaje Personalizado */}
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        setIsContactMenuOpen(false);
                        handleContactIntent();
                      }}
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="color-mix(in srgb, var(--color-text-main) 40%, transparent)" strokeWidth="2"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                    </a>


                  </div>
                );
              })()}
            </div>

            {/* 2. Botón Ver Tienda - Solo si el vendedor tiene plan pago */}
            {product.seller?.planTier && product.seller.planTier !== 'gratis' && (
            <Link href={`/negocios/${product.seller?.id || 1}`} style={{ textDecoration: 'none', width: '100%' }}>
              <button 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  fontSize: '0.95rem', 
                  fontWeight: 600, 
                  borderRadius: '12px', 
                  background: 'transparent', 
                  border: '1px solid var(--color-primary)', 
                  color: 'var(--color-primary)', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '8px' 
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 10%, transparent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                <span>Ver Tienda</span>
              </button>
            </Link>
            )}

            {/* 3. Añadir al Carrito - Visible solo si el vendedor tiene un plan pago */}
            {product.seller?.planTier !== 'gratis' && (
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  showToast('Para usar el carrito debes registrarte o iniciar sesión', 'error', { label: 'Registrarse', href: '/registro' });
                  return;
                }
                if (supabaseUser && supabaseUser.id === product.seller.id) {
                  showToast('No puedes agregar tus propios productos', 'error');
                  return;
                }
                if (isInCart) {
                  router.push('/carrito');
                } else {
                  addToCart({
                    id: `producto-${product.id}`,
                    name: product.name,
                    price: `$${product.price.toLocaleString('es-AR')}`,
                    image: product.images ? product.images[0] : '',
                    store: product.seller.name,
                    storeId: product.seller.id,
                    type: 'producto',
                    category: product.category,
                    baseDiscount: product.discount ? { type: product.discount.type, value: product.discount.value } : undefined,
                    volumeDiscounts: product.volumeDiscounts
                  });
                  showToast('Agregado al carrito', 'success');
                }
              }}
              style={{ 
                width: '100%', 
                padding: '14px 18px', 
                fontSize: '0.95rem', 
                fontWeight: 600, 
                borderRadius: '12px', 
                background: isInCart ? 'rgba(37,211,102,0.15)' : themeColors.bgSubtle4, 
                border: isInCart ? '1px solid rgba(37,211,102,0.4)' : `1px solid ${themeColors.borderSubtle3}`, 
                color: isInCart ? '#25D366' : themeColors.textWhite, 
                cursor: 'pointer', 
                transition: 'all 0.2s ease', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '8px' 
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = isInCart ? 'rgba(37,211,102,0.25)' : themeColors.bgSubtle3; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = isInCart ? 'rgba(37,211,102,0.15)' : themeColors.bgSubtle4; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {isInCart ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Ver Carrito</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                  <span>Al Carrito</span>
                </>
              )}
            </button>
            )}

            {/* 4. Chat Directo (Sólo si tiene plan compatible) */}
            {hasFeature('chatInterno') && (
              <Link href="/chat" style={{ textDecoration: 'none', width: '100%' }} onClick={() => handleContactIntent()}>
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
                  <span>Chat</span>
                </button>
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* Descripción y Características a lo largo de todo */}
      <div style={{ padding: '0 20px', marginBottom: '64px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', color: 'var(--color-text-main)' }}>Descripción del Producto</h3>
            <div 
              style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, fontSize: '1.05rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              dangerouslySetInnerHTML={{ __html: sanitizeInput(product.description) }}
            />
          </div>

          {product.features && product.features.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', color: 'var(--color-text-main)' }}>Características Principales</h3>
              <ul style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, fontSize: '1.05rem', paddingLeft: '24px', margin: 0 }}>
                {product.features.map((feature: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: '12px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{feature}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* RESEÑAS DEL PRODUCTO */}
          <div style={{ marginTop: '48px', borderTop: '1px solid var(--color-border)', paddingTop: '32px' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              Reseñas del Producto
              {product.rating > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,215,0,0.1)', color: '#FFD700', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '1.1rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  {product.rating}
                </span>
              )}
            </h3>
            <p style={{ color: 'var(--color-text-muted)', margin: '0 0 24px 0', fontSize: '0.95rem' }}>Lo que dicen los clientes que compraron este producto.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {product.reviewsList && product.reviewsList.length > 0 ? (
                product.reviewsList.map((review: any) => (
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
                  No hay reseñas para este producto todavía.
                </div>
              )}
            </div>
          </div>
          
          {/* PRODUCTOS RELACIONADOS */}
          {getSellerFeature('categorias') && product.relatedProducts && product.relatedProducts.length > 0 && (
            <div style={{ marginTop: '48px', borderTop: '1px solid var(--color-border)', paddingTop: '32px' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', color: 'var(--color-text-main)' }}>
                Más de la categoría: {product.category}
              </h3>
              <p style={{ color: 'var(--color-text-muted)', margin: '0 0 24px 0', fontSize: '0.95rem' }}>Otros productos de {product.seller?.name || 'este vendedor'} que podrían interesarte.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                {product.relatedProducts.map((rel: any) => (
                  <Link key={rel.id} href={`/productos/${rel.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'rgba(255,255,255,0.02)', transition: 'transform 0.2s', paddingBottom: '12px' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                      <img src={rel.image || (rel.media && rel.media[0]?.url) || 'https://images.unsplash.com/photo-1542673898-7c85854b73b2?q=80&w=300&auto=format&fit=crop'} alt={rel.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                      <div style={{ padding: '12px' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rel.name}</h4>
                        <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>USD {rel.price}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
