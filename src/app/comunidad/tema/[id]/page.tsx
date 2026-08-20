'use client';
import React, { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { ForumPost, ForumReply } from '../../page';
import { formatTimeAgo } from '@/utils/formatTime';
import { getUserBusinessInfo } from '@/utils/userBusiness';
import { useThemeColors } from '@/hooks/useThemeColors';
import useSWR, { mutate } from 'swr';
import { createClient } from '@/lib/supabase/client';
import ReportModal, { ReportType } from '@/components/ReportModal';
import '../../comunidad.css';

const INITIAL_POSTS: ForumPost[] = [];

export default function TemaPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();

  const [post, setPost] = useState<ForumPost | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySearchFilter, setReplySearchFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [reportedIds, setReportedIds] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [reportModalData, setReportModalData] = useState<{ isOpen: boolean, type: ReportType, id: string }>({ isOpen: false, type: 'community_post', id: '' });

  // Modal de confirmación propio en React (para no usar window.confirm nativo)
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Nested inline reply state
  const [activeInlineReplyId, setActiveInlineReplyId] = useState<string | null>(null);
  const [inlineReplyText, setInlineReplyText] = useState('');

  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const inlineInputRef = useRef<HTMLTextAreaElement>(null);
  const { username, avatar, isVendor, supabaseUser, isLoggedIn } = useAuth();
  const themeColors = useThemeColors();

  const showToast = (text: string, type: 'success' | 'info' = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const isAuthor = (authorName: string) => {
    if (!authorName) return false;
    if (username && authorName.toLowerCase() === username.toLowerCase()) return true;
    if (typeof window !== 'undefined') {
      const profileSaved = localStorage.getItem('cazamarket_profile');
      if (profileSaved) {
        try {
          const parsed = JSON.parse(profileSaved);
          if (parsed.storeName && parsed.storeName.toLowerCase() === authorName.toLowerCase()) return true;
          if (parsed.username && parsed.username.toLowerCase() === authorName.toLowerCase()) return true;
        } catch (e) {}
      }
    }
    if (authorName === username || authorName === 'CazadorAnonimo') return true;
    return false;
  };

  const getAuthorAvatar = (authorName: string, itemAvatar?: string) => {
    if (itemAvatar) return itemAvatar;
    if (username && (authorName === username || authorName === 'CazadorAnonimo') && avatar) {
      return avatar;
    }
    if (typeof window !== 'undefined') {
      const profileSaved = localStorage.getItem('cazamarket_profile');
      if (profileSaved) {
        try {
          const parsed = JSON.parse(profileSaved);
          if ((parsed.storeName === authorName || parsed.username === authorName || authorName === username) && (parsed.avatar || parsed.storeLogo)) {
            return parsed.avatar || parsed.storeLogo;
          }
        } catch (e) {}
      }
    }
    return null;
  };

  const fetcher = async () => {
    const supabase = createClient();
    const { data: topic, error: topicError } = await supabase
      .from('forum_topics')
      .select('*, author:profiles(store_name, avatar_url, first_name, last_name, full_name)')
      .eq('id', id)
      .single();
    
    if (topicError || !topic) throw topicError;
    
    const { data: repliesData, error: repliesError } = await supabase
      .from('forum_replies')
      .select('*, author:profiles(store_name, avatar_url, first_name, last_name, full_name)')
      .eq('topic_id', id)
      .order('created_at', { ascending: true });
      
    const builtReplies: ForumReply[] = [];
    const replyMap = new Map();
    
    if (repliesData) {
      repliesData.forEach((r: any) => {
        let authorName = 'Usuario';
        if (r.author) {
          authorName = r.author.store_name || r.author.full_name || `${r.author.first_name || ''} ${r.author.last_name || ''}`.trim() || 'Usuario';
        }
        const formattedReply: ForumReply = {
          id: r.id,
          author: authorName,
          authorAvatar: r.author?.avatar_url || null,
          content: r.content,
          createdAt: r.created_at,
          subReplies: []
        };
        replyMap.set(r.id, formattedReply);
        
        if (r.parent_reply_id) {
          const parent = replyMap.get(r.parent_reply_id);
          if (parent) {
            parent.subReplies.push(formattedReply);
          }
        } else {
          builtReplies.push(formattedReply);
        }
      });
    }

    let authorName = 'Usuario';
    if (topic.author) {
      authorName = topic.author.store_name || topic.author.full_name || `${topic.author.first_name || ''} ${topic.author.last_name || ''}`.trim() || 'Usuario';
    }

    const viewKey = `cazamarket_viewed_post_${id}`;
    if (!sessionStorage.getItem(viewKey)) {
      sessionStorage.setItem(viewKey, 'true');
      supabase.rpc('increment_forum_view', { topic_id: id }).then();
    }

    return {
      id: topic.id,
      title: topic.title,
      author: authorName,
      authorAvatar: topic.author?.avatar_url || null,
      category: topic.category,
      subcategory: topic.subcategory,
      content: topic.content,
      repliesCount: repliesData ? repliesData.length : 0,
      viewsCount: (topic.views_count || 0) + (sessionStorage.getItem(viewKey) ? 0 : 1),
      createdAt: topic.created_at,
      lastActive: topic.updated_at || topic.created_at,
      replies: builtReplies
    };
  };

  const { data: postData, error, isLoading: isPostLoading } = useSWR(`topic_${id}`, fetcher);

  useEffect(() => {
    if (postData) {
      setPost(postData);
    }
    setIsLoading(isPostLoading);
  }, [postData, isPostLoading]);

  const countTotalReplies = (replies?: ForumReply[]): number => {
    if (!replies) return 0;
    let count = replies.length;
    replies.forEach(r => {
      if (r.subReplies) {
        count += countTotalReplies(r.subReplies);
      }
    });
    return count;
  };

  const saveUpdatedPost = (newPostData: ForumPost) => {
    setPost(newPostData);
    const saved = localStorage.getItem('cazamarket_forum_posts');
    if (saved) {
      try {
        const postsList: ForumPost[] = JSON.parse(saved);
        const updatedList = postsList.map(p => p.id === id ? newPostData : p);
        localStorage.setItem('cazamarket_forum_posts', JSON.stringify(updatedList));
      } catch (e) {}
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText || replyText.trim().length < 2 || !post) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast('Debes iniciar sesión para responder', 'info');
      return;
    }

    const { error } = await supabase.from('forum_replies').insert({
      topic_id: id,
      content: replyText.trim(),
      author_id: user.id
    });

    if (error) {
      console.error(error);
      showToast('Error al publicar respuesta', 'info');
      return;
    }

    setReplyText('');
    mutate(`topic_${id}`);
    showToast('¡Respuesta publicada con éxito!', 'success');
  };

  const handleSendSubReply = async (parentReplyId: string) => {
    if (!inlineReplyText || inlineReplyText.trim().length < 2 || !post) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast('Debes iniciar sesión para responder', 'info');
      return;
    }

    const { error } = await supabase.from('forum_replies').insert({
      topic_id: id,
      parent_reply_id: parentReplyId,
      content: inlineReplyText.trim(),
      author_id: user.id
    });

    if (error) {
      console.error(error);
      showToast('Error al publicar respuesta', 'info');
      return;
    }

    setActiveInlineReplyId(null);
    setInlineReplyText('');
    mutate(`topic_${id}`);
    showToast('¡Respuesta enviada!', 'success');
  };

  const handleOpenInlineReply = (parentReplyId: string, mentionAuthor?: string) => {
    if (activeInlineReplyId === parentReplyId && !mentionAuthor) {
      setActiveInlineReplyId(null);
      return;
    }
    setActiveInlineReplyId(parentReplyId);
    if (mentionAuthor) {
      const mentionTag = `@${mentionAuthor} `;
      setInlineReplyText(prev => prev.includes(mentionTag) ? prev : `${mentionTag}${prev}`);
    } else {
      setInlineReplyText('');
    }
    setTimeout(() => inlineInputRef.current?.focus(), 100);
  };

  const handleReport = (itemType: 'tema' | 'respuesta', targetId: string) => {
    setReportModalData({ isOpen: true, type: 'community_post', id: targetId });
  };

  const handleDeletePost = () => {
    setConfirmModal({
      title: 'Eliminar Tema',
      message: '¿Estás seguro de que deseas eliminar este tema? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        const supabase = createClient();
        const { error } = await supabase.from('forum_topics').delete().eq('id', id);
        
        if (error) {
          console.error(error);
          showToast('Error al eliminar el tema.', 'info');
          return;
        }

        showToast('Tema eliminado correctamente.', 'info');
        setTimeout(() => {
          router.push('/comunidad');
        }, 400);
      }
    });
  };

  const handleDeleteReply = (parentReplyId: string, subReplyId?: string) => {
    if (!post) return;
    setConfirmModal({
      title: 'Eliminar Respuesta',
      message: '¿Estás seguro de que deseas eliminar esta respuesta?',
      onConfirm: async () => {
        const supabase = createClient();
        const targetId = subReplyId || parentReplyId;
        const { error } = await supabase.from('forum_replies').delete().eq('id', targetId);

        if (error) {
          console.error(error);
          showToast('Error al eliminar respuesta.', 'info');
          return;
        }

        mutate(`topic_${id}`);
        showToast('Respuesta eliminada.', 'info');
      }
    });
  };

  if (isLoading) {
    return <LoadingScreen message="Cargando tema..." />;
  }

  if (!post) {
    return (
      <div className="container-page" style={{ paddingTop: '140px', paddingBottom: '100px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--color-text-main)', marginBottom: '16px' }}>Tema no encontrado</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>El tema que estás buscando no existe o fue eliminado.</p>
        <Link href="/comunidad" style={{ padding: '12px 24px', background: 'var(--color-primary)', color: '#fff', textDecoration: 'none', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>Volver a la comunidad</Link>
      </div>
    );
  }

  const postAuthorAvatar = getAuthorAvatar(post.author, post.authorAvatar);
  let postAuthorBiz = getUserBusinessInfo(post.author);
  const isOwnerOfPost = isAuthor(post.author);
  
  if (isOwnerOfPost && isVendor) {
    postAuthorBiz = {
      isBusiness: true,
      storeUrl: `/negocios/${supabaseUser?.id || '1'}`,
      badgeLabel: 'Negocio'
    };
  }
  const totalRepliesCount = countTotalReplies(post.replies);

  const filteredReplies = (post.replies || []).filter(reply => {
    if (!replySearchFilter.trim()) return true;
    const query = replySearchFilter.toLowerCase().trim();

    const parentMatch = reply.author.toLowerCase().includes(query) || reply.content.toLowerCase().includes(query);
    const subMatch = reply.subReplies?.some(sub => sub.author.toLowerCase().includes(query) || sub.content.toLowerCase().includes(query));

    return parentMatch || subMatch;
  });

  return (
    <div className="tema-page-container" style={{ maxWidth: '920px', margin: '0 auto', minHeight: '80vh' }}>
      
      {/* Modal de Confirmación Estilizado dentro de la Página */}
      {confirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '420px',
            width: '100%',
            padding: '28px 32px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 115, 0, 0.35)',
            background: 'rgba(22, 25, 20, 0.95)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(255, 115, 0, 0.12)',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.25rem', color: '#ffffff', margin: '0 0 12px 0', fontWeight: 700 }}>
              {confirmModal.title}
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmModal(null)}
                style={{
                  padding: '10px 22px',
                  borderRadius: '9999px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  background: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Notification Banner */}
      {toast && (
        <div style={{
          marginBottom: '20px',
          padding: '12px 20px',
          borderRadius: '12px',
          background: toast.type === 'success' ? 'rgba(255, 115, 0, 0.15)' : themeColors.bgSubtle3,
          border: `1px solid ${toast.type === 'success' ? 'rgba(255, 115, 0, 0.35)' : themeColors.borderSubtle3}`,
          color: themeColors.textWhite,
          fontSize: '0.92rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: themeColors.textMuted60, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      {/* Botón de volver */}
      <div style={{ marginBottom: '24px' }}>
        <Link href="/comunidad" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, transition: 'transform 0.2s' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Volver a Comunidad
        </Link>
      </div>

      {/* Main Post Section */}
      <div className="glass-panel tema-post-card" style={{ 
        padding: '36px 40px', 
        borderRadius: 'var(--radius-xl)', 
        marginBottom: '36px',
        border: `1px solid ${themeColors.borderSubtle2}`,
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        background: themeColors.surfaceElevated
      }}>
        
        {/* 1. Datos del Autor (Arriba) */}
        <div className="tema-post-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', paddingBottom: '18px', borderBottom: `1px solid ${themeColors.borderSubtle2}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, var(--color-primary), #ff9900)', padding: '2px', boxShadow: '0 4px 14px rgba(255,115,0,0.35)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {postAuthorAvatar ? (
                <Image 
                  src={postAuthorAvatar} 
                  alt={post.author} 
                  fill 
                  style={{ borderRadius: '50%', objectFit: 'cover' }} 
                />
              ) : (
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '1.2rem' }}>
                  {post.author.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {postAuthorBiz.isBusiness && postAuthorBiz.storeUrl ? (
                  <Link href={postAuthorBiz.storeUrl} style={{ color: themeColors.textWhite, fontSize: '1.08rem', fontWeight: 700, textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                    {post.author}
                  </Link>
                ) : (
                  <strong style={{ color: themeColors.textWhite, fontSize: '1.08rem', fontWeight: 700 }}>{post.author}</strong>
                )}

                {/* Insignia: Negocio o Comprador */}
                {postAuthorBiz.isBusiness ? (
                  <span style={{ background: 'rgba(255, 115, 0, 0.18)', color: 'var(--color-primary)', border: '1px solid rgba(255, 115, 0, 0.35)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 600 }}>
                    Negocio
                  </span>
                ) : (
                  <span style={{ background: themeColors.bgSubtle3, color: themeColors.textMuted90, border: `1px solid ${themeColors.borderSubtle2}`, padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 500 }}>
                    Comprador
                  </span>
                )}
                
                <span style={{ background: 'rgba(255,115,0,0.15)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Autor</span>
              </div>
              <span style={{ fontSize: '0.82rem', color: themeColors.textMuted60 }}>Publicado {formatTimeAgo(post.createdAt || post.id)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOwnerOfPost ? (
              <button 
                onClick={handleDeletePost}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: 'rgba(239, 68, 68, 0.15)', 
                  color: '#ef4444', 
                  border: '1px solid rgba(239, 68, 68, 0.3)', 
                  padding: '6px 14px', 
                  borderRadius: '8px', 
                  fontSize: '0.8rem', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                title="Eliminar este tema"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                <span>Eliminar Tema</span>
              </button>
            ) : (
              <button 
                onClick={() => handleReport('tema', post.id)}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  color: 'rgba(255, 255, 255, 0.5)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  padding: '6px 12px', 
                  borderRadius: '8px', 
                  fontSize: '0.8rem', 
                  fontWeight: 500, 
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                <span>Denunciar</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Título (Debajo de quien lo publicó) */}
        <h1 className="tema-post-title" style={{ fontSize: '1.85rem', color: 'var(--color-text-main)', margin: '0 0 16px 0', lineHeight: 1.3, fontWeight: 700, letterSpacing: '-0.3px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
          {post.title}
        </h1>

        {/* 3. Badges de Categoría y Subcategoría */}
        {(post.category || (post.tags && post.tags.length > 0)) && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', flexWrap: 'wrap' }}>
            {post.category && (
              <span style={{ background: 'rgba(255, 115, 0, 0.18)', color: 'var(--color-primary)', border: '1px solid rgba(255, 115, 0, 0.35)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>
                {post.category}
              </span>
            )}
            {post.subcategory && (
              <span style={{ background: themeColors.isLight ? 'transparent' : themeColors.bgSubtle3, color: themeColors.textMuted90, border: `1px solid ${themeColors.borderSubtle2}`, padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 500 }}>
                {post.subcategory}
              </span>
            )}
            {post.tags && post.tags.map(t => (
              <span key={t} style={{ background: 'rgba(255, 115, 0, 0.18)', color: 'var(--color-primary)', border: '1px solid rgba(255, 115, 0, 0.2)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* 4. Contenido del Mensaje */}
        <div style={{ color: themeColors.textMuted90, fontSize: '1.05rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: '24px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
          {post.content}
        </div>

        {/* 5. Cuadro de Respuesta Integrado */}
        {isLoggedIn && (
        <div style={{ paddingTop: '20px', borderTop: `1px solid ${themeColors.borderSubtle2}` }}>
          <form onSubmit={handleSendReply}>
            <textarea
              ref={replyInputRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Aporta tus sugerencias o dudas..."
              rows={3}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '12px',
                background: themeColors.isLight ? 'transparent' : themeColors.bgSubtle2,
                border: `1px solid ${themeColors.borderSubtle3}`,
                color: themeColors.textWhite,
                fontSize: '0.98rem',
                outline: 'none',
                marginBottom: '14px',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.5
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={!replyText.trim()}
                style={{
                  padding: '10px 26px',
                  borderRadius: '9999px',
                  background: replyText.trim() ? 'var(--color-primary)' : themeColors.bgSubtle3,
                  color: replyText.trim() ? '#ffffff' : themeColors.textMuted60,
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: replyText.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: replyText.trim() ? '0 4px 15px rgba(255, 115, 0, 0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Responder
              </button>
            </div>
          </form>
        </div>
        )}
      </div>

      {/* REPLIES SECTION */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <h3 style={{ fontSize: '1.35rem', color: themeColors.textWhite, margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Respuestas</span>
            <span style={{ background: 'rgba(255, 115, 0, 0.15)', color: 'var(--color-primary)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.85rem' }}>
              {totalRepliesCount}
            </span>
          </h3>

          {/* Buscador en respuestas / perfil */}
          <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '400px' }}>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="rgba(255,255,255,0.4)" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text"
              value={replySearchFilter}
              onChange={(e) => setReplySearchFilter(e.target.value)}
              placeholder="Buscar en respuestas o por usuario..."
              style={{
                width: '100%',
                padding: '9px 36px 9px 38px',
                borderRadius: '9999px',
                background: themeColors.bgSubtle4,
                border: replySearchFilter ? '1px solid var(--color-primary)' : `1px solid ${themeColors.borderSubtle2}`,
                color: themeColors.textWhite,
                fontSize: '0.88rem',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
            />
            {replySearchFilter && (
              <button
                onClick={() => setReplySearchFilter('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Indicador de filtro activo */}
        {replySearchFilter && (
          <div style={{ marginBottom: '16px', fontSize: '0.85rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Filtrado por: <strong>"{replySearchFilter}"</strong> ({filteredReplies.length} resultados)</span>
            <button 
              onClick={() => setReplySearchFilter('')}
              style={{ background: 'rgba(255,115,0,0.15)', border: '1px solid rgba(255,115,0,0.3)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Borrar filtro
            </button>
          </div>
        )}

        {/* Lista de Respuestas */}
        {filteredReplies.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredReplies.map(reply => {
              const replyAvatar = getAuthorAvatar(reply.author, reply.authorAvatar);
              let replyBiz = getUserBusinessInfo(reply.author);
              const isOwnerOfReply = isAuthor(reply.author);
              
              if (isOwnerOfReply && isVendor) {
                replyBiz = {
                  isBusiness: true,
                  storeUrl: `/negocios/${supabaseUser?.id || '1'}`,
                  badgeLabel: 'Negocio'
                };
              }
              const isReplyingToThis = activeInlineReplyId === reply.id;

              return (
                <div key={reply.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Parent Reply Card */}
                  <div 
                    className="glass-panel" 
                    style={{ 
                      padding: '20px 24px', 
                      borderRadius: '16px',
                      border: `1px solid ${themeColors.borderSubtle3}`,
                      background: themeColors.surfaceElevated,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Reply Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, var(--color-primary), #ff9900)', padding: '1.5px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.4)' }}>
                          {replyAvatar ? (
                            <Image 
                              src={replyAvatar} 
                              alt={reply.author} 
                              fill 
                              style={{ borderRadius: '50%', objectFit: 'cover' }} 
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-primary)', fontSize: '1rem' }}>
                              {reply.author.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {replyBiz.isBusiness && replyBiz.storeUrl ? (
                              <Link href={replyBiz.storeUrl} style={{ color: themeColors.textWhite, fontSize: '0.98rem', fontWeight: 600, textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                                {reply.author}
                              </Link>
                            ) : (
                              <strong style={{ color: themeColors.textWhite, fontSize: '0.98rem', fontWeight: 600 }}>{reply.author}</strong>
                            )}

                            {replyBiz.isBusiness ? (
                              <span style={{ background: 'rgba(255, 115, 0, 0.18)', color: 'var(--color-primary)', border: '1px solid rgba(255, 115, 0, 0.35)', padding: '1px 6px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 600 }}>
                                Negocio
                              </span>
                            ) : (
                              <span style={{ background: themeColors.bgSubtle3, color: themeColors.textMuted90, border: `1px solid ${themeColors.borderSubtle2}`, padding: '1px 6px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 500 }}>
                                Comprador
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.78rem', color: themeColors.textMuted60 }}>{formatTimeAgo(reply.createdAt || reply.id)}</span>
                        </div>
                      </div>

                      {/* Action Buttons: Responder & (Eliminar o Denunciar) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isLoggedIn && (
                        <button 
                          onClick={() => handleOpenInlineReply(reply.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: isReplyingToThis ? 'rgba(255, 115, 0, 0.25)' : 'rgba(255, 115, 0, 0.15)',
                            color: 'var(--color-primary)',
                            border: '1px solid rgba(255, 115, 0, 0.4)',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 115, 0, 0.35)'}
                          onMouseLeave={e => e.currentTarget.style.background = isReplyingToThis ? 'rgba(255, 115, 0, 0.25)' : 'rgba(255, 115, 0, 0.15)'}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
                          <span>{isReplyingToThis ? 'Cancelar' : 'Responder'}</span>
                        </button>
                        )}

                        {isOwnerOfReply ? (
                          <button
                            onClick={() => handleDeleteReply(reply.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                            title="Eliminar tu respuesta"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            <span>Eliminar</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReport('respuesta', reply.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'rgba(255, 255, 255, 0.5)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
                            title="Denunciar respuesta inapropiada"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                            <span>Denunciar</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reply Content */}
                    <p style={{ margin: 0, color: themeColors.textMuted90, fontSize: '0.98rem', lineHeight: 1.6, paddingLeft: '52px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {reply.content}
                    </p>
                  </div>

                  {/* Inline Reply Form */}
                  {isReplyingToThis && (
                    <div 
                      className="glass-panel" 
                      style={{ 
                        marginLeft: '36px', 
                        padding: '16px 20px', 
                        borderRadius: '14px', 
                        borderLeft: '3px solid var(--color-primary)',
                        background: themeColors.surfaceElevated,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                        animation: 'fadeInUp 0.2s ease'
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                        Respondiendo en este hilo de conversación
                      </span>
                      <textarea
                        ref={inlineInputRef}
                        value={inlineReplyText}
                        onChange={(e) => setInlineReplyText(e.target.value)}
                        placeholder={`Escribe tu respuesta a ${reply.author}...`}
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: themeColors.isLight ? 'transparent' : themeColors.bgSubtle2,
                          border: `1px solid ${themeColors.borderSubtle3}`,
                          color: themeColors.textWhite,
                          fontSize: '0.92rem',
                          outline: 'none',
                          marginBottom: '10px',
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setActiveInlineReplyId(null)}
                          style={{
                            padding: '6px 16px',
                            borderRadius: '8px',
                            background: 'transparent',
                            color: themeColors.textMuted60,
                            border: `1px solid ${themeColors.borderSubtle3}`,
                            fontSize: '0.82rem',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendSubReply(reply.id)}
                          disabled={!inlineReplyText.trim()}
                          style={{
                            padding: '6px 20px',
                            borderRadius: '8px',
                            background: inlineReplyText.trim() ? 'var(--color-primary)' : themeColors.bgSubtle3,
                            color: inlineReplyText.trim() ? '#ffffff' : themeColors.textMuted60,
                            border: 'none',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: inlineReplyText.trim() ? 'pointer' : 'not-allowed'
                          }}
                        >
                          Publicar Respuesta
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sub-Replies */}
                  {reply.subReplies && reply.subReplies.length > 0 && (
                    <div style={{ marginLeft: '36px', borderLeft: '2px solid rgba(255, 115, 0, 0.35)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {reply.subReplies.map(sub => {
                        const subAvatar = getAuthorAvatar(sub.author, sub.authorAvatar);
                        let subBiz = getUserBusinessInfo(sub.author);
                        const isOwnerOfSub = isAuthor(sub.author);
                        
                        if (isOwnerOfSub && isVendor) {
                          subBiz = {
                            isBusiness: true,
                            storeUrl: `/negocios/${supabaseUser?.id || '1'}`,
                            badgeLabel: 'Negocio'
                          };
                        }

                        return (
                          <div 
                            key={sub.id} 
                            className="glass-panel" 
                            style={{ 
                              padding: '14px 18px', 
                              borderRadius: '12px',
                              background: themeColors.surfaceElevated,
                              border: `1px solid ${themeColors.borderSubtle3}`
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, var(--color-primary), #ff9900)', padding: '1px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {subAvatar ? (
                                    <Image src={subAvatar} alt={sub.author} fill style={{ borderRadius: '50%', objectFit: 'cover' }} />
                                  ) : (
                                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.85rem' }}>
                                      {sub.author.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {subBiz.isBusiness && subBiz.storeUrl ? (
                                      <Link href={subBiz.storeUrl} style={{ color: themeColors.textWhite, fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                                        {sub.author}
                                      </Link>
                                    ) : (
                                      <strong style={{ color: themeColors.textWhite, fontSize: '0.9rem', fontWeight: 600 }}>{sub.author}</strong>
                                    )}

                                    {subBiz.isBusiness ? (
                                      <span style={{ background: 'rgba(255, 115, 0, 0.18)', color: 'var(--color-primary)', border: '1px solid rgba(255, 115, 0, 0.35)', padding: '1px 5px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 600 }}>
                                        Negocio
                                      </span>
                                    ) : (
                                      <span style={{ background: themeColors.bgSubtle3, color: themeColors.textMuted90, border: `1px solid ${themeColors.borderSubtle2}`, padding: '1px 5px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 500 }}>
                                        Comprador
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '0.75rem', color: themeColors.textMuted60 }}>{formatTimeAgo(sub.createdAt || sub.id)}</span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {/* Botón Responder en Sub-Respuesta */}
                                {isLoggedIn && (
                                <button
                                  onClick={() => handleOpenInlineReply(reply.id, sub.author)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: 'rgba(255, 115, 0, 0.12)',
                                    color: 'var(--color-primary)',
                                    border: '1px solid rgba(255, 115, 0, 0.3)',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                  title={`Responder a ${sub.author}`}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
                                  <span>Responder</span>
                                </button>
                                )}

                                {isOwnerOfSub ? (
                                  <button
                                    onClick={() => handleDeleteReply(reply.id, sub.id)}
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.15)',
                                      color: '#ef4444',
                                      border: '1px solid rgba(239, 68, 68, 0.3)',
                                      padding: '4px 10px',
                                      borderRadius: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                    title="Eliminar tu respuesta"
                                  >
                                    Eliminar
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleReport('respuesta', sub.id)}
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.5)',
                                      color: 'rgba(255, 255, 255, 0.5)',
                                      border: '1px solid rgba(255, 255, 255, 0.1)',
                                      padding: '4px 10px',
                                      borderRadius: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: 500,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Denunciar
                                  </button>
                                )}
                              </div>
                            </div>
                            <p style={{ margin: 0, color: themeColors.textMuted90, fontSize: '0.92rem', lineHeight: 1.5, paddingLeft: '42px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                              {sub.content}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '32px 24px', textAlign: 'center', borderRadius: '16px', color: themeColors.textMuted60 }}>
            {replySearchFilter ? 'No se encontraron respuestas para tu búsqueda.' : 'Sé el primero en responder a este tema.'}
          </div>
        )}
      </div>
      <ReportModal 
        isOpen={reportModalData.isOpen}
        onClose={() => setReportModalData({ ...reportModalData, isOpen: false })}
        reportedType={reportModalData.type}
        reportedId={reportModalData.id}
      />
    </div>
  );
}
