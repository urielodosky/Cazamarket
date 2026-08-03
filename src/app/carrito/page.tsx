'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart, CartItem } from '@/contexts/CartContext';
import { NEGOCIOS_DATA } from '@/data/mock';
import { createClient } from '@/lib/supabase/client';

export default function CarritoPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity } = useCart();
  const { username, supabaseUser } = useAuth();
  const supabase = createClient();

  const parsePrice = (priceStr: string) => {
    return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  };

  const calculateItemTotal = (item: CartItem) => {
    let baseTotal = parsePrice(item.price) * item.quantity;
    let finalTotal = baseTotal;
    let activeDiscount = null;
    
    if (item.volumeDiscounts && item.volumeDiscounts.length > 0) {
      // Ordenar las reglas por minQty descendente para aplicar la mejor
      const sortedRules = [...item.volumeDiscounts].sort((a, b) => parseInt(b.minQty) - parseInt(a.minQty));
      const rule = sortedRules.find(r => item.quantity >= parseInt(r.minQty));
      
      if (rule) {
        activeDiscount = rule;
        const val = parseFloat(rule.value);
        if (rule.type === 'porcentaje') {
          finalTotal = finalTotal - (finalTotal * (val / 100));
        } else {
          finalTotal = finalTotal - val;
        }
      }
    }

    if (item.type === 'servicio' && item.timeDiscounts && item.timeDiscounts.length > 0) {
      const sortedRules = [...item.timeDiscounts].sort((a, b) => parseInt(b.minTime) - parseInt(a.minTime));
      const rule = sortedRules.find(r => item.quantity >= parseInt(r.minTime));
      
      if (rule) {
        activeDiscount = { ...rule, isTimeRule: true };
        const val = parseFloat(rule.value);
        if (rule.type === 'porcentaje') {
          finalTotal = finalTotal - (finalTotal * (val / 100));
        } else {
          finalTotal = finalTotal - val;
        }
      }
    }
    
    return { baseTotal, finalTotal: Math.max(0, finalTotal), activeDiscount };
  };

  // Group items by storeId
  const itemsByStore = cart.reduce<{ [key: string]: CartItem[] }>((acc, item) => {
    const key = String(item.storeId);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  const getStorePhone = (storeId: number) => {
    const store = NEGOCIOS_DATA.find(n => n.id === storeId);
    return store?.phone || '5491112345678';
  };

  const generateWhatsAppLink = (storeId: number, items: CartItem[], total: number) => {
    const phone = getStorePhone(storeId);
    const storeName = items[0].store;
    const buyerName = username || 'un cliente';
    
    let message = `Hola ${storeName}, soy ${buyerName} y estoy interesado en los productos:\n\n`;
    
    items.forEach(item => {
      message += `▪ ${item.quantity}x ${item.name} de ${item.price}\n`;
    });
    
    message += `\n*Total estimado: $${total.toFixed(2)}*\n\n¿Tienen disponibilidad y cómo sería el envío/pago?`;
    
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const handleCartCheckout = async (items: CartItem[]) => {
    if (!supabaseUser) return;
    
    try {
      // Registrar interacción por cada producto distinto en el carrito para esa tienda
      const uniqueProductIds = Array.from(new Set(items.map(i => i.id.replace('producto-', ''))));
      
      const inserts = uniqueProductIds.map(productId => ({
        buyer_id: supabaseUser.id,
        seller_id: items[0].storeId,
        product_id: parseInt(productId) || null, // Asumimos que id numérico es producto, sino null si es negocio
        status: 'pending_time'
      }));

      await supabase.from('interactions').insert(inserts);
    } catch (err) {
      console.error('Error recording cart interactions', err);
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-8) var(--spacing-4)', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h1 style={{ fontSize: '2rem', margin: 0, color: 'var(--color-text-main)' }}>Mi Carrito</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>Tus productos están agrupados por vendedor. Contacta a cada uno para finalizar tu compra.</p>
      </div>

      {cart.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
            <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <h2 style={{ color: 'var(--color-text-main)', marginBottom: '8px' }}>Tu carrito está vacío</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>Parece que aún no has agregado nada al carrito.</p>
          <button onClick={() => router.push('/productos')} className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: 'var(--radius-full)' }}>
            Explorar Productos
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.entries(itemsByStore).map(([storeIdStr, items]) => {
            const storeId = parseInt(storeIdStr);
            const storeName = items[0].store;
            const storeTotal = items.reduce((acc, item) => acc + calculateItemTotal(item).finalTotal, 0);
            
            return (
              <div key={storeId} className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
                
                {/* Lado izquierdo: Productos de esta tienda */}
                <div>
                  <h2 style={{ margin: '0 0 20px 0', fontSize: '1.4rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    Pedido a: <span style={{ color: 'var(--color-primary)' }}>{storeName}</span>
                  </h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {items.map(item => (
                      <div key={item.id} style={{ display: 'flex', gap: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                        
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--color-text-main)' }}>{item.name}</h3>
                            {calculateItemTotal(item).activeDiscount && (
                              <div style={{ display: 'inline-flex', padding: '2px 8px', background: 'rgba(37,211,102,0.1)', color: '#25D366', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(37,211,102,0.2)', marginBottom: '8px' }}>
                                {(calculateItemTotal(item).activeDiscount as any).isTimeRule ? '¡Descuento por estadía prolongada!' : '¡Descuento Mayorista Aplicado!'}
                              </div>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                              <button onClick={() => updateQuantity(item.id, -1)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-main)', padding: '4px 10px', cursor: 'pointer', fontSize: '1.1rem' }}>-</button>
                              <span style={{ padding: '0 8px', fontWeight: 600, color: 'var(--color-text-main)', minWidth: '30px', textAlign: 'center', fontSize: '0.9rem' }}>{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-main)', padding: '4px 10px', cursor: 'pointer', fontSize: '1.1rem' }}>+</button>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              {calculateItemTotal(item).activeDiscount && (
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textDecoration: 'line-through', paddingBottom: '2px' }}>
                                  ${calculateItemTotal(item).baseTotal.toFixed(2)}
                                </span>
                              )}
                              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
                                ${calculateItemTotal(item).finalTotal.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          title="Eliminar del carrito"
                          style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px', alignSelf: 'flex-start', transition: 'color 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ff4d4d'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lado derecho: Resumen y Botón WhatsApp */}
                <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '32px', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>Resumen del pedido</h3>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--color-text-main)' }}>
                    <span>Productos ({items.length})</span>
                    <span>${storeTotal.toFixed(2)}</span>
                  </div>
                  
                  <div style={{ height: '1px', background: 'var(--color-border)', margin: '16px 0' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', color: 'var(--color-text-main)', fontSize: '1.3rem', fontWeight: 'bold' }}>
                    <span>Total Estimado</span>
                    <span style={{ color: 'var(--color-success)' }}>${storeTotal.toFixed(2)}</span>
                  </div>
                  
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '24px', lineHeight: 1.5 }}>
                    Al hacer clic, se abrirá WhatsApp con un mensaje pre-armado detallando tu pedido. Podrás coordinar el pago y envío directamente con el vendedor.
                  </p>
                  
                  <a 
                    href={generateWhatsAppLink(storeId, items, storeTotal)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleCartCheckout(items)}
                    style={{ textDecoration: 'none', marginTop: 'auto' }}
                  >
                    <button style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-full)', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: '#25D366', color: '#fff', border: 'none', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      Pedir por WhatsApp
                    </button>
                  </a>
                </div>
                
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
