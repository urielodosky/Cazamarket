'use client';

import React, { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { HeartIcon } from '@heroicons/react/24/solid';
import { sanitizeInput } from '@/lib/sanitize';
import parse from 'html-react-parser';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getPlanPermissions } from '@/types/planTypes';
import '../producto.css';
import ReportModal from '@/components/ReportModal';
import ProductGallery from '@/components/ProductGallery';
import ProductReviews from '@/components/ProductReviews';
import RelatedProducts from '@/components/RelatedProducts';
import ProductInfo from '@/components/ProductInfo';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
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
            .select('id, product_rating, comment, created_at, interactions!inner(buyer_id, product_id)')
            .eq('interactions.product_id', productId)
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
        <ProductGallery product={product} />

        {/* Info del Producto */}
        <ProductInfo 
          product={product} 
          productId={productId} 
          router={router} 
          username={username} 
          isLoggedIn={isLoggedIn} 
          supabaseUser={supabaseUser} 
          isInCart={isInCart} 
          addToCart={addToCart} 
          themeColors={themeColors} 
          showToast={showToast} 
          handleContactIntent={handleContactIntent} 
          hasFeature={hasFeature} 
        />
      </div>


      {/* Descripción y Características a lo largo de todo */}
      <div className="pp-description-wrapper">
        <div className="pp-description-inner">
          <div style={{ marginBottom: '40px' }}>
            <h3 className="pp-section-title">Descripción del Producto</h3>
            <div 
              className="pp-description-text"
            >
              {parse(sanitizeInput(product.description))}
            </div>
          </div>

          {product.features && product.features.length > 0 && (
            <div>
              <h3 className="pp-section-title">Características Principales</h3>
              <ul className="pp-features-list">
                {product.features.map((feature: string, idx: number) => (
                  <li key={idx} className="pp-feature-item">{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Report Button */}
          <div className="pp-report-container">
            <button 
              onClick={() => setIsReportModalOpen(true)}
              className="pp-report-btn"
            >
              Denunciar publicación
            </button>
          </div>
          
          {/* RESEÑAS DEL PRODUCTO */}
          <ProductReviews product={product} />
          
          {/* PRODUCTOS RELACIONADOS */}
          <RelatedProducts product={product} getSellerFeature={getSellerFeature} />
        </div>
        </div>
      </div>
      
      <ReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportedType="product"
        reportedId={productId}
      />
    </div>
  );
}
