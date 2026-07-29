'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { createClient } from '@/lib/supabase/client';

export default function ResenasPage() {
  const router = useRouter();
  const { isLoggedIn, isMounted, supabaseUser, isVendor } = useAuth();
  const themeColors = useThemeColors();
  const supabase = createClient();

  // Tab principal: 'mis-resenas' (como vendedor) o 'resenas-dadas' (como comprador)
  // Por defecto, si es vendedor arranca en mis-resenas, si no, en resenas-dadas
  const [activeMainTab, setActiveMainTab] = useState<'mis-resenas' | 'resenas-dadas'>(isVendor ? 'mis-resenas' : 'resenas-dadas');
  
  // Sub-tabs
  const [activeSubTabMisResenas, setActiveSubTabMisResenas] = useState<'pendientes' | 'recibidas' | 'canceladas'>('pendientes');
  const [activeSubTabResenasDadas, setActiveSubTabResenasDadas] = useState<'pendientes' | 'dadas' | 'canceladas'>('pendientes');

  const [sellerPendientes, setSellerPendientes] = useState<any[]>([]);
  const [sellerRecibidas, setSellerRecibidas] = useState<any[]>([]);
  const [sellerCanceladas, setSellerCanceladas] = useState<any[]>([]);
  
  const [buyerPendientes, setBuyerPendientes] = useState<any[]>([]);
  const [buyerDadas, setBuyerDadas] = useState<any[]>([]);
  const [buyerCanceladas, setBuyerCanceladas] = useState<any[]>([]);
  
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, isMounted, router]);

  useEffect(() => {
    if (!isMounted || !isLoggedIn || !supabaseUser) return;

    const fetchInteractions = async () => {
      setIsLoadingData(true);
      
      if (activeMainTab === 'mis-resenas' && isVendor) {
        // Fetch Pendientes (pending_time)
        const { data: pend } = await supabase.from('interactions')
          .select('*, profiles!buyer_id(first_name, last_name, avatar_url), products(name, image)')
          .eq('seller_id', supabaseUser.id)
          .eq('status', 'pending_time')
          .order('created_at', { ascending: false });
        setSellerPendientes(pend || []);

        // Fetch Recibidas (published) with reviews
        const { data: rec } = await supabase.from('interactions')
          .select('*, profiles!buyer_id(first_name, last_name, avatar_url), products(name, image), reviews(seller_rating, product_rating, comment, created_at)')
          .eq('seller_id', supabaseUser.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false });
        setSellerRecibidas(rec || []);

        // Fetch Canceladas (rejected_by_seller, appealed)
        const { data: canc } = await supabase.from('interactions')
          .select('*, profiles!buyer_id(first_name, last_name, avatar_url), products(name, image)')
          .eq('seller_id', supabaseUser.id)
          .in('status', ['rejected_by_seller', 'appealed'])
          .order('created_at', { ascending: false });
        setSellerCanceladas(canc || []);
      } else if (activeMainTab === 'resenas-dadas') {
        // Fetch Pendientes (ready_to_review)
        const { data: pend } = await supabase.from('interactions')
          .select('*, profiles!seller_id(first_name, last_name, store_name, avatar_url), products(name, image)')
          .eq('buyer_id', supabaseUser.id)
          .eq('status', 'ready_to_review')
          .order('created_at', { ascending: false });
        setBuyerPendientes(pend || []);

        // Fetch Dadas (published) with reviews
        const { data: dadas } = await supabase.from('interactions')
          .select('*, profiles!seller_id(first_name, last_name, store_name, avatar_url), products(name, image), reviews(seller_rating, product_rating, comment, created_at)')
          .eq('buyer_id', supabaseUser.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false });
        setBuyerDadas(dadas || []);

        // Fetch Canceladas (rejected_by_seller, appealed)
        const { data: canc } = await supabase.from('interactions')
          .select('*, profiles!seller_id(first_name, last_name, store_name, avatar_url), products(name, image)')
          .eq('buyer_id', supabaseUser.id)
          .in('status', ['rejected_by_seller', 'appealed'])
          .order('created_at', { ascending: false });
        setBuyerCanceladas(canc || []);
      }
      setIsLoadingData(false);
    };

    fetchInteractions();
  }, [activeMainTab, isMounted, isLoggedIn, supabaseUser, activeSubTabMisResenas, activeSubTabResenasDadas, isVendor]);

  const handleAcceptInteraction = async (id: string) => {
    try {
      await supabase.from('interactions').update({ status: 'ready_to_review' }).eq('id', id);
      setSellerPendientes(prev => prev.filter(i => i.id !== id));
    } catch(e) {
      console.error(e);
    }
  };

  const handleRejectInteraction = async (id: string) => {
    try {
      await supabase.from('interactions').update({ status: 'rejected_by_seller' }).eq('id', id);
      const rejected = sellerPendientes.find(i => i.id === id);
      setSellerPendientes(prev => prev.filter(i => i.id !== id));
      if (rejected) {
        setSellerCanceladas(prev => [{ ...rejected, status: 'rejected_by_seller' }, ...prev]);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleLeaveReview = async (id: string, productId: string | null) => {
    const comment = window.prompt('Escribe tu reseña:');
    if (!comment) return;
    const ratingStr = window.prompt('Calificación (1-5):', '5');
    const rating = Math.min(5, Math.max(1, parseInt(ratingStr || '5')));

    try {
      await supabase.from('reviews').insert({
        interaction_id: id,
        seller_rating: rating,
        product_rating: productId ? rating : null,
        comment: comment,
        is_published: true
      });

      await supabase.from('interactions').update({ status: 'published' }).eq('id', id);
      window.location.reload();
    } catch(e) {
      console.error(e);
    }
  };

  const handleAppeal = async (id: string) => {
    try {
      await supabase.from('interactions').update({ status: 'appealed' }).eq('id', id);
      setBuyerCanceladas(prev => prev.map(i => i.id === id ? { ...i, status: 'appealed' } : i));
    } catch(e) {
      console.error(e);
    }
  };

  if (!isMounted || !isLoggedIn) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', paddingTop: '90px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px 40px' }}>
        
        {/* Encabezado */}
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '12px', 
            background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--color-text-main)', fontWeight: 800 }}>Panel de Reseñas</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Administrá tus valoraciones y experiencias</p>
          </div>
        </div>

        {/* Tabs Principales */}
        <div style={{ 
          display: 'flex', gap: '8px', marginBottom: '24px', 
          background: themeColors.bgSubtle2, padding: '6px', borderRadius: '16px',
          overflowX: 'auto'
        }}>
          <button
            onClick={() => setActiveMainTab('mis-resenas')}
            style={{
              flex: 1, padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s ease',
              background: activeMainTab === 'mis-resenas' ? 'var(--color-bg-surface-elevated)' : 'transparent',
              color: activeMainTab === 'mis-resenas' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              boxShadow: activeMainTab === 'mis-resenas' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
              whiteSpace: 'nowrap'
            }}
          >
            Mis Reseñas (Recibidas)
          </button>
          <button
            onClick={() => setActiveMainTab('resenas-dadas')}
            style={{
              flex: 1, padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s ease',
              background: activeMainTab === 'resenas-dadas' ? 'var(--color-bg-surface-elevated)' : 'transparent',
              color: activeMainTab === 'resenas-dadas' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              boxShadow: activeMainTab === 'resenas-dadas' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
              whiteSpace: 'nowrap'
            }}
          >
            Reseñas Dadas (Enviadas)
          </button>
        </div>

        {/* Contenido según Main Tab */}
        <div style={{ 
          background: 'var(--color-bg-surface-elevated)', 
          borderRadius: '24px', 
          padding: '24px',
          border: `1px solid ${themeColors.borderSubtle2}`,
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
        }}>
          
          {activeMainTab === 'mis-resenas' && (
            <>
              {/* Subtabs de Mis Reseñas */}
              <div style={{ display: 'flex', gap: '20px', borderBottom: `1px solid ${themeColors.borderSubtle3}`, marginBottom: '24px' }}>
                <button
                  onClick={() => setActiveSubTabMisResenas('pendientes')}
                  style={{
                    padding: '0 0 12px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontWeight: activeSubTabMisResenas === 'pendientes' ? 700 : 500, fontSize: '0.95rem',
                    color: activeSubTabMisResenas === 'pendientes' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: activeSubTabMisResenas === 'pendientes' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    transition: 'all 0.2s ease', position: 'relative', top: '1px'
                  }}
                >
                  Pendientes a recibir
                </button>
                <button
                  onClick={() => setActiveSubTabMisResenas('recibidas')}
                  style={{
                    padding: '0 0 12px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontWeight: activeSubTabMisResenas === 'recibidas' ? 700 : 500, fontSize: '0.95rem',
                    color: activeSubTabMisResenas === 'recibidas' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: activeSubTabMisResenas === 'recibidas' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    transition: 'all 0.2s ease', position: 'relative', top: '1px'
                  }}
                >
                  Reseñas recibidas
                </button>
                <button
                  onClick={() => setActiveSubTabMisResenas('canceladas')}
                  style={{
                    padding: '0 0 12px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontWeight: activeSubTabMisResenas === 'canceladas' ? 700 : 500, fontSize: '0.95rem',
                    color: activeSubTabMisResenas === 'canceladas' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: activeSubTabMisResenas === 'canceladas' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    transition: 'all 0.2s ease', position: 'relative', top: '1px'
                  }}
                >
                  Reseñas canceladas
                </button>
              </div>

              {/* Contenido Subtabs Mis Reseñas */}
              <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flexDirection: 'column', gap: '16px' }}>
                {isLoadingData ? (
                  <p style={{ color: 'var(--color-text-muted)', marginTop: '40px' }}>Cargando...</p>
                ) : (
                  <>
                    {activeSubTabMisResenas === 'pendientes' && (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {sellerPendientes.length === 0 ? (
                          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '40px' }}>No hay valoraciones pendientes de validar.</p>
                        ) : (
                          sellerPendientes.map((item) => (
                            <div key={item.id} style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${themeColors.borderSubtle3}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <h4 style={{ margin: '0 0 4px', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>
                                    {item.profiles?.first_name ? `${item.profiles.first_name} ${item.profiles.last_name || ''}` : 'Usuario'}
                                  </h4>
                                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    {item.products ? `Compra: ${item.products.name}` : 'Interacción: General/Servicio'}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button onClick={() => handleAcceptInteraction(item.id)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Aceptar</button>
                                  <button onClick={() => handleRejectInteraction(item.id)} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${themeColors.borderSubtle3}`, background: 'transparent', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: 600 }}>Rechazar</button>
                                </div>
                              </div>
                              <p style={{ margin: '12px 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Quiere dejarte una reseña por esta compra.</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    {activeSubTabMisResenas === 'recibidas' && (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {sellerRecibidas.length === 0 ? (
                          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '40px' }}>No has recibido ninguna reseña aún.</p>
                        ) : (
                          sellerRecibidas.map((item) => {
                            const review = item.reviews && item.reviews.length > 0 ? item.reviews[0] : null;
                            const rating = review?.seller_rating || 0;
                            return (
                              <div key={item.id} style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${themeColors.borderSubtle3}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                  <div>
                                    <h4 style={{ margin: '0 0 4px', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>
                                      {item.profiles?.first_name ? `${item.profiles.first_name} ${item.profiles.last_name || ''}` : 'Usuario'}
                                    </h4>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                      {item.products ? `Compra: ${item.products.name}` : 'Interacción: General/Servicio'}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill={star <= rating ? "#FFD700" : "none"} stroke="#FFD700" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                    ))}
                                  </div>
                                </div>
                                <p style={{ margin: 0, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{review?.comment ? `"${review.comment}"` : "Sin comentario."}</p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                    {activeSubTabMisResenas === 'canceladas' && (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {sellerCanceladas.length === 0 ? (
                          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '40px' }}>No hay reseñas canceladas.</p>
                        ) : (
                          sellerCanceladas.map((item) => (
                            <div key={item.id} style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${themeColors.borderSubtle3}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <h4 style={{ margin: '0 0 4px', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>
                                    {item.profiles?.first_name ? `${item.profiles.first_name} ${item.profiles.last_name || ''}` : 'Usuario'}
                                  </h4>
                                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    {item.products ? `Compra: ${item.products.name}` : 'Interacción: General/Servicio'}
                                  </span>
                                </div>
                                <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,0,0,0.1)', color: '#ff6b6b', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                  {item.status === 'appealed' ? 'Apelada' : 'Rechazada'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {activeMainTab === 'resenas-dadas' && (
            <>
              {/* Subtabs de Reseñas Dadas */}
              <div style={{ display: 'flex', gap: '20px', borderBottom: `1px solid ${themeColors.borderSubtle3}`, marginBottom: '24px' }}>
                <button
                  onClick={() => setActiveSubTabResenasDadas('pendientes')}
                  style={{
                    padding: '0 0 12px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontWeight: activeSubTabResenasDadas === 'pendientes' ? 700 : 500, fontSize: '0.95rem',
                    color: activeSubTabResenasDadas === 'pendientes' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: activeSubTabResenasDadas === 'pendientes' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    transition: 'all 0.2s ease', position: 'relative', top: '1px'
                  }}
                >
                  Pendientes de enviar
                </button>
                <button
                  onClick={() => setActiveSubTabResenasDadas('dadas')}
                  style={{
                    padding: '0 0 12px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontWeight: activeSubTabResenasDadas === 'dadas' ? 700 : 500, fontSize: '0.95rem',
                    color: activeSubTabResenasDadas === 'dadas' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: activeSubTabResenasDadas === 'dadas' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    transition: 'all 0.2s ease', position: 'relative', top: '1px'
                  }}
                >
                  Reseñas dadas
                </button>
                <button
                  onClick={() => setActiveSubTabResenasDadas('canceladas')}
                  style={{
                    padding: '0 0 12px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontWeight: activeSubTabResenasDadas === 'canceladas' ? 700 : 500, fontSize: '0.95rem',
                    color: activeSubTabResenasDadas === 'canceladas' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: activeSubTabResenasDadas === 'canceladas' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    transition: 'all 0.2s ease', position: 'relative', top: '1px'
                  }}
                >
                  Reseñas canceladas
                </button>
              </div>

              {/* Contenido Subtabs Reseñas Dadas */}
              {/* Contenido Subtabs Reseñas Dadas */}
              <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flexDirection: 'column', gap: '16px' }}>
                {isLoadingData ? (
                  <p style={{ color: 'var(--color-text-muted)', marginTop: '40px' }}>Cargando...</p>
                ) : (
                  <>
                    {activeSubTabResenasDadas === 'pendientes' && (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {buyerPendientes.length === 0 ? (
                          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '40px' }}>No tenés reseñas pendientes de enviar.</p>
                        ) : (
                          buyerPendientes.map((item) => (
                            <div key={item.id} style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${themeColors.borderSubtle3}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <h4 style={{ margin: '0 0 4px', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>
                                    {item.profiles?.store_name || (item.profiles?.first_name ? `${item.profiles.first_name} ${item.profiles.last_name || ''}` : 'Negocio')}
                                  </h4>
                                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    {item.products ? `Producto: ${item.products.name}` : 'Interacción: General/Servicio'}
                                  </span>
                                </div>
                                <button onClick={() => handleLeaveReview(item.id, item.product_id)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Dejar reseña</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    {activeSubTabResenasDadas === 'dadas' && (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {buyerDadas.length === 0 ? (
                          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '40px' }}>No has dejado ninguna reseña aún.</p>
                        ) : (
                          buyerDadas.map((item) => {
                            const review = item.reviews && item.reviews.length > 0 ? item.reviews[0] : null;
                            const rating = review?.seller_rating || 0;
                            return (
                              <div key={item.id} style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${themeColors.borderSubtle3}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                  <div>
                                    <h4 style={{ margin: '0 0 4px', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>
                                      {item.profiles?.store_name || (item.profiles?.first_name ? `${item.profiles.first_name} ${item.profiles.last_name || ''}` : 'Negocio')}
                                    </h4>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                      {item.products ? `Producto: ${item.products.name}` : 'Interacción: General/Servicio'}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill={star <= rating ? "#FFD700" : "none"} stroke="#FFD700" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                    ))}
                                  </div>
                                </div>
                                <p style={{ margin: 0, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{review?.comment ? `"${review.comment}"` : "Sin comentario."}</p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                    {activeSubTabResenasDadas === 'canceladas' && (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {buyerCanceladas.length === 0 ? (
                          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '40px' }}>No hay reseñas canceladas.</p>
                        ) : (
                          buyerCanceladas.map((item) => (
                            <div key={item.id} style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,0,0,0.03)', border: '1px solid rgba(255,0,0,0.2)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                  <h4 style={{ margin: '0 0 4px', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>
                                    {item.profiles?.store_name || (item.profiles?.first_name ? `${item.profiles.first_name} ${item.profiles.last_name || ''}` : 'Negocio')}
                                  </h4>
                                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    {item.status === 'appealed' ? 'Reseña en proceso de apelación' : 'Reseña rechazada por el vendedor'}
                                  </span>
                                </div>
                              </div>
                              <p style={{ margin: '0 0 16px 0', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                                {item.status === 'appealed' ? 'Tu apelación está siendo revisada por el soporte.' : 'El negocio rechazó la solicitud para dejar tu valoración.'}
                              </p>
                              {item.status === 'rejected_by_seller' && (
                                <button onClick={() => handleAppeal(item.id)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                                  ¿Querés apelar el rechazo?
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
