import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ProductInfoProps {
  product: any;
  productId: string | number;
  router: any;
  username: string | null;
  isLoggedIn: boolean;
  supabaseUser: any;
  isInCart: boolean;
  addToCart: (item: any) => void;
  themeColors: any;
  showToast: (text: string, type: 'success' | 'error' | 'info', action?: any) => void;
  handleContactIntent: () => void;
  hasFeature: (feature: any) => boolean;
}

export default function ProductInfo({
  product,
  productId,
  router,
  username,
  isLoggedIn,
  supabaseUser,
  isInCart,
  addToCart,
  themeColors,
  showToast,
  handleContactIntent,
  hasFeature
}: ProductInfoProps) {
  const [isContactMenuOpen, setIsContactMenuOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const copyToClipboard = () => {
    if (currentUrl) {
      navigator.clipboard.writeText(currentUrl);
      showToast('¡Enlace copiado!', 'success');
    }
  };

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 30) return `hace ${diffDays} días`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return 'hace 1 mes';
    if (diffMonths < 12) return `hace ${diffMonths} meses`;
    return `hace más de 1 año`;
  };

  if (!product) return null;

  return (
    <div className="pi-container">
      <div>
        {/* Store Avatar + Name + Rating */}
        <div className="pi-store-card" style={{ cursor: product.seller?.planTier && product.seller.planTier !== 'gratis' ? 'pointer' : 'default' }} onClick={() => { if (product.seller?.id && product.seller?.planTier && product.seller.planTier !== 'gratis') router.push(`/negocios/${product.seller.id}`); }}>
          <div className="pi-store-avatar-container">
            <Image 
              src={product.seller?.avatar || 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=200&auto=format&fit=crop'} 
              alt={product.seller?.name || 'Vendedor'} 
              fill
              sizes="40px"
              className="pi-store-avatar"
              priority={true}
            />
          </div>
          <div className="pi-store-info">
            <span className="pi-store-name">{product.seller?.name || 'Vendedor'}</span>
            <span className="pi-store-rating" title={`${product.seller?.reviewsCount || 0} reseña${product.seller?.reviewsCount !== 1 ? 's' : ''}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={(product.seller?.rating || 0) > 0 ? '#FFD700' : 'currentColor'} stroke={(product.seller?.rating || 0) > 0 ? '#FFD700' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              {(product.seller?.rating || 0) > 0 ? product.seller.rating.toFixed(1) : '0.0 (Nuevo)'}
            </span>
          </div>
        </div>
        <div className="pi-badges-container">
          <span className="pi-badge pi-badge-primary">
            {product.category}
          </span>
          {product.subcategory && (
            <span className="pi-badge pi-badge-secondary">
              {product.subcategory}
            </span>
          )}
        </div>
        <div className="pi-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1 className="pi-title" style={{ margin: 0, paddingRight: '16px' }}>
            {product.name}
          </h1>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <span className="pi-rating" style={{ color: (product.rating || 0) > 0 ? '#FFD700' : 'var(--color-text-muted)', whiteSpace: 'nowrap' }} title={`${product.reviewsCount || 0} reseña${product.reviewsCount !== 1 ? 's' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={(product.rating || 0) > 0 ? '#FFD700' : 'currentColor'} stroke={(product.rating || 0) > 0 ? '#FFD700' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              {(product.rating || 0) > 0 ? product.rating.toFixed(1) : '0.0 (Nuevo)'}
            </span>
            <button 
              onClick={copyToClipboard}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'var(--color-text-main)',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              title="Copiar enlace"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>
          </div>
        </div>

        {/* ID, Condición y Stock */}
        <div className="pi-meta-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <span className="pi-meta-id">
            ID: #{productId}
          </span>
          <span className="pi-meta-dot">•</span>
          <span className="pi-meta-condition">
            {product.condition}
          </span>
          {(((product.stockMode === 'definido' || product.stock_mode === 'definido') && product.stock !== null && product.stock !== undefined) || Number(productId) === 2) && (
            <>
              <span className="pi-meta-dot">•</span>
              <span className="pi-meta-stock">
                Stock: {product.stock !== null && product.stock !== undefined ? product.stock : 5}
              </span>
            </>
          )}
          {product.updated_at && (
            <>
              <span className="pi-meta-dot">•</span>
              <span className="pi-meta-updated" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Actualizado {getTimeAgo(product.updated_at)}
              </span>
            </>
          )}
        </div>

        {/* Precio */}
        <div className="pi-price-container">
          <span className="pi-price">
            {typeof product.price === 'number' ? '$ ' + product.price.toLocaleString('es-AR') : product.price}
          </span>
          {product.originalPrice && (
            <div className="pi-original-price-container">
              <span className="pi-original-price">
                $ {product.originalPrice.toLocaleString('es-AR')}
              </span>
              {product.discount && (
                <span className="pi-discount">
                  {product.discount.name} ({product.discount.type === 'porcentaje' ? `${product.discount.value}% OFF` : `$${product.discount.value} OFF`})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Opciones de Envío y Retiro */}
        {(product.seller.shippingCost || (product.seller.branches && product.seller.branches.length > 0)) && (
          <div className="pi-shipping-box">
            {product.seller.shippingCost && (
              <div className="pi-shipping-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                <div>
                  <div className="pi-shipping-title">Opciones de Envío</div>
                  <div className="pi-shipping-text">{product.seller.shippingCost}</div>
                </div>
              </div>
            )}
            {product.seller.branches && product.seller.branches.length > 0 && (
              <div className="pi-shipping-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <div>
                  <div className="pi-shipping-title">Retiro en Sucursal</div>
                  <div className="pi-shipping-text" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
        <div className="pi-anmac-banner">
          <p className="pi-anmac-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span>⚠️ Atención: La compra/venta de este artículo requiere Credencial de Legítimo Usuario (CLU) vigente y trámite ante ANMaC. CazaMarket no interviene en la transacción.</span>
          </p>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="pi-actions-grid">
        {/* 1. Contactar Vendedor */}
        <div style={{ position: 'relative', width: '100%' }}>
          <button 
            onClick={(e) => {
              if (supabaseUser && supabaseUser.id === product.seller.id) {
                showToast('No puedes contactarte a ti mismo', 'error');
                return;
              }
              setIsContactMenuOpen(!isContactMenuOpen);
            }}
            className="pi-btn-contact"
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
              <div className="pi-wa-menu">
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
                  className="pi-wa-link"
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
          <button className="pi-btn-store">
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
  );
}
