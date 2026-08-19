'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AppNotification {
  id: string;
  user_id: string;
  type: 'billing' | 'message' | 'bot' | 'review' | 'system';
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { supabaseUser, isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchNotifications = useCallback(async () => {
    if (!supabaseUser) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', supabaseUser.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error && data) {
      setNotifications(data as AppNotification[]);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
    setIsLoading(false);
  }, [supabaseUser, supabase]);

  useEffect(() => {
    if (!isLoggedIn || !supabaseUser) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    fetchNotifications();

    // Suscribirse a cambios en tiempo real
    const channel = supabase.channel('realtime_notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${supabaseUser.id}`,
        },
        (payload) => {
          // Volver a fetchear para asegurar el orden y consistencia,
          // o actualizar el estado local (por simplicidad, un re-fetch rápido está bien)
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, supabaseUser, fetchNotifications, supabase]);

  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  };
}
