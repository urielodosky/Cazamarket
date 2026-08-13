'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { formatTimeAgo } from '@/utils/formatTime';
import { getUserBusinessInfo } from '@/utils/userBusiness';
import { useThemeColors } from '@/hooks/useThemeColors';
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import './comunidad.css';

export interface ForumReply {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  subReplies?: ForumReply[];
}

export interface ForumPost {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  content: string;
  repliesCount: number;
  viewsCount: number;
  lastActive: string;
  createdAt: string;
  replies: ForumReply[];
}

const SkeletonThread = () => (
  <div className="glass-panel" style={{ padding: 'var(--spacing-4)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div style={{ flex: 1, animation: 'pulse 1.5s infinite ease-in-out' }}>
      <div style={{ height: '24px', width: '70%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '12px' }}></div>
      <div style={{ height: '14px', width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
    </div>
    <div style={{ display: 'flex', gap: '24px', textAlign: 'center', minWidth: '150px', animation: 'pulse 1.5s infinite ease-in-out' }}>
      <div style={{ height: '36px', width: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
      <div style={{ height: '36px', width: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
    </div>
  </div>
);

export default function ComunidadPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { username, avatar, isLoggedIn } = useAuth();
  const themeColors = useThemeColors();

  const urlCategory = searchParams.get('categoria') || '';
  const urlQuery = searchParams.get('q') || searchParams.get('busqueda') || searchParams.get('query') || '';

  const getAuthorAvatar = (authorName: string, postAvatar?: string) => {
    if (postAvatar) return postAvatar;
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
    const { data, error } = await supabase
      .from('forum_topics')
      .select('*, author:profiles!author_id(store_name, avatar_url, first_name, last_name, username), forum_replies(id)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map((t: any) => {
      let authorName = 'CazadorAnonimo';
      if (t.author) {
        authorName = t.author.store_name || t.author.username || `${t.author.first_name || ''} ${t.author.last_name || ''}`.trim() || 'Usuario';
      }
      return {
        id: t.id,
        title: t.title,
        author: authorName,
        authorAvatar: t.author?.avatar_url || null,
        category: t.category,
        subcategory: t.subcategory,
        content: t.content,
        repliesCount: t.forum_replies ? t.forum_replies.length : 0,
        viewsCount: t.views_count || 0,
        createdAt: t.created_at,
        lastActive: t.updated_at || t.created_at,
        replies: []
      };
    });
  };

  const { data: postsData, error: postsError, isLoading: isPostsLoading } = useSWR('forum_topics', fetcher);

  useEffect(() => {
    if (postsData) {
      setPosts(postsData);
    }
    setIsLoading(isPostsLoading);
  }, [postsData, isPostsLoading]);

  const filteredPosts = posts.filter(post => {
    // Filter by search query
    if (urlQuery) {
      const qLow = urlQuery.toLowerCase();
      const matchQuery = post.title.toLowerCase().includes(qLow) ||
                         post.content.toLowerCase().includes(qLow) ||
                         post.author.toLowerCase().includes(qLow);
      if (!matchQuery) return false;
    }

    // Filter by URL category / subcategory
    if (urlCategory) {
      const catLow = urlCategory.toLowerCase();
      const matchCat = post.category?.toLowerCase() === catLow ||
                       post.subcategory?.toLowerCase() === catLow;
      if (!matchCat) return false;
    }

    return true;
  });

  const removeQueryParam = (paramName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramName);
    const queryString = params.toString();
    router.push(queryString ? `/comunidad?${queryString}` : '/comunidad');
  };

  return (
    <div style={{ padding: '120px var(--spacing-4) var(--spacing-8) var(--spacing-4)', maxWidth: '1000px', margin: '0 auto', minHeight: '60vh', paddingBottom: 'var(--spacing-12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 6px 0', color: 'var(--color-text-main)' }}>Foro de Comunidad</h1>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Espacio de debate, consejos y novedades entre amantes de la caza, pesca y outdoor.</p>
        </div>
        {isLoggedIn && (
          <Link href="/comunidad/nuevo" style={{ textDecoration: 'none' }}>
          <button className="btn btn-primary" style={{ 
            padding: '12px 24px', 
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            background: 'var(--color-primary)',
            color: '#fff',
            boxShadow: '0 4px 15px rgba(255, 115, 0, 0.4)',
            transition: 'all 0.3s ease',
            border: 'none',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Crear Nuevo Tema
          </button>
        </Link>
        )}
      </div>

      {/* Active Filter Badges */}
      {(urlCategory || urlQuery) && (
        <div style={{ display: 'flex', marginBottom: '20px', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {urlQuery && (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', background: 'rgba(255,115,0,0.15)', padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255,115,0,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Búsqueda: <strong>"{urlQuery}"</strong>
              <button onClick={() => removeQueryParam('q')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '1rem' }}>✕</button>
            </span>
          )}
          {urlCategory && (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', background: 'rgba(255,115,0,0.15)', padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255,115,0,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Categoría: <strong>{urlCategory}</strong>
              <button onClick={() => removeQueryParam('categoria')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '1rem' }}>✕</button>
            </span>
          )}
        </div>
      )}

      {/* Threads List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
        {isLoading ? (
          <>
            <SkeletonThread />
            <SkeletonThread />
          </>
        ) : filteredPosts.length === 0 ? (
          <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', margin: '0 0 16px 0' }}>
              {urlQuery || urlCategory ? 'No se encontraron temas con los filtros aplicados.' : 'No hay temas publicados en la comunidad aún. ¡Sé el primero en crear uno!'}
            </p>
            <Link href="/comunidad/nuevo" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '10px 20px',
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}>
                Crear Tema
              </button>
            </Link>
          </div>
        ) : (
          filteredPosts.map(post => {
            const authorImg = getAuthorAvatar(post.author, post.authorAvatar);
            const bizInfo = getUserBusinessInfo(post.author);

            return (
              <div 
                key={post.id} 
                onClick={() => router.push(`/comunidad/tema/${post.id}`)} 
                className="glass-panel forum-post-card" 
                style={{ 
                  padding: '20px 24px', 
                  borderRadius: 'var(--radius-lg)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  transition: 'transform 0.2s', 
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                {/* Left Side: Author Info & Title */}
                <div style={{ flex: 1, paddingRight: '20px' }}>
                  
                  {/* 1. FILA SUPERIOR: Foto + Autor + Insignia + Última Actividad + Categoría / Subcategoría AL LADO */}
                  <div className="forum-post-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {authorImg ? (
                      <img src={authorImg} alt={post.author} style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#fff' }}>
                        {post.author.charAt(0).toUpperCase()}
                      </span>
                    )}

                    <span>Por</span>

                    {/* Link al negocio si es vendedor */}
                    {bizInfo.isBusiness && bizInfo.storeUrl ? (
                      <Link 
                        href={bizInfo.storeUrl}
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: themeColors.textWhite, fontWeight: 700, textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                      >
                        {post.author}
                      </Link>
                    ) : (
                      <strong style={{ color: themeColors.textWhite, fontWeight: 700 }}>{post.author}</strong>
                    )}

                    {/* Insignia: Negocio o Comprador */}
                    {bizInfo.isBusiness ? (
                      <span style={{ background: 'rgba(255, 115, 0, 0.18)', color: 'var(--color-primary)', border: '1px solid rgba(255, 115, 0, 0.35)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 600 }}>
                        Negocio
                      </span>
                    ) : (
                      <span style={{ background: themeColors.bgSubtle3, color: themeColors.textMuted90, border: `1px solid ${themeColors.borderSubtle2}`, padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 500 }}>
                        Comprador
                      </span>
                    )}

                    <span>• Última actividad: {formatTimeAgo(post.lastActive || post.createdAt || post.id)}</span>

                    {/* Categoría y Subcategoría AL LADO de la información del usuario */}
                    {(post.category || post.subcategory) && (
                      <div className="forum-post-tags" style={{ display: 'inline-flex', gap: '6px', marginLeft: '6px', alignItems: 'center' }}>
                        {post.category && (
                          <span className="forum-post-tag category-tag" style={{ background: 'rgba(255, 115, 0, 0.15)', color: 'var(--color-primary)', border: '1px solid rgba(255, 115, 0, 0.3)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 600 }}>
                            {post.category}
                          </span>
                        )}
                        {post.subcategory && (
                          <span className="forum-post-tag subcategory-tag" style={{ background: themeColors.bgSubtle3, color: themeColors.textMuted90, border: `1px solid ${themeColors.borderSubtle2}`, padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 500 }}>
                            {post.subcategory}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. SEGUNDA FILA: Título del Tema justo debajo */}
                  <h3 style={{ fontSize: '1.25rem', color: themeColors.textWhite, margin: 0, fontWeight: 700, lineHeight: 1.3 }}>
                    {post.title}
                  </h3>

                </div>

                {/* Right Side: Stats */}
                <div className="forum-post-stats" style={{ display: 'flex', gap: '20px', textAlign: 'center', minWidth: '130px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.15rem', fontWeight: 'bold', color: themeColors.textWhite }}>{post.repliesCount ?? post.replies?.length ?? 0}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Respuestas</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '1.15rem', fontWeight: 'bold', color: themeColors.textWhite }}>{post.viewsCount ?? 0}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Visitas</span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
