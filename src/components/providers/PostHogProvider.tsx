'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// Initialize PostHog outside the component to avoid re-initialization
if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // Disabling automatic pageview to handle it manually in Next.js App Router
    autocapture: true,
    opt_out_capturing_by_default: true, // No rastrear por defecto hasta que acepten cookies
  });

  // Si ya aceptaron antes, activar el rastreo
  if (localStorage.getItem('cazamarket_cookies_accepted') === 'true') {
    posthog.opt_in_capturing();
  }
}

function PostHogPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageViews />
      </Suspense>
      {children}
    </PHProvider>
  );
}
