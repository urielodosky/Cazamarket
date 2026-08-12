'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function ToastNotifications() {
  const { isLoggedIn, supabaseUser } = useAuth();
  const supabase = createClient();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || !supabaseUser || hasCheckedRef.current) return;
    
    let isMounted = true;
    
    const checkNotifications = async () => {
      try {
        hasCheckedRef.current = true; // Only check once per session load
        
        // 1. Check Unread Messages
        const { data: messages } = await supabase
          .from('messages')
          .select('id, sender_id')
          .eq('receiver_id', supabaseUser.id)
          .eq('is_read', false)
          .limit(1);
          
        if (isMounted && messages && messages.length > 0) {
          toast.success('¡Tenés mensajes nuevos sin leer!', {
            icon: '💬',
            duration: 5000,
          });
        }

        // 2. Check Plan Expiration
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan_tier, plan_expires_at')
          .eq('id', supabaseUser.id)
          .single();

        if (isMounted && profile && profile.plan_tier !== 'gratis' && profile.plan_expires_at) {
          const expiresAt = new Date(profile.plan_expires_at);
          const now = new Date();
          const diffTime = expiresAt.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 3 && diffDays > 0) {
            toast('Tu plan vence en ' + diffDays + ' día' + (diffDays > 1 ? 's' : '') + '. ¡Renovalo para mantener tus beneficios!', {
              icon: '⚠️',
              duration: 6000,
              style: {
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-warning)',
                color: 'var(--color-text-main)'
              }
            });
          } else if (diffDays <= 0) {
            toast.error('Tu plan ha expirado. Estás operando con el plan Básico.', {
              duration: 6000,
            });
          }
        }
      } catch (err) {
        console.error('Error checking notifications:', err);
      }
    };

    checkNotifications();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, supabaseUser, supabase]);

  return null; // This component does not render any UI itself
}
