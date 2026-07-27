'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import LoadingScreen from './LoadingScreen';

export default function PageTransitionLoader() {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams?.toString() || '';

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 750);
    return () => clearTimeout(timer);
  }, [pathname, searchString]);

  if (!loading) return null;

  return <LoadingScreen message="Cargando CazaMarket..." />;
}
