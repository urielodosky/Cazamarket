'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  BuildingStorefrontIcon, 
  ShoppingBagIcon, 
  ChatBubbleLeftEllipsisIcon, 
  StarIcon,
  UserCircleIcon,
  MapIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import './MobileNav.css';

export default function MobileNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const navItems = [
    { href: '/', icon: <HomeIcon className="mobile-nav-icon-svg" />, label: 'Inicio' },
    { href: '/negocios', icon: <BuildingStorefrontIcon className="mobile-nav-icon-svg" />, label: 'Negocios' },
    { href: '/productos', icon: <ShoppingBagIcon className="mobile-nav-icon-svg" />, label: 'Productos' },
    { href: '/servicios', icon: <MapIcon className="mobile-nav-icon-svg" />, label: 'Servicios' },
    { href: '/comunidad', icon: <ChatBubbleLeftEllipsisIcon className="mobile-nav-icon-svg" />, label: 'Comunidad' },
  ];

  const activeIndex = navItems.findIndex(item => pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href)));

  return (
    <nav className="mobile-bottom-nav">
      <div 
        className="mobile-nav-indicator-wrapper" 
        style={{ '--active-index': activeIndex } as React.CSSProperties}
      >
        <div className="mobile-nav-indicator">
          <div className="mobile-nav-indicator-curve left"></div>
          <div className="mobile-nav-indicator-curve right"></div>
        </div>
      </div>
      {navItems.map((item, index) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
        if (isActive && activeIndex !== index) {
          // This should ideally be handled without a render side-effect but for this simple UI it's fine
        }
        return (
          <Link 
            key={item.href}
            href={item.href}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            prefetch={false}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
