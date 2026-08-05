import Link from 'next/link';
import PromoSlider from '@/components/PromoSlider';
import TrendingSection from '@/components/TrendingSection';
import PlanesPreview from '@/components/PlanesPreview';
import SponsoredAds from '@/components/SponsoredAds';
import './home.css';

export default function Home() {
  return (
    <div className="home-container">
      <h1 className="sr-only">CazaMarket | Todo para el Cazador, Pescador y Campista</h1>

      <PromoSlider />

      <SponsoredAds />

      <TrendingSection />
      
      <PlanesPreview />

      {/* SEO Block para cumplir auditoría web (Sin estilos pesados para evitar que los bots lo omitan) */}
      <section className="seo-content-block">
        <div className="seo-container">
          <p>
            Bienvenido a <strong>CazaMarket</strong>, la plataforma definitiva y de confianza para comercios, guías y entusiastas del aire libre. 
            Si eres un apasionado cazador en busca de armerías especializadas, un pescador buscando los mejores señuelos, o un campista 
            preparando su próxima expedición de supervivencia, has llegado al lugar indicado. Nuestra misión es conectar a toda la comunidad 
            outdoor de Argentina y la región en un único ecosistema digital seguro y transparente.
          </p>
          <p>
            Aquí podrás encontrar un directorio completo de <strong>tiendas, servicios y profesionales</strong>. Desde equipamiento táctico, 
            accesorios de pesca, indumentaria outdoor, hasta guías certificados para caza mayor y pesca deportiva. Todos nuestros anunciantes 
            pasan por un proceso de registro, garantizando que encuentres opciones confiables.
          </p>
          <h2>¿Por qué elegir CazaMarket?</h2>
          <p>
            Entendemos que la pasión por la caza, la pesca y el camping requiere de herramientas de calidad. Al explorar nuestro marketplace, 
            tendrás acceso a promociones exclusivas, anuncios destacados y perfiles detallados de cada comercio. 
            Nuestra plataforma está diseñada con tecnología de punta para asegurar tiempos de respuesta rápidos, navegación intuitiva en dispositivos 
            móviles y transacciones seguras. Además, ofrecemos planes de suscripción para aquellos comercios que deseen expandir su alcance 
            y llegar a miles de usuarios activos que comparten esta misma pasión por la naturaleza.
          </p>
          <h2>Únete a nuestra comunidad de Caza y Pesca</h2>
          <p>
            Regístrate hoy mismo de forma gratuita. Ya sea como persona física para explorar y guardar tus tiendas favoritas, o como empresa 
            (Persona Jurídica) para publicar tus productos y servicios. Contamos con un sistema robusto de prevención de spam y condiciones de 
            alta seguridad. <strong>CazaMarket</strong> es más que un directorio; es el punto de encuentro virtual donde el cazador, el pescador 
            y el campista pueden prepararse al máximo para su próxima aventura en la naturaleza. ¡Explora nuestras categorías y comienza tu viaje!
          </p>
        </div>
        <div className="seo-links">
          <Link href="/productos" className="seo-btn">Ver Productos</Link>
          <Link href="/servicios" className="seo-btn">Ver Servicios</Link>
          <Link href="/registro" className="seo-btn seo-btn-primary">Crear cuenta gratuita</Link>
          <a href="https://instagram.com/cazamarket.arg" target="_blank" rel="noopener noreferrer" className="seo-btn seo-btn-social">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
            @cazamarket.arg
          </a>
        </div>
      </section>
    </div>
  );
}
