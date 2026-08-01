import Link from 'next/link';
import PlaneSubscriptionButton from '@/components/PlaneSubscriptionButton';
import PromoSlider from '@/components/PromoSlider';
import TrendingSection from '@/components/TrendingSection';
import PlanesPreview from '@/components/PlanesPreview';
import './home.css';

export default function Home() {
  return (
    <div className="home-container">
      <div style={{ textAlign: 'center', marginTop: 'var(--spacing-8)', marginBottom: 'var(--spacing-6)' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 var(--spacing-2) 0' }}>Empieza a explorar</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', margin: 0 }}>
          Empieza a explorar sobre el nicho cacería, pesca, outdoor en las siguientes secciones
        </p>
      </div>

      <section className="main-slider-section" style={{ width: '100%', maxWidth: '1200px', animation: 'fadeIn 1s ease-out 0.2s both' }}>
        <PromoSlider />
      </section>

      <TrendingSection />
      
      <PlanesPreview />
    </div>
  );
}
