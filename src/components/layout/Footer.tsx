"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./Footer.css";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on full-screen pages like messages
  if (pathname && pathname.startsWith('/mensajes')) {
    return null;
  }

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="logo-placeholder">CazaMarket</div>
          <p className="footer-desc">
            El Marketplace líder en Argentina para caza, pesca y camping.
          </p>
          <div className="social-links">
            {/* Social Icons for SEO/Accessibility */}
            <a href="#" className="social-btn" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            <a href="#" className="social-btn" aria-label="X (Twitter)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267L8.267 4z"></path></svg>
            </a>

            <a href="#" className="social-btn" aria-label="YouTube">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </a>
          </div>
        </div>

        <div className="footer-links-group">
          <h3>Plataforma</h3>
          <Link href="/productos">Productos</Link>
          <Link href="/servicios">Servicios</Link>
          <Link href="/negocios">Negocios</Link>
          <Link href="/comunidad">Comunidad</Link>
        </div>

        <div className="footer-links-group">
          <h3>Legal</h3>
          <Link href="/terminos-y-condiciones">Términos y Condiciones</Link>
          <Link href="/politica-de-privacidad">Política de Privacidad</Link>
          <Link href="/planes">Planes para Vendedores</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} CazaMarket. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
