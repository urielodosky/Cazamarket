'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  BuildingStorefrontIcon, 
  ShoppingBagIcon, 
  ChatBubbleLeftEllipsisIcon, 
  StarIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import './MobileNav.css';

export default function MobileNav() {
  const pathname = usePathname();
  const { isLoggedIn, isMounted } = useAuth();

  if (!isMounted) return null;

  const navItems = [
    { href: '/', icon: <HomeIcon className="mobile-nav-icon-svg" />, label: 'Inicio' },
    { href: '/negocios', icon: <BuildingStorefrontIcon className="mobile-nav-icon-svg" />, label: 'Negocios' },
    { href: '/productos', icon: <ShoppingBagIcon className="mobile-nav-icon-svg" />, label: 'Productos' },
    { href: '/servicios', icon: <svg className="mobile-nav-icon-svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.492-3.053 5.25 5.25m-7.742-2.197l-2.022-2.022M11.42 15.17l-1.39-1.39m0 0l-3.052 2.492m0 0L3 12.5A2.652 2.652 0 016.75 8.75l5.877 5.877m-5.877-5.877l5.25-5.25 3.053 2.492m-8.303-2.242l2.022-2.022" /></svg>, label: 'Servicios' },
    { href: '/comunidad', icon: <ChatBubbleLeftEllipsisIcon className="mobile-nav-icon-svg" />, label: 'Comunidad' },
    { href: '/planes', icon: <StarIcon className="mobile-nav-icon-svg" />, label: 'Planes' },
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
