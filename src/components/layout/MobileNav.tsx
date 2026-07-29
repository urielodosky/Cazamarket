'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import './MobileNav.css';

export default function MobileNav() {
  const pathname = usePathname();
  const [ripples, setRipples] = useState<{ x: number, y: number, id: number }[]>([]);

  const addRipple = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { x, y, id: Date.now() };
    
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  };

  const navItems = [
    { href: '/', icon: '🏠', label: 'Inicio' },
    { href: '/negocios', icon: '🏪', label: 'Negocios' },
    { href: '/productos', icon: '🛍️', label: 'Productos' },
    { href: '/comunidad', icon: '💬', label: 'Comunidad' },
    { href: '/planes', icon: '⭐', label: 'Planes' },
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
            onClick={addRipple}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
            
            {ripples.map(ripple => (
              <span 
                key={ripple.id}
                className="ripple-effect"
                style={{ left: ripple.x, top: ripple.y }}
              />
            ))}
          </Link>
        );
      })}
    </nav>
  );
}
