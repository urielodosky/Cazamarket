import Link from 'next/link';
import PromoSlider from '@/components/PromoSlider';
import TrendingSection from '@/components/TrendingSection';
import PlanesPreview from '@/components/PlanesPreview';
import './home.css';

export default function Home() {
  return (
    <div className="home-container">

      <PromoSlider />

      <TrendingSection />
      
      <PlanesPreview />
    </div>
  );
}
