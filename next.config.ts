/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'suuxvngyjsgelqgpqxhd.supabase.co' }
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://us-assets.i.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://images.unsplash.com https://picsum.photos https://ui-avatars.com https://suuxvngyjsgelqgpqxhd.supabase.co; media-src 'self' https://suuxvngyjsgelqgpqxhd.supabase.co blob: data:; font-src 'self' data:; connect-src 'self' wss://suuxvngyjsgelqgpqxhd.supabase.co https://suuxvngyjsgelqgpqxhd.supabase.co https://apis.datos.gob.ar https://us.i.posthog.com https://us-assets.i.posthog.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; block-all-mixed-content; upgrade-insecure-requests;"
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ],
      },
    ]
  },
};

export default nextConfig;