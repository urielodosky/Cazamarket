'use client';

import React from 'react';
import Link from 'next/link';
import { AppNotification } from '@/hooks/useNotifications';

interface NotificationsPanelProps {
  notifications: AppNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export default function NotificationsPanel({ 
  notifications, 
  unreadCount, 
  onMarkAsRead, 
  onMarkAllAsRead,
  onClose 
}: NotificationsPanelProps) {

  const getIconForType = (type: string) => {
    switch (type) {
      case 'billing':
        return (
          <svg style={{ width: '20px', height: '20px', color: '#34d399' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'message':
        return (
          <svg style={{ width: '20px', height: '20px', color: '#60a5fa' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'bot':
        return (
          <svg style={{ width: '20px', height: '20px', color: '#c084fc' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'review':
        return (
          <svg style={{ width: '20px', height: '20px', color: '#facc15' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      case 'system':
      default:
        return (
          <svg style={{ width: '20px', height: '20px', color: '#9ca3af' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.is_read) {
      onMarkAsRead(n.id);
    }
    if (n.action_url) {
      onClose();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '400px', backgroundColor: 'var(--color-bg-elevated, #1a1c18)', overflow: 'hidden', borderRadius: '14px' }}>
      <style>{`
        .notif-back-btn { color: var(--color-text-muted); transition: color 0.2s; background: transparent; border: none; padding: 0; cursor: pointer; display: flex; align-items: center; }
        .notif-back-btn:hover { color: white; }
        .notif-mark-all { font-size: 12px; color: var(--color-primary); background: transparent; border: none; cursor: pointer; padding: 0; }
        .notif-mark-all:hover { text-decoration: underline; }
        .notif-item { display: flex; gap: 12px; padding: 12px; border-radius: 12px; transition: background-color 0.2s; text-decoration: none; align-items: flex-start; }
        .notif-item.read:hover { background-color: rgba(255,255,255,0.03); }
        .notif-item.unread { background-color: rgba(255, 115, 0, 0.05); }
        .notif-item.unread:hover { background-color: rgba(255, 115, 0, 0.1); }
      `}</style>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={onClose} className="notif-back-btn" title="Volver al menú">
            <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 style={{ fontWeight: 600, color: 'var(--color-text-main)', margin: 0, fontSize: '1rem' }}>Notificaciones</h3>
        </div>
        {unreadCount > 0 && (
          <button onClick={onMarkAllAsRead} className="notif-mark-all">
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {notifications.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '24px', gap: '12px' }}>
            <svg style={{ width: '48px', height: '48px', color: 'rgba(255,255,255,0.1)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>No tienes notificaciones pendientes.</p>
          </div>
        ) : (
          notifications.map(n => {
            const ContentWrapper = (n.action_url ? Link : 'div') as React.ElementType;
            return (
              <ContentWrapper 
                key={n.id}
                href={n.action_url || '#'}
                onClick={() => handleNotificationClick(n)}
                className={`notif-item ${n.is_read ? 'read' : 'unread'}`}
              >
                <div style={{ flexShrink: 0, marginTop: '4px' }}>
                  {getIconForType(n.type)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ fontSize: '14px', margin: 0, fontWeight: n.is_read ? 500 : 700, color: n.is_read ? 'var(--color-text-main)' : 'var(--color-primary)' }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {new Date(n.created_at).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>
                    {n.message}
                  </p>
                </div>
                {!n.is_read && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', alignSelf: 'center', flexShrink: 0, marginLeft: '4px' }}></div>
                )}
              </ContentWrapper>
            );
          })
        )}
      </div>
    </div>
  );
}
