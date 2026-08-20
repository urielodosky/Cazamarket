'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlan } from '@/contexts/PlanContext';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationsPanel from './NotificationsPanel';
import './UserMenu.css';

export default function UserMenu() {
  const { logout, username, email, avatar, isVendor, toggleVendorMode, isVendorModeActive, supabaseUser } = useAuth();
  const { mode, toggleMode } = useTheme();
  const { permissions } = usePlan();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="user-nav-wrapper">
      <div className="user-menu-container" ref={menuRef}>
        <button 
          className="user-menu-trigger avatar-only"
          onClick={() => { setIsOpen(!isOpen); setShowNotifications(false); }}
          aria-expanded={isOpen}
          title="Mi perfil"
        >
          <div className="user-avatar-trigger relative">
            {avatar ? (
              <Image src={avatar} alt="Avatar" width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            )}
            
            {/* Red Badge for Notifications */}
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[var(--color-bg-base)] z-10 animate-pulse"></div>
            )}
          </div>
        </button>

        {isOpen && (
          <div className="user-dropdown-menu overflow-hidden">
            {showNotifications ? (
              <NotificationsPanel 
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onClose={() => setShowNotifications(false)}
              />
            ) : (
              <>
                <div className="mobile-only-logo">
                  <Image src="/logo.png" alt="CazaMarket Logo" width={140} height={40} style={{ objectFit: 'contain' }} />
                </div>
                {/* Header del Perfil */}
                <div className="user-dropdown-header">
                  <div className="user-header-avatar">
                    {avatar ? (
                      <Image src={avatar} alt="Avatar" width={48} height={48} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    )}
                  </div>
                  <div className="user-header-info">
                    {isVendor ? (
                      <Link href="/negocios/1" style={{ textDecoration: 'none' }} onClick={() => setIsOpen(false)}>
                        <p className="user-name" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = ''}>
                          {username || 'Usuario'}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </p>
                      </Link>
                    ) : (
                      <p className="user-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {username || 'Usuario'}
                      </p>
                    )}
                    <p className="user-email">{email || 'usuario@correo.com'}</p>
                    <span className={`user-role-badge ${isVendorModeActive ? 'vendor' : 'buyer'}`}>
                      {isVendorModeActive ? 'Modo Vendedor' : 'Modo Comprador'}
                    </span>
                  </div>
                </div>

                {/* Opciones del menú */}
                <div className="user-dropdown-body">
                  <button 
                    className="dropdown-item toggle-mode-btn" 
                    onClick={() => {
                      if (isVendor) {
                        toggleVendorMode();
                        window.location.href = '/negocios';
                      } else {
                        window.location.href = '/planes';
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <span>{isVendorModeActive ? 'Cambiar a Comprador' : 'Cambiar a Vendedor'}</span>
                  </button>

                  {/* INYECCIÓN DEL BOTÓN NOTIFICACIONES */}
                  <button 
                    className="dropdown-item" 
                    onClick={() => setShowNotifications(true)}
                    style={{ position: 'relative' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <span>Notificaciones</span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                        {unreadCount > 99 ? '+99' : unreadCount}
                      </span>
                    )}
                  </button>

                  {isVendor && (
                    <>
                      <Link href="/mis-tiendas" className="dropdown-item" onClick={() => setIsOpen(false)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"></path>
                        </svg>
                        <span>Configurar negocio</span>
                      </Link>
                    </>
                  )}

                  <Link href="/carrito" className="dropdown-item" onClick={() => setIsOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <span>Mi carrito</span>
                  </Link>

                  <Link href="/mensajes" className="dropdown-item" onClick={() => setIsOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span>Mensajes</span>
                  </Link>

                  <Link href="/planes" className="dropdown-item desktop-hidden" onClick={() => setIsOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 6l-9.5 9.5-5-5L1 18"></path><polyline points="16 6 23 6 23 13"></polyline>
                    </svg>
                    <span>Planes</span>
                  </Link>

                  <Link href="/favoritos" className="dropdown-item" onClick={() => setIsOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span>Favoritos y Reseñas</span>
                  </Link>

                  <Link href="/ayuda" className="dropdown-item" onClick={() => setIsOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span>Ayuda e Información</span>
                  </Link>

                  <Link href="/configuracion" className="dropdown-item" onClick={() => setIsOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    <span>Configuración</span>
                  </Link>
                </div>

                {/* Footer con tema y salir */}
                <div className="user-dropdown-footer">
                  <button className="dropdown-item logout-btn" onClick={() => { logout(); setIsOpen(false); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
