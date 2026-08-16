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
          Todo lo que necesitas saber para comprar y vender en CazaMarket, explicado de forma simple.
        </p>
      </div>

      {/* 1. Seguridad al Comprar */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--spacing-8)' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          Seguridad al Comprar
        </h2>
        
        <AccordionItem title="Cómo comprar con seguridad">
          <p><strong>CazaMarket funciona como una enorme vidriera virtual.</strong> Esto significa que nosotros te conectamos con el vendedor, pero el pago y la entrega la coordinas directamente con él.</p>
          <p style={{ marginTop: '8px' }}>Para evitar estafas y dolores de cabeza, te damos tres consejos de oro antes de transferir dinero:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Revisá las Reseñas:</strong> Entrá al perfil del negocio y leé lo que opinaron otros compradores reales. Es el mejor termómetro de confianza.</li>
            <li><strong>Averiguá sobre el negocio:</strong> Chequeá su dirección, buscalo en Google Maps, llamalos por teléfono o fijate en sus redes sociales para confirmar que existen.</li>
            <li><strong>Sacate las dudas:</strong> Usá nuestro sistema de chat para preguntar todo lo necesario antes de concretar la compra.</li>
          </ul>
        </AccordionItem>
      </div>

      {/* 2. Guía para Vendedores (Primeros Pasos) */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--spacing-8)' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
          Guía para Vendedores (Primeros Pasos)
        </h2>

        <AccordionItem title="Cómo empezar a vender">
          <p>Cualquier usuario puede tener su propia tienda. Solo tenés que ir al menú arriba a la derecha (donde está tu nombre) y hacer clic en <strong>"Cambiar a Vendedor"</strong>.</p>
          <p style={{ marginTop: '8px' }}>Ese botón es como la puerta trasera de tu negocio: te lleva al panel de administración donde vas a poder cargar tus artículos y configurar cómo te ve la gente.</p>
        </AccordionItem>

        <AccordionItem title="Cómo configurar tu negocio y categorías">
          <p>Al crear tu tienda, te vamos a pedir un par de datos para que los clientes sepan con quién tratan:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Tipo de Negocio:</strong> Elegí si sos un Minorista (local común), Mayorista, Fabricante o Importador.</li>
            <li><strong>Categorías:</strong> Seleccioná los rubros principales en los que te movés (ejemplo: Armería, Camping, Pesca). Esto sirve para que aparezcas en el directorio general de negocios de esos rubros.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Contacto, Horarios, Proveedores y Distribuidores">
          <p>Una tienda transparente vende el doble. Asegurate de completar esto desde "Mi Negocio":</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Contacto y Horarios:</strong> Poné tu número de WhatsApp real y fijá qué días y en qué horas trabajás. Si alguien te habla fuera de hora, el sistema le avisa que estás cerrado.</li>
            <li><strong>Proveedores y Distribuidores:</strong> Si vendés marcas conocidas (ej: Glock, Shimano), agregalas acá. Sirve como chapa de calidad (para que sepan que sos distribuidor oficial) y atrae a los fanáticos de esas marcas directo a tu perfil.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Cómo personalizar la tienda (Medidas de Imágenes)">
          <p>La apariencia de tu perfil es clave. Te recomendamos estos tamaños para que tus fotos no queden cortadas ni estiradas:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Logo / Imagen de Perfil:</strong> Tiene que ser cuadrada (relación 1:1). Tamaño ideal: <code>500x500 píxeles</code>.</li>
            <li><strong>Banner / Portada de la tienda:</strong> Es la imagen ancha que va arriba de todo. Tamaño ideal: <code>1200x400 píxeles</code>.</li>
            <li><strong>Fotos de artículos:</strong> Tienen que ser rectangulares (relación 4:3). Tamaño ideal: <code>800x600 píxeles</code>.</li>
          </ul>
        </AccordionItem>
      </div>

      {/* 3. Publicaciones (Productos y Servicios) */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--spacing-8)' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          Publicaciones (Productos y Servicios)
        </h2>

        <AccordionItem title="Cómo publicar un Producto">
          <p>Los productos son cosas físicas (una caña, una linterna, etc). Al cargarlos podés configurar:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Características:</strong> Agregale etiquetas como "Calibre", "Color" o "Peso". Esto te ayuda a dar detalles técnicos sin hacer un título larguísimo.</li>
            <li><strong>Stock y Envío:</strong> Definí cuántas unidades te quedan, si hacés envíos gratis y si la gente puede pasar a retirar por tu local.</li>
            <li><strong>Armas de Fuego:</strong> Si vendés armas, el sistema te obliga a marcar una opción especial para avisar que el comprador debe cumplir con las leyes de la ANMaC (entidad regulatoria).</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Cómo publicar un Servicio">
          <p>Los servicios son intangibles (como ser Guía de Pesca, dar Cursos de Tiro, o reparar equipos). Tienen opciones especiales que los productos no tienen:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Lugar:</strong> Aclará si el servicio es a domicilio, si tienen que ir a tu local, o si es online.</li>
            <li><strong>Mapa de Cobertura:</strong> Si tenés un plan avanzado, podés dibujar en Google Maps hasta qué zonas viajás para brindar el servicio.</li>
            <li><strong>Temporada:</strong> Súper útil para caza o pesca. Podés marcar que el servicio solo se puede comprar, por ejemplo, entre marzo y agosto.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Cómo funcionan los Descuentos">
          <p>Para empujar las ventas, podés crear ofertas directamente desde tu panel:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>Descuento Normal:</strong> Le bajás el precio fijo o le restás un porcentaje (%).</li>
            <li><strong>Descuento por Volumen (Mayorista):</strong> Configurás que si te compran más de X unidades, se hace un descuento automático.</li>
            <li><strong>Compra Anticipada (Early Bird):</strong> Si te contratan un servicio con un mes de anticipación, les podés hacer precio.</li>
            <li><strong>Horarios Valle:</strong> Si das turnos, podés cobrar más barato los días de semana que casi no va nadie, para llenar la agenda.</li>
          </ul>
        </AccordionItem>
      </div>

      {/* 4. Planes, Ventajas y Anuncios */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--spacing-8)' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          Planes, Ventajas y Anuncios
        </h2>

        <AccordionItem title="Los diferentes planes">
          <p>CazaMarket tiene 4 escalones para tu negocio: <strong>Básico, Emprendedor, Comercial y Empresarial</strong>.</p>
          <p style={{ marginTop: '8px' }}>Y a la vez, podés elegir si tu tienda va a ser solo de Productos, solo de Servicios, o un <strong>Plan Mixto</strong> (para vender ambas cosas a la vez).</p>
          <p style={{ marginTop: '8px' }}>Cuanto más alto sea tu plan, más artículos y sucursales vas a poder cargar, y más herramientas profesionales se te van a habilitar.</p>
        </AccordionItem>

        <AccordionItem title="Cómo funciona cada ventaja (Carrito, Chat, Bot, Calendarios)">
          <p>Estas son las herramientas que vas desbloqueando según tu plan:</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <li><strong>Chat interno:</strong> Te permite mensajearte de forma privada con el comprador dentro de la plataforma, sin tener que darle tu teléfono personal de entrada.</li>
            <li><strong>Carrito a WhatsApp:</strong> Los clientes pueden juntar varios de tus productos, armar un pedido grande, y mandártelo todo junto por WhatsApp.</li>
            <li><strong>Mapas (Comercial en adelante):</strong> Te deja dibujar en un mapa el área exacta donde trabajás o hacés envíos, ideal para servicios a domicilio.</li>
            <li><strong>Bot Asesor Automático (Empresarial):</strong> Es como tener un empleado virtual. Le enseñás respuestas comunes y él se encarga de contestarle a los clientes a cualquier hora, filtrando a los curiosos. Solo te los manda al WhatsApp cuando ya están decididos a comprar.</li>
            <li><strong>Calendario de Reservas (Empresarial):</strong> En vez de que te llamen para coordinar, tus clientes ven un calendario en tu perfil y eligen los días/horas que tenés libres. Si reservan un turno, ese espacio se bloquea automáticamente para el resto.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Ranking (Quién aparece primero)">
          <p>Cuando un comprador busca algo (ej: "Caña de pescar"), la plataforma le muestra primero a los vendedores con planes más altos.</p>
          <p style={{ marginTop: '8px' }}>Es decir, alguien con plan <strong>Empresarial</strong> va a salir mucho más arriba que alguien con plan Básico o Gratis. Además, el sistema tiene muy en cuenta tus reseñas: si tenés muchas estrellitas, también escalás posiciones.</p>
        </AccordionItem>

        <AccordionItem title="Anuncios Promocionados (Publicidad Extra)">
          <p>Si querés un empujón enorme de visitas sin importar qué plan tengas, podés contratar un <strong>Anuncio Promocionado</strong>.</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <li><strong>¿Dónde aparecen?:</strong> Van directo al carrusel (los carteles grandes que pasan) en la pantalla principal de CazaMarket, donde los ven todos los usuarios al entrar.</li>
            <li><strong>¿Qué puedo promocionar?:</strong> Podés promocionar tu tienda entera, o elegir un producto/servicio puntual que quieras vender rápido.</li>
            <li><strong>Costo:</strong> Se paga aparte de tu plan. Cuesta $20 USD para que aparezca toda la semana entera, o $5 USD para que aparezca solo un fin de semana al mes.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Cambiar de plan y la opción de 'Acelerar'">
          <p>Si querés pasarte a un plan mejor o a uno más barato, lo hacés desde la sección "Planes".</p>
          <p style={{ marginTop: '8px' }}>Por regla general, el cambio impacta recién cuando arranca el mes siguiente, para no ensuciar la facturación. <strong>Pero si estás apurado</strong> (por ejemplo, te empezaron a llover mensajes y necesitás el Bot YA MISMO), podés tocar el botón de <strong>Acelerar Cambio</strong>.</p>
          <p style={{ marginTop: '8px' }}>Al acelerar, el sistema te cobra la diferencia proporcional de los días que faltan y te activa todas las herramientas nuevas en 2 segundos.</p>
        </AccordionItem>
      </div>

      {/* 5. Funciones Generales de la Comunidad */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', borderRadius: 'var(--radius-xl)' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          Funciones Generales de la Comunidad
        </h2>
        
        <AccordionItem title="Cómo funciona la Comunidad (El Foro)">
          <p>Tenemos una sección de foro donde todos pueden hablar de su pasión (caza, pesca, camping, armas).</p>
          <p style={{ marginTop: '8px' }}>Ahí podés crear temas nuevos preguntando dudas, o responderle a otros usuarios para ayudarlos. Está separado en distintas categorías para que encuentres rápido lo que te interesa.</p>
        </AccordionItem>

        <AccordionItem title="Cómo funcionan los Favoritos">
          <p>Viste un producto que te gusta pero no lo querés comprar ya mismo? Tocale el <strong>ícono del corazoncito</strong>.</p>
          <p style={{ marginTop: '8px' }}>Eso lo guarda en tu lista personal de "Mis Favoritos" (accesible desde el menú de usuario). Funciona tanto para productos y servicios, como para guardar Negocios enteros que te parezcan de confianza.</p>
        </AccordionItem>

        <AccordionItem title="Cómo funcionan las Reseñas">
          <p>Después de tener contacto con un negocio, podés dejarle una puntuación (de 1 a 5 estrellas) y escribirle un comentario público sobre cómo te trató.</p>
          <p style={{ marginTop: '8px' }}>Hacer esto es vital, porque ayuda a otros cazadores a saber si ese vendedor es confiable, y además <strong>premia a los buenos negocios</strong> haciéndolos subir en los resultados de búsqueda.</p>
        </AccordionItem>
      </div>

      {/* Links de Legales */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '40px', justifyContent: 'center' }}>
        <Link href="/terminos-y-condiciones" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textDecoration: 'underline' }}>
          Términos y Condiciones
        </Link>
        <Link href="/politica-de-privacidad" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textDecoration: 'underline' }}>
          Política de Privacidad
        </Link>
      </div>
    </div>
  );
}
