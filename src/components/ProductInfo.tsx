import React, { useState } from 'react';
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

  if (!product) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        {/* Store Avatar + Name + Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', cursor: product.seller?.planTier && product.seller.planTier !== 'gratis' ? 'pointer' : 'default' }} onClick={() => { if (product.seller?.id && product.seller?.planTier && product.seller.planTier !== 'gratis') router.push(`/negocios/${product.seller.id}`); }}>
          <div style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0 }}>
            <Image 
              src={product.seller?.avatar || 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=200&auto=format&fit=crop'} 
              alt={product.seller?.name || 'Vendedor'} 
              fill
              sizes="40px"
              style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-border)' }} 
            />
          </div>
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
  );
}
