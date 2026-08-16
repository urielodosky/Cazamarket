import React from 'react';
import Link from 'next/link';
import AccordionItem from '@/components/ui/AccordionItem';

export const metadata = {
  title: 'Centro de Ayuda - CazaMarket',
  description: 'Guías, políticas e información útil sobre cómo usar CazaMarket.',
};

export default function AyudaPage() {
  return (
    <div style={{ padding: '120px var(--spacing-4) var(--spacing-8) var(--spacing-4)', maxWidth: '900px', margin: '0 auto', minHeight: '80vh' }}>
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--color-text-main)', margin: '0 0 8px 0' }}>Centro de Ayuda</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', margin: 0 }}>
          Encuentra todas las guías y respuestas para sacar el máximo provecho a CazaMarket.
        </p>
      </div>

      {/* A. Legal y Seguridad */}
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
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
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

        <AccordionItem title="Comprar con Seguridad">
          <p><strong>CazaMarket funciona como una vidriera virtual.</strong> Nosotros no procesamos los pagos ni participamos directamente en la transacción entre tú y el vendedor.</p>
          <p style={{ marginTop: '8px' }}>Por tu seguridad, antes de realizar cualquier compra o transferencia, te recomendamos encarecidamente:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li>Verificar las <strong>Reseñas</strong> del vendedor dejadas por otros usuarios.</li>
            <li>Averiguar y constatar la información del negocio contactado (teléfonos, ubicación física si la tiene, y redes sociales).</li>
            <li>Realizar todas las preguntas necesarias mediante el sistema de Mensajes o Chat antes de concretar.</li>
          </ul>
        </AccordionItem>
      </div>

      {/* B. Primeros Pasos y Comunidad */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--spacing-8)' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          Primeros Pasos y Comunidad
        </h2>
        
        <AccordionItem title="¿Cómo funciona la sección de Comunidad?">
          <p>La Comunidad es el foro central de CazaMarket. Es el lugar ideal para:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Crear Temas:</strong> Si tienes dudas sobre un equipo, buscas recomendaciones o quieres compartir experiencias.</li>
            <li><strong>Responder y Ayudar:</strong> Puedes interactuar con otros cazadores y entusiastas del outdoor.</li>
            <li><strong>Filtros:</strong> Puedes buscar temas específicos por categoría para encontrar rápido lo que te interesa.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="¿Cómo funcionan los Favoritos?">
          <p>El sistema de favoritos (el ícono del corazón) te permite guardar elementos para verlos más tarde sin perderlos de vista:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Productos y Servicios:</strong> Guárdalos para comparar precios o comprarlos después.</li>
            <li><strong>Negocios/Tiendas:</strong> Si encuentras un vendedor de confianza, agrégalo a favoritos para acceder rápidamente a su catálogo actualizado.</li>
          </ul>
          <p style={{ marginTop: '8px' }}>Puedes gestionar todo esto desde la sección "Favoritos" en tu menú de usuario.</p>
        </AccordionItem>

        <AccordionItem title="¿Cómo funcionan las Reseñas?">
          <p>Las reseñas son el pilar de la confianza en nuestra plataforma. Luego de interactuar con un negocio, tienes la opción de dejar una reseña (de 1 a 5 estrellas) acompañada de un comentario.</p>
          <p style={{ marginTop: '8px' }}><strong>Importante:</strong> Las reseñas impactan directamente en la visibilidad del vendedor. Un vendedor con altas calificaciones genera más confianza y sube en los rankings de búsqueda.</p>
        </AccordionItem>
      </div>

      {/* C. Guía para Vendedores: Inicio y Configuración */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--spacing-8)' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
          Guía para Vendedores: Inicio y Configuración
        </h2>

        <AccordionItem title="Cómo empezar a vender (Modo Vendedor)">
          <p>Para comenzar a vender, solo necesitas abrir tu menú de usuario (arriba a la derecha) y hacer clic en <strong>"Cambiar a Vendedor"</strong>.</p>
          <p style={{ marginTop: '8px' }}>Al hacer esto, la interfaz cambiará y tendrás acceso a tu panel de administración ("Mi Negocio"), desde donde podrás configurar tu tienda, publicar artículos y elegir un Plan (Hunter, Sniper o Armory).</p>
        </AccordionItem>

        <AccordionItem title="Configurar tu Negocio (Tipos y Categorías)">
          <p>En la sección "Configurar Negocio", debes establecer la base de tu identidad:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Tipo de Negocio:</strong> Define si eres un Minorista, Mayorista, Fabricante, Importador, etc. Esto ayuda a los compradores (y a otros negocios) a entender tu rol en la cadena comercial.</li>
            <li><strong>Categorías del Negocio:</strong> Selecciona en qué rubros generales operas (Armería, Indumentaria, Cuchillería). Esto no limita lo que puedes publicar, pero categoriza tu tienda en el directorio de negocios.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Información de Contacto y Horarios">
          <p>Una tienda transparente vende más. Asegúrate de configurar:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Teléfono de WhatsApp:</strong> Fundamental, ya que es el canal principal donde te llegarán los clientes (si no usas el Bot IA).</li>
            <li><strong>Ubicación y Sucursales:</strong> Ingresa la dirección exacta. Si tienes un plan superior, podrás agregar múltiples sucursales para los retiros.</li>
            <li><strong>Horarios de Atención:</strong> Establece qué días y en qué franjas horarias trabajas. Si un cliente intenta contactarte por chat fuera de horario, se le informará de tu ausencia.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Personalizar la Tienda (Medidas de Imágenes)">
          <p>Tu perfil es tu carta de presentación. Para que se vea profesional, respeta estas medidas sugeridas:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Imagen de Perfil / Logo:</strong> Formato cuadrado (1:1). Recomendado: <code>500x500 píxeles</code>.</li>
            <li><strong>Banner / Portada de la Tienda:</strong> Formato horizontal. Recomendado: <code>1200x400 píxeles</code> o similar (ratio 3:1).</li>
            <li><strong>Imágenes de Productos y Servicios:</strong> Formato horizontal clásico (4:3). Recomendado: <code>800x600 píxeles</code>. Si subes otras proporciones, el sistema las adaptará, pero 4:3 garantiza que no se recorten en los listados.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Proveedores y Distribuidores">
          <p><strong>¿Para qué sirve mostrarlos?</strong></p>
          <p style={{ marginTop: '8px' }}>Si eres un comercio y vendes marcas específicas (ej. marcas de cuchillos, ópticas, indumentaria), puedes agregarlas a tu lista de Proveedores/Marcas. Esto sirve como validación de calidad ("Distribuidor Oficial") y atrae a compradores que buscan esas marcas específicas dentro de tu perfil.</p>
        </AccordionItem>
      </div>

      {/* D. Publicación de Catálogo */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--spacing-8)' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          Publicación de Catálogo
        </h2>

        <AccordionItem title="Cómo Publicar un Producto y sus Características">
          <p>Los Productos son bienes físicos intercambiables. Al crear uno, puedes configurar:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Límites:</strong> Título (máx 30 caracteres), Descripción (máx 500 caracteres).</li>
            <li><strong>Características Específicas:</strong> Agrega tags (ej. Calibre, Peso, Color) de hasta 50 caracteres para detallar técnica del producto sin ensuciar el título.</li>
            <li><strong>Envío y Retiro:</strong> Define si el envío es gratis, tiene un costo acordado extra, y si permites retirar físicamente de una sucursal específica.</li>
            <li><strong>Stock:</strong> Puedes llevar control numérico ("Stock Definido") o dejarlo infinito ("No Necesario").</li>
            <li><strong>Declaración Jurada:</strong> Obligatorio de marcar si vendes Armas de Fuego, garantizando que cumples las leyes de transferencias correspondientes.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Cómo Crear un Servicio y sus Características">
          <p>Los Servicios son intangibles (ej. Guías, Mantenimiento, Cursos). Se configuran distinto a los productos:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Ubicación del Servicio:</strong> Puedes indicar si se brinda en el domicilio del cliente, en tu local, o de forma online.</li>
            <li><strong>Radio de Cobertura (Mapa):</strong> Puedes dibujar en el mapa exactamente hasta qué área geográfica te desplazas para brindar el servicio.</li>
            <li><strong>Reglas de Temporada:</strong> Útil para servicios como "Caza Mayor". Puedes definir en qué meses del año el servicio está disponible.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Cómo Funcionan los Descuentos">
          <p>Tanto en productos como servicios, puedes habilitar una Zona de Descuentos para incentivar ventas. Opciones disponibles:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Descuento Estándar:</strong> Un porcentaje (%) o monto fijo rebajado del precio final de forma permanente.</li>
            <li><strong>Descuentos por Volumen (Venta Mayorista):</strong> <em>"Lleva 5 unidades y obtén 10% OFF"</em>. Configura reglas según la cantidad.</li>
            <li><strong>Early Bird (Solo Servicios):</strong> Descuentos por reservar con anticipación (ej. <em>"15% OFF si reservas 30 días antes"</em>).</li>
            <li><strong>Horarios Valle (Solo Servicios):</strong> Descuentos automáticos si el cliente contrata el servicio en días u horas de baja demanda.</li>
          </ul>
        </AccordionItem>
      </div>

      {/* E. Planes, Herramientas y Posicionamiento */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', borderRadius: 'var(--radius-xl)' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          Planes, Herramientas y Posicionamiento
        </h2>

        <AccordionItem title="Los Diferentes Planes y Ventajas">
          <p>CazaMarket te ofrece escalar tu negocio mediante 3 planes (Hunter, Sniper, Armory). Estas son las herramientas de los planes avanzados:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <li><strong>Carrito de Compras B2B:</strong> (Planes Superiores) Permite a los clientes armar pedidos por volumen combinando productos y solicitarte una cotización unificada.</li>
            <li><strong>Bot Asesor de IA:</strong> En lugar de recibir "Hola precio" en tu WhatsApp todo el día, nuestro Bot lee las descripciones de tus productos e interactúa con el cliente. Resuelve dudas y, solo si el cliente confirma la compra, lo deriva a tu WhatsApp. ¡Es un filtro anti-curiosos!</li>
            <li><strong>Mapas y Cobertura:</strong> (Sniper/Armory) Te habilita a dibujar polígonos de zonas de envío o servicio directamente en un mapa interactivo para que el comprador sepa exactamente hasta dónde llegas.</li>
            <li><strong>Calendarios (Booking):</strong> (Sniper/Armory) Permite a tus clientes elegir una fecha y horario para reservar un servicio, bloqueando automáticamente los horarios ocupados.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Anuncios Promocionados y el Ranking (Quién aparece primero)">
          <p><strong>¿Cómo funciona el orden del catálogo?</strong></p>
          <p style={{ marginTop: '8px' }}>Por defecto, los listados se ordenan mezclando métricas de éxito (reseñas, cantidad de visitas) y novedad. Sin embargo, los planes de suscripción alteran tu posicionamiento:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Plan Hunter:</strong> Publicaciones normales.</li>
            <li><strong>Plan Sniper:</strong> Tus artículos obtienen un borde/insignia <strong style={{ color: '#4ade80' }}>Verde</strong> y reciben un empuje en el algoritmo, apareciendo por encima de los usuarios Hunter en la mayoría de búsquedas relacionadas.</li>
            <li><strong>Plan Armory:</strong> Máxima prioridad. Tus artículos destacan con brillos y bordes <strong style={{ color: '#fbbf24' }}>Dorados (Tops)</strong>. Siempre son los primeros resultados sugeridos en su categoría.</li>
          </ul>
          <p style={{ marginTop: '8px' }}><strong>Anuncios de Pago:</strong> Adicionalmente, el plan Armory tiene acceso ilimitado (y Sniper 7 días) a colocar un "Banner Promocionado" en la página principal, garantizando cientos de visualizaciones extra por fuera de las búsquedas comunes.</p>
        </AccordionItem>

        <AccordionItem title="Cómo funciona Cambiar de Plan (Acelerar Cambio)">
          <p>Puedes subir o bajar de Plan en cualquier momento desde la pestaña "Planes".</p>
          <p style={{ marginTop: '8px' }}>Al cambiar, el sistema calcula tu nuevo nivel y los beneficios se activan instantáneamente. </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Acelerar Cambio:</strong> Si la plataforma detecta que estás por concretar ventas masivas o necesitas herramientas de inmediato (como el Bot IA para frenar una ola de mensajes), puedes usar la opción de acelerar el cambio, lo que hace que los nuevos algoritmos de posicionamiento y los módulos avanzados se desplieguen sin demoras en caché, dejándote 100% operativo en segundos.</li>
          </ul>
        </AccordionItem>
      </div>

    </div>
  );
}
