import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Providers from "@/components/Providers";
import PageTransitionLoader from "@/components/ui/PageTransitionLoader";
import MobileNav from "@/components/layout/MobileNav";
import { Suspense } from 'react';
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CazaMarket | Todo para el Cazador, Pescador y Campista",
  description: "La plataforma de confianza para comercios y servicios de caza, camping y pesca.",
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
        </Providers>
      </body>
    </html>
  );
}
