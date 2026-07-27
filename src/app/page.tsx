import Link from 'next/link';
import PromoSlider from '@/components/PromoSlider';
import TrendingSection from '@/components/TrendingSection';
import PlanesPreview from '@/components/PlanesPreview';
import './home.css';

export default function Home() {
  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title text-gradient">CazaMarket</h1>
          <p className="hero-subtitle">
            El lugar de confianza para cazadores, pescadores y gente de campo.
            Conecta con negocios, encuentra productos de primera calidad, servicios 
            exclusivos y únete a la mayor comunidad al aire libre.
          </p>
          
        </div>
      </section>

      <section className="main-slider-section" style={{ width: '100%', maxWidth: '1200px', marginTop: 'var(--spacing-4)', animation: 'fadeIn 1s ease-out 0.2s both' }}>
        <PromoSlider />
      </section>

      <TrendingSection />
      
      <PlanesPreview />
    </div>
  );
}
