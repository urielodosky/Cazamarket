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
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'message':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'bot':
        return (
          <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'review':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      case 'system':
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <div className="flex flex-col w-full h-[400px] bg-[var(--color-bg-elevated)] overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-white transition-colors" title="Volver al menú">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="font-semibold text-[var(--color-text-main)] m-0">Notificaciones</h3>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={onMarkAllAsRead} 
            className="text-xs text-[var(--color-primary)] hover:underline border-none bg-transparent cursor-pointer p-0"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-2 flex flex-col gap-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
            <svg className="w-12 h-12 text-[rgba(255,255,255,0.1)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm text-[var(--color-text-muted)]">No tienes notificaciones pendientes.</p>
          </div>
        ) : (
          notifications.map(n => {
            const ContentWrapper = n.action_url ? Link : 'div';
            return (
              <ContentWrapper 
                key={n.id}
                href={n.action_url || '#'}
                onClick={() => handleNotificationClick(n)}
                className={`flex gap-3 p-3 rounded-xl transition-colors ${
                  n.is_read 
                    ? 'hover:bg-[rgba(255,255,255,0.03)]' 
                    : 'bg-[rgba(var(--color-primary-rgb),0.05)] hover:bg-[rgba(var(--color-primary-rgb),0.1)]'
                }`}
                style={{ textDecoration: 'none' }}
              >
                <div className="flex-shrink-0 mt-1">
                  {getIconForType(n.type)}
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <span className={`text-sm m-0 ${n.is_read ? 'text-[var(--color-text-main)] font-medium' : 'text-[var(--color-primary)] font-bold'}`}>
                      {n.title}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)] flex-shrink-0 whitespace-nowrap">
                      {new Date(n.created_at).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] m-0 line-clamp-2">
                    {n.message}
                  </p>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] self-center flex-shrink-0 mt-1"></div>
                )}
              </ContentWrapper>
            );
          })
        )}
      </div>
    </div>
  );
}
