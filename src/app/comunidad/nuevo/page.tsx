'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ForumPost } from '../page';
import CustomSelect from '@/components/ui/CustomSelect';
import { CATEGORIES_DATA } from '@/constants/categoriesData';

export default function CrearTemaPage() {
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  const [contenido, setContenido] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { username, avatar } = useAuth();

  // Opciones de categoría principal
  const categoryOptions = [
    { value: '', label: 'Seleccionar Categoría (Opcional)' },
    ...CATEGORIES_DATA.map(c => ({ value: c.name, label: c.name }))
  ];

  // Opciones de subcategoría dependiendo de la categoría seleccionada
  const activeCategoryObj = CATEGORIES_DATA.find(c => c.name === categoria);
  const subcategoryOptions = activeCategoryObj
    ? [
        { value: '', label: 'Seleccionar Subcategoría (Opcional)' },
        ...activeCategoryObj.subcategories.map(s => ({ value: s, label: s }))
      ]
    : [{ value: '', label: 'Seleccionar Subcategoría (Selecciona categoría primero)' }];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || titulo.trim().length < 5) {
      setErrorMsg('El título debe tener al menos 5 caracteres.');
      return;
    }
    if (!contenido || contenido.trim().length < 10) {
      setErrorMsg('El contenido del mensaje debe tener al menos 10 caracteres.');
      return;
    }

    let currentPosts: ForumPost[] = [];
    const saved = localStorage.getItem('cazamarket_forum_posts');
    if (saved) {
      try {
        currentPosts = JSON.parse(saved);
      } catch (e) {
        currentPosts = [];
      }
    }

    let authorName = username || 'CazadorAnonimo';
    let userAvatar = avatar || '';

    const profileSaved = localStorage.getItem('cazamarket_profile');
    if (profileSaved) {
      try {
        const parsed = JSON.parse(profileSaved);
        if (parsed.storeName) authorName = parsed.storeName;
        if (!userAvatar && parsed.storeLogo) userAvatar = parsed.storeLogo;
        if (!userAvatar && parsed.avatar) userAvatar = parsed.avatar;
      } catch (e) {}
    }

    const nowTimestamp = Date.now().toString();
    const newPost: ForumPost = {
      id: nowTimestamp,
      title: titulo.trim(),
      author: authorName,
      authorAvatar: userAvatar || undefined,
      content: contenido.trim(),
      category: categoria || undefined,
      subcategory: subcategoria || undefined,
      repliesCount: 0,
      viewsCount: 1,
      createdAt: nowTimestamp,
      lastActive: nowTimestamp,
      replies: []
    };

    const updatedPosts = [newPost, ...currentPosts];
    localStorage.setItem('cazamarket_forum_posts', JSON.stringify(updatedPosts));

    window.location.href = `/comunidad/tema/${newPost.id}`;
  };

  return (
    <div style={{ padding: '120px var(--spacing-4) var(--spacing-8) var(--spacing-4)', maxWidth: '800px', margin: '0 auto', minHeight: '80vh' }}>
      
      {/* Botón de volver */}
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <Link href="/comunidad" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 'bold' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Volver a Comunidad
        </Link>
      </div>

      <div className="glass-panel" style={{ padding: 'var(--spacing-8)', borderRadius: 'var(--radius-xl)' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--color-text-main)', margin: '0 0 24px 0' }}>Crear Nuevo Tema</h1>
        
        {errorMsg && (
          <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '0.9rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Título */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-main)', fontWeight: 'bold' }}>Título del Tema</label>
            <input 
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Recomendaciones de equipamiento para la Patagonia..."
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                background: 'rgba(0,0,0,0.3)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: 'var(--radius-md)', 
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Categoría y Subcategoría */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-main)', fontWeight: 'bold' }}>Categoría</label>
              <CustomSelect 
                id="comunidad-crear-cat"
                options={categoryOptions}
                value={categoria}
                onChange={(val) => {
                  setCategoria(val);
                  setSubcategoria('');
                }}
                placeholder="Seleccionar Categoría"
                searchable
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-main)', fontWeight: 'bold' }}>Subcategoría</label>
              <CustomSelect 
                id="comunidad-crear-subcat"
                options={subcategoryOptions}
                value={subcategoria}
                onChange={setSubcategoria}
                placeholder="Seleccionar Subcategoría"
                disabled={!categoria}
                searchable
              />
            </div>
          </div>

          {/* Contenido / Mensaje */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-main)', fontWeight: 'bold' }}>Mensaje</label>
            <textarea 
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Explica detalladamente de qué trata tu tema..."
              style={{ 
                width: '100%', 
                minHeight: '200px', 
                padding: '16px', 
                background: 'rgba(0,0,0,0.3)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: 'var(--radius-md)', 
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
            <Link href="/comunidad" style={{ textDecoration: 'none' }}>
              <button type="button" className="btn btn-outline" style={{ padding: '12px 24px', borderRadius: 'var(--radius-full)', color: 'var(--color-text-main)', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', cursor: 'pointer' }}>
                Cancelar
              </button>
            </Link>
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px', borderRadius: 'var(--radius-full)', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
              Publicar Tema
            </button>
          </div>
          
        </form>
      </div>

    </div>
  );
}
