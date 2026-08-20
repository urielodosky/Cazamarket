'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppNotification } from '@/hooks/useNotifications';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotificacionesPage() {
  const { supabaseUser, isLoggedIn } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/registro');
      return;
    }

    if (!supabaseUser) return;

    const fetchAllNotifications = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setNotifications(data as AppNotification[]);
      }
      setIsLoading(false);
    };

    fetchAllNotifications();
  }, [isLoggedIn, supabaseUser, supabase, router]);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    if (supabaseUser) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', supabaseUser.id).eq('is_read', false);
    }
  };

  const getIconForType = (type: string) => {
    const baseClasses = "w-10 h-10 p-2 rounded-full flex items-center justify-center ";
    switch (type) {
      case 'billing':
        return <div className={baseClasses + "bg-emerald-500/10 text-emerald-500"}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg></div>;
      case 'message':
        return <div className={baseClasses + "bg-blue-500/10 text-blue-500"}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></div>;
      case 'bot':
        return <div className={baseClasses + "bg-purple-500/10 text-purple-500"}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>;
      case 'review':
        return <div className={baseClasses + "bg-yellow-500/10 text-yellow-500"}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg></div>;
      case 'system':
      default:
        return <div className={baseClasses + "bg-gray-500/10 text-gray-500"}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>;
    }
  };

  if (!isLoggedIn) {
    return <div className="min-h-[60vh] flex items-center justify-center text-[var(--color-text-muted)]">Debes iniciar sesión para ver tus notificaciones.</div>;
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 min-h-[80vh]">
      <div className="flex h-[75vh] bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Left Column: Inbox List */}
        <div className={`w-full md:w-1/3 border-r border-[var(--color-border)] flex flex-col ${selectedNotif ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-bg-surface-elevated)]">
            <h1 className="text-xl font-bold text-[var(--color-text-main)]">Notificaciones</h1>
            {notifications.some(n => !n.is_read) && (
              <button 
                onClick={markAllAsRead}
                className="text-sm text-orange-500 hover:text-orange-400 font-medium transition-colors"
              >
                Marcar leídas
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-[var(--color-bg-base)]">
            {isLoading ? (
              <div className="p-8 text-center text-[var(--color-text-muted)]">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-text-muted)] flex flex-col items-center">
                <svg className="w-12 h-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => {
                    setSelectedNotif(n);
                    if (!n.is_read) markAsRead(n.id);
                  }}
                  className={`w-full text-left flex gap-4 p-4 rounded-xl transition-all duration-200 ${
                    selectedNotif?.id === n.id ? 'bg-[var(--color-bg-surface-elevated)] shadow-lg border border-[var(--color-border)]' : 
                    n.is_read ? 'hover:bg-[var(--color-bg-surface-elevated)] border border-transparent' : 'bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getIconForType(n.type)}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`text-sm line-clamp-3 pr-2 ${n.is_read ? 'text-[var(--color-text-main)] font-medium' : 'text-[var(--color-primary)] font-bold'}`}>
                        {n.title}
                      </h3>
                      <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap mt-0.5">
                        {new Date(n.created_at).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 mt-1">
                      {n.message}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-orange-500 self-center flex-shrink-0"></div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Notification Details */}
        <div className={`w-full md:w-2/3 flex flex-col bg-[var(--color-bg-base)] ${!selectedNotif ? 'hidden md:flex' : 'flex'}`}>
          {selectedNotif ? (
            <>
              {/* Mobile back button */}
              <div className="md:hidden p-4 border-b border-[var(--color-border)] flex items-center gap-3 bg-[var(--color-bg-surface-elevated)]">
                <button onClick={() => setSelectedNotif(null)} className="p-2 -ml-2 rounded-full hover:bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="font-medium text-[var(--color-text-main)]">Volver</span>
              </div>
              
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--color-border)]">
                    {getIconForType(selectedNotif.type)}
                    <div>
                      <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-1">{selectedNotif.title}</h2>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {new Date(selectedNotif.created_at).toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-[var(--color-text-main)] leading-relaxed whitespace-pre-wrap text-base">
                    {selectedNotif.message}
                  </div>
                  
                  {selectedNotif.action_url && (
                    <div className="mt-8 pt-8 border-t border-[var(--color-border)]">
                      <Link 
                        href={selectedNotif.action_url}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-full transition-colors shadow-lg shadow-orange-500/20"
                      >
                        <span>Ver más detalles</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-muted)] p-8 text-center">
              <div className="w-24 h-24 bg-[var(--color-bg-surface-elevated)] rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-[var(--color-text-main)] mb-2">Tus Notificaciones</h3>
              <p className="max-w-md">Selecciona una notificación de la lista lateral para leer todos los detalles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
