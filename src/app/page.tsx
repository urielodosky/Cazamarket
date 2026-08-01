import Link from 'next/link';
import PromoSlider from '@/components/PromoSlider';
import CategoryExplorer from '@/components/CategoryExplorer';
import TrendingSection from '@/components/TrendingSection';
import PlanesPreview from '@/components/PlanesPreview';
import './home.css';

export default function Home() {
  return (
    <div className="home-container">

      <div style={{ marginTop: 'var(--spacing-4)', marginBottom: '-var(--spacing-8)' }}>
        <CategoryExplorer />
      </div>

      <section className="main-slider-section" style={{ width: '100%', maxWidth: '1200px', animation: 'fadeIn 1s ease-out 0.2s both' }}>
        <PromoSlider />
      </section>

      <TrendingSection />
      
      <PlanesPreview />
    </div>
  );
}
