'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function UTMTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const source = searchParams.get('utm_source');
    const medium = searchParams.get('utm_medium');
    const campaign = searchParams.get('utm_campaign');

    const utmData: Record<string, string> = {};
    if (source) utmData.utm_source = source;
    if (medium) utmData.utm_medium = medium;
    if (campaign) utmData.utm_campaign = campaign;

    if (Object.keys(utmData).length > 0) {
      localStorage.setItem('cazamarket_utm', JSON.stringify({
        ...utmData,
        timestamp: new Date().toISOString()
      }));
    }
  }, [searchParams]);

  return null;
}
