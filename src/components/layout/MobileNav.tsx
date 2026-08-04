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

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
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
