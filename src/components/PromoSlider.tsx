"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import AdCampaignModal from "./AdCampaignModal";
import { useAuth } from "@/contexts/AuthContext";

const DEMO_ADS: any[] = [
  {
    id: 1,
    image: '/hero_equipamiento.png',
    badge: 'BIENVENIDO A CAZAMARKET',
    title: 'Equípate para tu próxima gran aventura',
    description: 'Encuentra el mejor equipamiento, óptica y accesorios de las mejores tiendas de caza y pesca del país.',
    link: '/productos'
  },
  {
    id: 2,
    image: '/hero_guias.png',
    badge: 'SERVICIOS EXCLUSIVOS',
    title: 'Conecta con los mejores guías locales',
    description: 'Reserva experiencias de caza mayor y pesca deportiva con profesionales verificados en los mejores cotos del territorio.',
    link: '/servicios'
  }
];

export default function PromoSlider() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const { isVendorModeActive } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if we should show the CTA slide
  // Only show CTA when in vendor mode
  const showCta = isVendorModeActive;

  const totalSlides = DEMO_ADS.length + (showCta ? 1 : 0);

  // Auto-advance every 6 seconds, resets when currentSlide changes
  useEffect(() => {
    if (totalSlides > 1) {
      const timer = setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [totalSlides, currentSlide]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  // If component is not mounted yet to avoid hydration mismatch, or if there's nothing to show
  if (!mounted) return null;
  if (totalSlides === 0) return null;

  const isCtaSlide = showCta && currentSlide === DEMO_ADS.length;

  return (
    <section
      className="main-slider-section"
      style={{
        width: "100%",
        maxWidth: "1200px",
        animation: "fadeIn 1s ease-out 0.2s both",
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .slider-arrow-btn { display: none !important; }
          .slider-container { min-height: 280px !important; }
          .slide-bg { 
            background-size: cover !important; 
            background-position: center !important; 
            background-color: transparent !important; 
            min-height: 280px !important;
            padding: 20px !important;
          }
          .slider-badge { font-size: 0.65rem !important; padding: 4px 10px !important; margin-bottom: 8px !important; }
          .slider-title { font-size: 1.3rem !important; margin-bottom: 6px !important; }
          .slider-desc { font-size: 0.85rem !important; margin-bottom: 12px !important; line-height: 1.3 !important; max-width: 100% !important; }
          .slider-btn { padding: 8px 16px !important; font-size: 0.85rem !important; min-height: auto !important; }
          .slider-title-cta { font-size: 1.5rem !important; margin-bottom: 6px !important; }
          .slider-desc-cta { font-size: 0.85rem !important; margin-bottom: 12px !important; line-height: 1.3 !important; max-width: 100% !important; }
        }
      `}} />
      <div
        className="ad-banner-container"
        style={{ padding: "0 var(--spacing-4)", width: "100%" }}
      >
        {/* Slider with external arrows */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Left Arrow */}
          {totalSlides > 1 && (
            <button
              className="slider-arrow-btn"
              onClick={prevSlide}
              aria-label="Anterior"
              style={{
                flexShrink: 0,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "white",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          )}

          {/* Slider Container */}
          <div
            className="slider-container"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              position: "relative",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              minHeight: "60vh",
              boxShadow: "var(--shadow-md)",
              flex: 1,
              touchAction: "pan-y", /* Allows vertical scroll but captures horizontal swipes */
            }}
          >
            {/* Slides */}
            {DEMO_ADS.map((ad, index) => (
              <div
                key={ad.id}
                className="slide-bg"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: "32px",
                  opacity: currentSlide === index ? 1 : 0,
                  transition: "opacity 0.6s ease-in-out",
                  pointerEvents: currentSlide === index ? "auto" : "none",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
                  <Image src={ad.image} fill priority={index === 0} sizes="100vw" style={{ objectFit: 'cover' }} alt={ad.title} />
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.1) 100%)",
                    zIndex: 1,
                  }}
                />
                <div style={{ position: "relative", zIndex: 2 }}>
                  <span
                    className="slider-badge"
                    style={{
                      display: "inline-block",
                      background: "var(--color-primary)",
                      color: "white",
                      padding: "6px 14px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      letterSpacing: "1px",
                      marginBottom: "12px",
                    }}
                  >
                    {ad.badge}
                  </span>
                  <h2
                    className="slider-title"
                    style={{
                      margin: "0 0 12px 0",
                      color: "#FFFFFF",
                      fontSize: "2.5rem",
                      fontWeight: "bold",
                      lineHeight: "1.2",
                    }}
                  >
                    {ad.title}
                  </h2>
                  <p
                    className="slider-desc"
                    style={{
                      margin: "0 0 24px 0",
                      color: "#F3F4F6",
                      fontSize: "1.1rem",
                      maxWidth: "550px",
                      lineHeight: "1.5",
                    }}
                  >
                    {ad.description}
                  </p>
                  <Link
                    href={ad.link}
                    className="slider-btn"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "12px 28px",
                      borderRadius: "var(--radius-full)",
                      fontWeight: "bold",
                      fontSize: "1rem",
                      background: "var(--color-primary)",
                      color: "white",
                      textDecoration: "none",
                      boxShadow: "0 4px 15px rgba(220,100,0,0.4)",
                    }}
                  >
                    Ver más
                  </Link>
                </div>
              </div>
            ))}

            {/* CTA Slide - Anuncia Aquí (last slide) */}
            {showCta && (
              <div
                className="slide-bg"
                style={{
                  position: isCtaSlide ? "relative" : "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: isCtaSlide ? undefined : 0,
                  backgroundImage: "url(/promo_cta_background.png)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  minHeight: "60vh",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: "32px",
                  opacity: isCtaSlide ? 1 : 0,
                  transition: "opacity 0.6s ease-in-out",
                  pointerEvents: isCtaSlide ? "auto" : "none",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      "linear-gradient(to right, rgba(15, 15, 20, 0.95) 0%, rgba(15, 15, 20, 0.7) 40%, rgba(15, 15, 20, 0.2) 100%)",
                    zIndex: 1,
                  }}
                />
                <div style={{ position: "relative", zIndex: 2 }}>
                  <span
                    className="slider-badge"
                    style={{
                      display: "inline-block",
                      background: "var(--color-primary)",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.875rem",
                      fontWeight: "bold",
                      letterSpacing: "1px",
                      marginBottom: "16px",
                    }}
                  >
                    ANUNCIA AQUÍ
                  </span>
                  <h1
                    className="slider-title-cta"
                    style={{
                      margin: "0 0 16px 0",
                      color: "#FFFFFF",
                      fontSize: "3rem",
                      fontWeight: "bold",
                      lineHeight: "1.2",
                    }}
                  >
                    Haz crecer tu negocio
                  </h1>
                  <p
                    className="slider-desc-cta"
                    style={{
                      margin: "0 0 32px 0",
                      color: "#F3F4F6",
                      fontSize: "1.25rem",
                      maxWidth: "600px",
                      lineHeight: "1.5",
                    }}
                  >
                    Llega a miles de pescadores y cazadores cada día. Destaca tu
                    marca con nuestros anuncios personalizados y aumenta tus
                    ventas.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary slider-btn"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "16px 32px",
                      borderRadius: "var(--radius-full)",
                      fontWeight: "bold",
                      fontSize: "1.125rem",
                      boxShadow: "0 4px 15px rgba(220,100,0,0.4)",
                      cursor: "pointer",
                      minHeight: "44px",
                      minWidth: "44px",
                    }}
                  >
                    Ver Planes de Publicidad
                  </button>
                </div>
              </div>
            )}

            {/* Dot Indicators */}
            {totalSlides > 1 && (
              <div
                style={{
                  position: "absolute",
                  bottom: "12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 10,
                  display: "flex",
                  gap: "6px",
                }}
              >
                {Array.from({ length: totalSlides }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToSlide(i)}
                    aria-label={`Slide ${i + 1}`}
                    style={{
                      width: "8px",
                      height: "8px",
                      minWidth: 0,
                      minHeight: 0,
                      borderRadius: "50%",
                      background:
                        currentSlide === i
                          ? "var(--color-primary)"
                          : "rgba(255,255,255,0.4)",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Arrow */}
          {totalSlides > 1 && (
            <button
              className="slider-arrow-btn"
              onClick={nextSlide}
              aria-label="Siguiente"
              style={{
                flexShrink: 0,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "white",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          )}
        </div>

        {/* Modal de Planes / Personalización */}
        <AdCampaignModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </section>
  );
}
