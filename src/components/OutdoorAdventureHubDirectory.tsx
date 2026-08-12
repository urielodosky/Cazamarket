import React from 'react';
import Link from 'next/link';
import './OutdoorAdventureHubDirectory.css';

const OutdoorAdventureHubDirectory: React.FC = () => {
  return (
    <section className="outdoor-hub-section">
      <div className="outdoor-hub-container">
        <div className="outdoor-hub-header">
          <h2 className="outdoor-hub-title">Explora el Ecosistema Outdoor de Argentina</h2>
          <p className="outdoor-hub-subtitle">
            Encuentra equipamiento especializado, guías certificados y las mejores tiendas en un solo lugar seguro.
          </p>
        </div>

        <div className="outdoor-hub-grid">
          
          {/* Card 1: Hunting */}
          <div className="outdoor-card">
            <div className="outdoor-card-icon-wrapper hunting-theme">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="outdoor-icon">
                {/* Crosshair / Target vibe */}
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12 4.5c4.142 0 7.5 3.358 7.5 7.5 0 1.258-.31 2.443-.86 3.493l-4.522-4.521c.241-.444.382-.95.382-1.472 0-1.657-1.343-3-3-3s-3 1.343-3 3c0 .522.141 1.028.382 1.472l-4.522 4.52A7.472 7.472 0 014.5 12c0-4.142 3.358-7.5 7.5-7.5zM12 10.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="outdoor-card-title">Cacería Especializada</h3>
            <p className="outdoor-card-text">
              Equipamiento táctico, accesorios de caza mayor y menor, e indumentaria outdoor.
            </p>
            <Link href="/productos?categoria=caza" className="outdoor-card-btn hunting-btn">
              Ver Productos de Caza
            </Link>
          </div>

          {/* Card 2: Fishing */}
          <div className="outdoor-card">
            <div className="outdoor-card-icon-wrapper fishing-theme">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="outdoor-icon">
                {/* Fish / Hook vibe */}
                <path fillRule="evenodd" d="M11.412 1.53a.75.75 0 011.02 1.05 8.966 8.966 0 00-2.454 4.588 5.25 5.25 0 11-4.72 6.549.75.75 0 111.458-.352 3.75 3.75 0 103.111-4.708 7.469 7.469 0 011.585-7.127zM20.916 2.529a.75.75 0 011.042.062c1.077 1.18 1.42 2.766.974 4.148a7.514 7.514 0 01-2.923 3.935l-.265.176a9.055 9.055 0 01-4.145 1.58l.192 1.537c.725.109 1.42.33 2.067.643a.75.75 0 01-.658 1.348 9.052 9.052 0 00-6.191-.497L9 16.037a.75.75 0 01-.223-1.483l1.838-.276a7.534 7.534 0 012.335-.2l.142-1.139a10.563 10.563 0 005.176-1.92l.206-.137a6.012 6.012 0 002.34-3.149 2.25 2.25 0 00-.285-1.977.75.75 0 01.387-1.127z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="outdoor-card-title">Pesca Deportiva</h3>
            <p className="outdoor-card-text">
              Cañas, reeles, señuelos de alta calidad y accesorios para todas las modalidades.
            </p>
            <Link href="/productos?categoria=pesca" className="outdoor-card-btn fishing-btn">
              Ver Equipos de Pesca
            </Link>
          </div>

          {/* Card 3: Camping */}
          <div className="outdoor-card">
            <div className="outdoor-card-icon-wrapper camping-theme">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="outdoor-icon">
                {/* Fire / Camp vibe */}
                <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.353.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="outdoor-card-title">Camping y Supervivencia</h3>
            <p className="outdoor-card-text">
              Carpas, bolsas de dormir, herramientas de supervivencia y equipo de expedición.
            </p>
            <Link href="/productos?categoria=camping" className="outdoor-card-btn camping-btn">
              Ver Equipos de Camping
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
};

export default OutdoorAdventureHubDirectory;
