import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Providers from "@/components/Providers";
import PageTransitionLoader from "@/components/ui/PageTransitionLoader";
import MobileNav from "@/components/layout/MobileNav";
import { Suspense } from 'react';
import Footer from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "CazaMarket | Todo para el Cazador, Pescador y Campista",
  description: "CazaMarket es la plataforma web líder de Argentina para conectar a cazadores, pescadores y campistas con los mejores comercios, guías y servicios de la región. Únete hoy.",
  metadataBase: new URL('https://cazamarket.vercel.app'),
  alternates: {
    canonical: '/',
    languages: {
      'es-AR': '/',
      'es-CL': '/',
      'es-UY': '/'
    },
  },
  openGraph: {
    title: "CazaMarket | Todo para el Cazador, Pescador y Campista",
    description: "La plataforma de confianza para comercios y servicios de caza, camping y pesca en la región.",
    url: 'https://cazamarket.vercel.app',
    siteName: 'CazaMarket',
    images: [
      {
        url: '/hero_equipamiento.png', // Using an existing image as OG image
        width: 1200,
        height: 630,
        alt: 'CazaMarket Portada',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "CazaMarket | El Marketplace Outdoor",
    description: "Explora la plataforma de confianza para encontrar productos y servicios de caza, pesca y camping.",
    images: ['/hero_equipamiento.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "CazaMarket",
              "url": "https://cazamarket.vercel.app",
              "description": "La plataforma de confianza para comercios y servicios de caza, camping y pesca.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://cazamarket.vercel.app/productos?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('cazamarket_theme_mode');
                if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <Suspense fallback={null}>
            <PageTransitionLoader />
            <Navbar />
            <MobileNav />
          </Suspense>
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
