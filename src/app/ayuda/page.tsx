import React from 'react';
import Link from 'next/link';
import AccordionItem from '@/components/ui/AccordionItem';

export const metadata = {
  title: 'Centro de Ayuda - CazaMarket',
  description: 'Guías, políticas e información útil sobre cómo usar CazaMarket.',
};

export default function AyudaPage() {
  return (
    <div style={{ padding: '120px var(--spacing-4) var(--spacing-8) var(--spacing-4)', maxWidth: '800px', margin: '0 auto', minHeight: '80vh' }}>
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--color-text-main)', margin: '0 0 8px 0' }}>Centro de Ayuda</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', margin: 0 }}>
          Encuentra todas las guías y respuestas para sacar el máximo provecho a CazaMarket.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--spacing-8)' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Legal y Seguridad
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <Link href="/terminos-y-condiciones" style={{ display: 'block', textDecoration: 'none' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: 'var(--radius-lg)', transition: 'background 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>Términos y Condiciones</h3>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Reglas de uso de la plataforma.</p>
            </div>
          </Link>
          
          <Link href="/politica-de-privacidad" style={{ display: 'block', textDecoration: 'none' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: 'var(--radius-lg)', transition: 'background 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>Políticas de Privacidad</h3>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Cómo protegemos tus datos.</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--spacing-8)' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Guía para Vendedores
        </h2>
        
        <AccordionItem title="Cómo crear un producto">
          <p>Para publicar un producto y asegurarte de que se vea perfecto en la tienda, ten en cuenta lo siguiente:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Título:</strong> Máximo 30 caracteres. Sé directo y claro.</li>
            <li><strong>Descripción:</strong> Límite de 500 caracteres. Detalla el estado y funciones principales.</li>
            <li><strong>Características:</strong> Agrega tags (ej. Calibre, Peso, Marca) limitados a 50 caracteres cada uno para que destaquen.</li>
            <li><strong>Imágenes:</strong> Sube fotos nítidas (relación de aspecto recomendada 4:3) para que tu producto llame la atención.</li>
            <li><strong>Opciones de Venta:</strong> Puedes configurar stock obligatorio, zonas de envío gratis o con costo, y retiros en sucursal.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Diferencia entre Productos y Servicios">
          <p>En CazaMarket puedes publicar tanto bienes físicos como servicios (ej. Guía de Caza, Cursos, Armería). Al publicar un Servicio tendrás opciones específicas:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Radio de Cobertura:</strong> Define en qué zonas geográficas operas usando el mapa interactivo.</li>
            <li><strong>Descuentos Temporales:</strong> Puedes configurar "Early Bird" (reservas anticipadas) o descuentos por volumen.</li>
            <li><strong>Ubicación del Servicio:</strong> Puedes indicar si el servicio se presta en tu local, a domicilio, o si es online.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Mejoras y Beneficios de los Planes">
          <p>CazaMarket ofrece 3 planes para vendedores que se adaptan a tu volumen de ventas. Todos son mensuales y puedes cancelarlos en cualquier momento:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <li><strong style={{ color: '#cd7f32' }}>Plan Hunter ($5/mes):</strong> Ideal para arrancar. Permite 2 negocios, 10 sucursales, comisiones estándar y soporte normal.</li>
            <li><strong style={{ color: '#c0c0c0' }}>Plan Sniper ($15/mes):</strong> Mejora tu visibilidad. Permite 5 negocios, 5 servicios activos a la vez, comisión reducida al 5%, productos destacados en verde, soporte 24/7 y acceso a campañas publicitarias de 7 días.</li>
            <li><strong style={{ color: '#ffd700' }}>Plan Armory ($30/mes):</strong> Para tiendas consolidadas. Negocios ilimitados, sucursales ilimitadas, 10 servicios activos simultáneos, comisión ultrabaja del 3%, productos destacados en dorado brillante, soporte prioritario por teléfono, asistente IA personalizado y campañas ilimitadas.</li>
          </ul>
        </AccordionItem>
      </div>

      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', borderRadius: 'var(--radius-xl)' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Funcionamiento de la Plataforma
        </h2>

        <AccordionItem title="Categorías y Subcategorías">
          <p>Es vital elegir la categoría correcta para que tu publicación aparezca en los filtros de búsqueda:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Armas de Fuego:</strong> Cortas, largas, escopetas, repuestos. <em>(Requiere confirmación de Declaración Jurada)</em>.</li>
            <li><strong>Óptica:</strong> Miras telescópicas, binoculares, telémetros.</li>
            <li><strong>Cuchillería:</strong> Cuchillos de caza, tácticos, navajas.</li>
            <li><strong>Indumentaria:</strong> Camuflaje, calzado técnico, chalecos.</li>
            <li><strong>Accesorios:</strong> Fundas, estuches, municiones, linternas.</li>
            <li><strong>Camping y Outdoor:</strong> Carpas, mochilas, supervivencia.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="¿Cómo funciona el botón de Chat?">
          <p>Cada vez que un comprador visita tu producto o tu perfil, verá un botón verde de "Contactar".</p>
          <p style={{ marginTop: '8px' }}>Dependiendo de tu configuración y tu plan, este botón puede hacer dos cosas:</p>
          <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Contacto Directo por WhatsApp:</strong> Si eres Vendedor estándar, el botón enviará al cliente directamente a tu WhatsApp con un mensaje prearmado preguntando por el producto.</li>
            <li><strong>Filtro de Asistente Virtual (Planes Premium):</strong> Si habilitaste la IA en tus productos, el chat abrirá primero una ventana interna donde nuestra IA responderá automáticamente las preguntas del comprador basándose en tu descripción y características. Solo si el cliente desea comprar, la IA le entregará el enlace a tu WhatsApp. ¡Esto te ahorra cientos de preguntas innecesarias!</li>
          </ol>
        </AccordionItem>
      </div>

    </div>
  );
}
