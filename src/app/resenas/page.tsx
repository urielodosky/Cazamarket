'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { createClient } from '@/lib/supabase/client';

export default function ResenasPage() {
  const router = useRouter();
  const { isLoggedIn, isMounted, supabaseUser, isVendor } = useAuth();
  const themeColors = useThemeColors();
  const supabase = createClient();

  const getSafeImageUrl = (urlInput: any, type: 'avatar' | 'product') => {
    let url = urlInput;
    if (Array.isArray(url)) url = url[0];
    if (typeof url !== 'string') url = '';
    if (!url) return type === 'avatar' ? '/default-avatar.png' : '/placeholder.jpg';
    if (url.startsWith('http') || url.startsWith('/')) return url;
    
    // Si la URL es solo un string del id de supabase o una ruta parcial del storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (supabaseUrl && !url.includes('supabase.co')) {
       const bucket = type === 'avatar' ? 'avatars' : 'products';
       return `${supabaseUrl}/storage/v1/object/public/${bucket}/${url}`;
    }
    if (url.includes('supabase.co') && !url.startsWith('http')) {
       return `https://${url}`;
    }
    return url;
  };


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

  // Modales
  const [buyerReviewModal, setBuyerReviewModal] = useState<{ show: boolean, interactionId: string, productId: string | null }>({ show: false, interactionId: '', productId: null });
  const [buyerReviewData, setBuyerReviewData] = useState<{ outcome: string, comment: string, rating: number }>({ outcome: 'concreto', comment: '', rating: 5 });
  
  const [sellerReviewModal, setSellerReviewModal] = useState<{ show: boolean, interactionId: string }>({ show: false, interactionId: '' });
  const [sellerReviewData, setSellerReviewData] = useState<{ rating: number, comment: string }>({ rating: 5, comment: '' });
  
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, isMounted, router]);

  useEffect(() => {
    if (!isMounted || !isLoggedIn || !supabaseUser) return;

    const fetchInteractions = async () => {
      setIsLoadingData(true);
      
      const augmentWithProfiles = async (items: any[], isBuyerProfile: boolean) => {
        if (!items || items.length === 0) return [];
        const ids = [...new Set(items.map(i => isBuyerProfile ? i.buyer_id : i.seller_id))].filter(Boolean);
        if (ids.length === 0) return items;
        const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, store_name, avatar_url').in('id', ids);
        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        return items.map(i => ({
          ...i,
          profiles: profileMap.get(isBuyerProfile ? i.buyer_id : i.seller_id) || {}
        }));
      };

      if (activeMainTab === 'mis-resenas' && isVendor) {
        const [pendRes, recRes, cancRes] = await Promise.all([
          supabase.from('interactions')
            .select('*, products(name, image)')
            .eq('seller_id', supabaseUser.id)
            .eq('status', 'ready_to_review')
            .order('created_at', { ascending: false }),
          supabase.from('interactions')
            .select('*, products(name, image), reviews(seller_rating, product_rating, comment, created_at)')
            .eq('seller_id', supabaseUser.id)
            .eq('status', 'published')
            .order('created_at', { ascending: false }),
          supabase.from('interactions')
            .select('*, products(name, image)')
            .eq('seller_id', supabaseUser.id)
            .in('status', ['rejected_by_seller', 'appealed'])
            .order('created_at', { ascending: false })
        ]);

        const [augPend, augRec, augCanc] = await Promise.all([
          augmentWithProfiles(pendRes.data || [], true),
          augmentWithProfiles(recRes.data || [], true),
          augmentWithProfiles(cancRes.data || [], true)
        ]);

        setSellerPendientes(augPend);
        setSellerRecibidas(augRec);
        setSellerCanceladas(augCanc);
      } else if (activeMainTab === 'resenas-dadas') {
        const [pendRes, dadasRes, cancRes] = await Promise.all([
          supabase.from('interactions')
            .select('*, products(name, image)')
            .eq('buyer_id', supabaseUser.id)
            .eq('status', 'pending_time')
            .order('created_at', { ascending: false }),
          supabase.from('interactions')
            .select('*, products(name, image), reviews(seller_rating, product_rating, comment, created_at)')
            .eq('buyer_id', supabaseUser.id)
            .eq('status', 'published')
            .order('created_at', { ascending: false }),
          supabase.from('interactions')
            .select('*, products(name, image)')
            .eq('buyer_id', supabaseUser.id)
            .in('status', ['rejected_by_seller', 'appealed'])
            .order('created_at', { ascending: false })
        ]);

        const [augPend, augDadas, augCanc] = await Promise.all([
          augmentWithProfiles(pendRes.data || [], false),
          augmentWithProfiles(dadasRes.data || [], false),
          augmentWithProfiles(cancRes.data || [], false)
        ]);

        setBuyerPendientes(augPend);
        setBuyerDadas(augDadas);
        setBuyerCanceladas(augCanc);
      }
      setIsLoadingData(false);
    };

    fetchInteractions();

    if (!supabaseUser) return;
    
    const buyerChannel = supabase.channel('interactions_buyer_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interactions', filter: `buyer_id=eq.${supabaseUser.id}` }, () => {
        fetchInteractions();
      })
      .subscribe();

    const sellerChannel = supabase.channel('interactions_seller_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interactions', filter: `seller_id=eq.${supabaseUser.id}` }, () => {
        fetchInteractions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(buyerChannel);
      supabase.removeChannel(sellerChannel);
    };
  }, [activeMainTab, isMounted, isLoggedIn, supabaseUser, isVendor]);

  const openBuyerReviewModal = (id: string, productId: string | null) => {
    setBuyerReviewModal({ show: true, interactionId: id, productId });
    setBuyerReviewData({ outcome: 'concreto', comment: '', rating: 5 });
  };

  const submitBuyerReview = async () => {
    if (!buyerReviewModal.interactionId || !buyerReviewData.outcome) return;
    setIsSubmittingReview(true);
    try {
      const review_type = buyerReviewData.outcome === 'concreto' ? 'compra_concretada' : 'compra_no_concretada';
      await supabase.from('reviews').insert({
        interaction_id: buyerReviewModal.interactionId,
        seller_rating: buyerReviewData.rating,
        product_rating: buyerReviewModal.productId ? buyerReviewData.rating : null,
        comment: buyerReviewData.comment || null,
        is_published: false,
        review_type: review_type
      });

      await supabase.from('interactions').update({ status: 'ready_to_review' }).eq('id', buyerReviewModal.interactionId);
      window.location.reload();
    } catch(e) {
      console.error(e);
      setIsSubmittingReview(false);
    }
  };

  const openSellerReviewModal = (id: string) => {
    setSellerReviewModal({ show: true, interactionId: id });
    setSellerReviewData({ rating: 5, comment: '' });
  };

  const submitSellerReview = async () => {
    if (!sellerReviewModal.interactionId) return;
    setIsSubmittingReview(true);
    try {
      const { data: existingReviews } = await supabase.from('reviews').select('id').eq('interaction_id', sellerReviewModal.interactionId);
      if (existingReviews && existingReviews.length > 0) {
        await supabase.from('reviews').update({
          buyer_rating: sellerReviewData.rating,
          buyer_comment: sellerReviewData.comment || null,
          is_published: true
        }).eq('id', existingReviews[0].id);
      }
      
      await supabase.from('interactions').update({ status: 'published' }).eq('id', sellerReviewModal.interactionId);
      window.location.reload();
    } catch(e) {
      console.error(e);
      setIsSubmittingReview(false);
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
        <div className="flex overflow-x-auto whitespace-nowrap w-full gap-2" style={{ 
          display: 'flex', gap: '8px', marginBottom: '24px', 
          background: themeColors.bgSubtle2, padding: '6px', borderRadius: '16px',
          overflowX: 'auto', whiteSpace: 'nowrap', width: '100%', scrollbarWidth: 'none'
        }}>
          <button
            onClick={() => setActiveMainTab('mis-resenas')}
            className="flex-shrink-0"
            style={{
              flex: '1 0 auto', padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
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
            className="flex-shrink-0"
            style={{
              flex: '1 0 auto', padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
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
              <div className="flex overflow-x-auto whitespace-nowrap w-full gap-5" style={{ display: 'flex', gap: '20px', borderBottom: `1px solid ${themeColors.borderSubtle3}`, marginBottom: '24px', overflowX: 'auto', whiteSpace: 'nowrap', width: '100%', scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setActiveSubTabMisResenas('pendientes')}
                  className="flex-shrink-0"
                  style={{
                    flexShrink: 0, padding: '0 0 12px', border: 'none', background: 'transparent', cursor: 'pointer',
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
                    flexShrink: 0, padding: '0 0 12px', border: 'none', background: 'transparent', cursor: 'pointer',
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
                    flexShrink: 0, padding: '0 0 12px', border: 'none', background: 'transparent', cursor: 'pointer',
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
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <Image src={getSafeImageUrl(item.profiles?.avatar_url, 'avatar')} alt="Avatar" width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover' }} />
    <div>
      <h4 style={{ margin: '0 0 4px', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>
        {item.profiles?.first_name ? `${item.profiles.first_name} ${item.profiles.last_name || ''}` : 'Usuario'}
      </h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {item.products?.image && (
          <Image src={getSafeImageUrl(item.products.image, 'product')} alt="Producto" width={20} height={20} style={{ borderRadius: '4px', objectFit: 'cover' }} />
        )}
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          {item.products ? `Compra: ${item.products.name}` : 'Interacción: General/Servicio'}
        </span>
      </div>
    </div>
  </div>
  
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button onClick={() => openSellerReviewModal(item.id)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Calificar y Revelar</button>
                                  <button onClick={() => handleRejectInteraction(item.id)} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${themeColors.borderSubtle3}`, background: 'transparent', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: 600 }}>Rechazar</button>
                                </div>
                              </div>
                              <p style={{ margin: '12px 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>El cliente ya dejó su valoración. ¡Calificalo para revelarla!</p>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                  
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <Image src={getSafeImageUrl(item.profiles?.avatar_url, 'avatar')} alt="Avatar" width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover' }} />
    <div>
      <h4 style={{ margin: '0 0 4px', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>
        {item.profiles?.first_name ? `${item.profiles.first_name} ${item.profiles.last_name || ''}` : 'Usuario'}
      </h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {item.products?.image && (
          <Image src={getSafeImageUrl(item.products.image, 'product')} alt="Producto" width={20} height={20} style={{ borderRadius: '4px', objectFit: 'cover' }} />
        )}
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          {item.products ? `Compra: ${item.products.name}` : 'Interacción: General/Servicio'}
        </span>
      </div>
    </div>
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
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <Image src={getSafeImageUrl(item.profiles?.avatar_url, 'avatar')} alt="Avatar" width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover' }} />
    <div>
      <h4 style={{ margin: '0 0 4px', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>
        {item.profiles?.first_name ? `${item.profiles.first_name} ${item.profiles.last_name || ''}` : 'Usuario'}
      </h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {item.products?.image && (
          <Image src={getSafeImageUrl(item.products.image, 'product')} alt="Producto" width={20} height={20} style={{ borderRadius: '4px', objectFit: 'cover' }} />
        )}
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          {item.products ? `Compra: ${item.products.name}` : 'Interacción: General/Servicio'}
        </span>
      </div>
    </div>
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
              <div className="flex overflow-x-auto whitespace-nowrap w-full gap-5" style={{ display: 'flex', gap: '20px', borderBottom: `1px solid ${themeColors.borderSubtle3}`, marginBottom: '24px', overflowX: 'auto', whiteSpace: 'nowrap', width: '100%', scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setActiveSubTabResenasDadas('pendientes')}
                  className="flex-shrink-0"
                  style={{
                    flexShrink: 0, padding: '0 0 12px', border: 'none', background: 'transparent', cursor: 'pointer',
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
                    flexShrink: 0, padding: '0 0 12px', border: 'none', background: 'transparent', cursor: 'pointer',
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
                    flexShrink: 0, padding: '0 0 12px', border: 'none', background: 'transparent', cursor: 'pointer',
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
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <img 
      src={getSafeImageUrl(item.profiles?.avatar_url, 'avatar')} 
      alt="Avatar" 
      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
      onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + (item.profiles?.store_name || item.profiles?.first_name || 'N'); }} 
    />
    <div>
      <h4 style={{ margin: '0 0 4px', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>
        {item.profiles?.store_name || (item.profiles?.first_name ? `${item.profiles.first_name} ${item.profiles.last_name || ''}` : 'Negocio')}
      </h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {item.products?.image && (
          <Image src={getSafeImageUrl(item.products.image, 'product')} alt="Producto" width={20} height={20} style={{ borderRadius: '4px', objectFit: 'cover' }} />
        )}
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          {item.products ? `Producto: ${item.products.name}` : 'Interacción: General/Servicio'}
        </span>
      </div>
    </div>
  </div>
  
                                <button onClick={() => openBuyerReviewModal(item.id, item.product_id)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Dejar reseña</button>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                  
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <img 
      src={getSafeImageUrl(item.profiles?.avatar_url, 'avatar')} 
      alt="Avatar" 
      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
      onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + (item.profiles?.store_name || item.profiles?.first_name || 'N'); }} 
    />
    <div>
      <h4 style={{ margin: '0 0 4px', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>
        {item.profiles?.store_name || (item.profiles?.first_name ? `${item.profiles.first_name} ${item.profiles.last_name || ''}` : 'Negocio')}
      </h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {item.products?.image && (
          <Image src={getSafeImageUrl(item.products.image, 'product')} alt="Producto" width={20} height={20} style={{ borderRadius: '4px', objectFit: 'cover' }} />
        )}
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          {item.products ? `Producto: ${item.products.name}` : 'Interacción: General/Servicio'}
        </span>
      </div>
    </div>
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
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <img 
      src={getSafeImageUrl(item.profiles?.avatar_url, 'avatar')} 
      alt="Avatar" 
      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
      onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + (item.profiles?.store_name || item.profiles?.first_name || 'N'); }} 
    />
    <div>
      <h4 style={{ margin: '0 0 4px', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>
        {item.profiles?.store_name || (item.profiles?.first_name ? `${item.profiles.first_name} ${item.profiles.last_name || ''}` : 'Negocio')}
      </h4>
      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        {item.status === 'appealed' ? 'Reseña en proceso de apelación' : 'Reseña rechazada por el vendedor'}
      </span>
    </div>
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

      {/* Modal de Reseña del Comprador */}
      {buyerReviewModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(5px)', padding: '20px'
        }}>
          <div style={{
            background: 'var(--color-bg-base)', borderRadius: '16px', width: '100%', maxWidth: '500px',
            padding: '30px', position: 'relative', border: `1px solid ${themeColors.borderSubtle2}`,
            boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
          }}>
            <button 
              onClick={() => setBuyerReviewModal({ show: false, interactionId: '', productId: null })}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
            >×</button>
            
            <h2 style={{ margin: '0 0 24px 0', color: 'var(--color-text-main)', fontSize: '1.4rem', textAlign: 'center' }}>¿Cómo te fue con el vendedor?</h2>
            
            {/* 3 Botones de Outcome */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              <button 
                onClick={() => setBuyerReviewData(p => ({ ...p, outcome: 'concreto' }))}
                style={{
                  padding: '12px', borderRadius: '12px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
                  border: buyerReviewData.outcome === 'concreto' ? '2px solid #10B981' : `1px solid ${themeColors.borderSubtle3}`,
                  background: buyerReviewData.outcome === 'concreto' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                  color: buyerReviewData.outcome === 'concreto' ? '#10B981' : 'var(--color-text-main)',
                  transition: 'all 0.2s ease'
                }}
              >
                ✓ Se concretó la compra
              </button>
              <button 
                onClick={() => setBuyerReviewData(p => ({ ...p, outcome: 'no_concreto' }))}
                style={{
                  padding: '12px', borderRadius: '12px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
                  border: buyerReviewData.outcome === 'no_concreto' ? '2px solid #EF4444' : `1px solid ${themeColors.borderSubtle3}`,
                  background: buyerReviewData.outcome === 'no_concreto' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                  color: buyerReviewData.outcome === 'no_concreto' ? '#EF4444' : 'var(--color-text-main)',
                  transition: 'all 0.2s ease'
                }}
              >
                ✗ No se concretó
              </button>
              <button 
                onClick={() => setBuyerReviewData(p => ({ ...p, outcome: 'no_comunique' }))}
                style={{
                  padding: '12px', borderRadius: '12px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
                  border: buyerReviewData.outcome === 'no_comunique' ? '2px solid #9CA3AF' : `1px solid ${themeColors.borderSubtle3}`,
                  background: buyerReviewData.outcome === 'no_comunique' ? 'rgba(156, 163, 175, 0.1)' : 'transparent',
                  color: buyerReviewData.outcome === 'no_comunique' ? '#9CA3AF' : 'var(--color-text-main)',
                  transition: 'all 0.2s ease'
                }}
              >
                − No me comuniqué
              </button>
            </div>

            {(buyerReviewData.outcome === 'concreto' || buyerReviewData.outcome === 'no_concreto') && (
              <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: 'var(--color-text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>Calificación (Opcional)</label>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        key={star}
                        onClick={() => setBuyerReviewData(p => ({ ...p, rating: star }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill={star <= buyerReviewData.rating ? "#FFD700" : "none"} stroke="#FFD700" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', color: 'var(--color-text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>Comentario (Opcional)</label>
                  <textarea 
                    value={buyerReviewData.comment}
                    onChange={e => setBuyerReviewData(p => ({ ...p, comment: e.target.value }))}
                    placeholder="¿Qué te pareció la experiencia?"
                    style={{
                      width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px',
                      background: 'rgba(0,0,0,0.2)', border: `1px solid ${themeColors.borderSubtle2}`,
                      color: 'var(--color-text-main)', resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            )}

            <button 
              onClick={submitBuyerReview}
              disabled={isSubmittingReview || !buyerReviewData.outcome}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '1rem',
                border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer',
                opacity: (isSubmittingReview || !buyerReviewData.outcome) ? 0.7 : 1
              }}
            >
              {isSubmittingReview ? 'Enviando...' : 'Enviar Reseña'}
            </button>
          </div>
        </div>
      )}

      {/* Modal de Reseña del Vendedor */}
      {sellerReviewModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(5px)', padding: '20px'
        }}>
          <div style={{
            background: 'var(--color-bg-base)', borderRadius: '16px', width: '100%', maxWidth: '500px',
            padding: '30px', position: 'relative', border: `1px solid ${themeColors.borderSubtle2}`,
            boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
          }}>
            <button 
              onClick={() => setSellerReviewModal({ show: false, interactionId: '' })}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
            >×</button>
            
            <h2 style={{ margin: '0 0 8px 0', color: 'var(--color-text-main)', fontSize: '1.4rem', textAlign: 'center' }}>¿Cómo te fue con el cliente?</h2>
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>Al enviar, se revelará la valoración que te dejó.</p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: 'var(--color-text-muted)', marginBottom: '8px', fontSize: '0.9rem', textAlign: 'center' }}>Calificación</label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star}
                    onClick={() => setSellerReviewData(p => ({ ...p, rating: star }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <svg width="36" height="36" viewBox="0 0 24 24" fill={star <= sellerReviewData.rating ? "#FFD700" : "none"} stroke="#FFD700" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: 'var(--color-text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>Comentario (Opcional)</label>
              <textarea 
                value={sellerReviewData.comment}
                onChange={e => setSellerReviewData(p => ({ ...p, comment: e.target.value }))}
                placeholder="Escribe algo sobre la experiencia con este comprador..."
                style={{
                  width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px',
                  background: 'rgba(0,0,0,0.2)', border: `1px solid ${themeColors.borderSubtle2}`,
                  color: 'var(--color-text-main)', resize: 'vertical'
                }}
              />
            </div>

            <button 
              onClick={submitSellerReview}
              disabled={isSubmittingReview}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '1rem',
                border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer',
                opacity: isSubmittingReview ? 0.7 : 1
              }}
            >
              {isSubmittingReview ? 'Enviando...' : 'Calificar y Revelar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
