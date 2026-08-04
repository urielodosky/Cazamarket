'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NEGOCIOS_DATA } from '@/data/mock';

export default function SponsoredAds() {
  const [ads, setAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ads/current')
      .then(res => res.json())
      .then(data => {
        if (data.ads && data.ads.length > 0) {
          // Enlazar los datos del anuncio con la información real (o mock) de la tienda
          const enrichedAds = data.ads.map((ad: any) => {
            // Buscamos el negocio en la base de datos mock usando el store_id
            const storeInfo = NEGOCIOS_DATA.find(n => n.id.toString() === ad.store_id) || {
              name: 'Negocio Patrocinado',
              image: '/hero_equipamiento.png',
              avatar: 'https://ui-avatars.com/api/?name=NP&background=ff7300&color=fff',
              type: 'Tienda Oficial'
            };
            return { ...ad, storeInfo };
          });
          setAds(enrichedAds);
        } else {
          setAds([]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch sponsored ads:", err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <section style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: 'var(--spacing-4)' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--spacing-3)', color: 'var(--color-text-muted)' }}>Destacados de hoy</h3>
        <div style={{ display: 'flex', gap: '16px', overflow: 'hidden' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              flex: '0 0 250px', 
              height: '140px',
              background: 'var(--color-bg-surface)', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              animation: 'pulse 1.5s infinite ease-in-out'
            }}></div>
          ))}
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 0.3; }
            100% { opacity: 0.6; }
          }
        `}} />
      </section>
    );
  }

  // Si no hay anuncios que mostrar, el componente no se renderiza (Estado Vacío)
  if (ads.length === 0) return null;

  return (
    <section style={{ width: '100%', maxWidth: '1200px', margin: '0 auto var(--spacing-6) auto', padding: '0 var(--spacing-4)' }}>
      <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--spacing-3)', color: 'var(--color-text-main)', fontWeight: 'bold' }}>Destacados de hoy</h3>
      
      <div className="sponsored-ads-container" style={{ 
        display: 'flex', 
        gap: '16px', 
        overflowX: 'auto', 
        paddingBottom: '16px',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none' /* Firefox */
      }}>
        {ads.map((ad, idx) => (
          <Link 
            key={ad.id || idx}
            href={`/negocios/${ad.store_id}`}
            style={{
              flex: '0 0 260px',
              scrollSnapAlign: 'start',
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              textDecoration: 'none',
              background: 'var(--color-bg-surface-elevated)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.2s ease, border-color 0.2s ease'
            }}
            className="sponsored-ad-card"
          >
            {/* Badge de Anuncio Patrocinado */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              background: 'rgba(255, 115, 0, 0.9)',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              zIndex: 10,
              backdropFilter: 'blur(4px)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              Patrocinado
            </div>

            <div style={{
              height: '100px',
              width: '100%',
              backgroundImage: `url(${ad.storeInfo.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                height: '40%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
              }}></div>
            </div>

            <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src={ad.storeInfo.avatar} 
                alt={ad.storeInfo.name}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--color-bg-surface)'
                }}
              />
              <div style={{ overflow: 'hidden' }}>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ad.storeInfo.name}
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {ad.storeInfo.type}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .sponsored-ads-container::-webkit-scrollbar {
          display: none;
        }
        .sponsored-ad-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 115, 0, 0.4) !important;
        }
      `}} />
    </section>
  );
}
