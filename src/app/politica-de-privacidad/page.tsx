import React from 'react';
import Link from 'next/link';

export default function PoliticaDePrivacidadPage() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      color: 'var(--color-text-main)',
      lineHeight: '1.6'
    }}>
      <h1 style={{ color: 'var(--color-primary)', marginBottom: '32px', textAlign: 'center' }}>Políticas de Privacidad – Cazamarket</h1>
      
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'white', marginBottom: '16px', fontSize: '1.4rem' }}>1. Introducción y Responsable del Tratamiento</h2>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          La presente Política de Privacidad establece los términos en que <strong>[Nombre Completo de la Razón Social] S.A.</strong> (en adelante, "la Empresa") usa y protege la información que es proporcionada por sus Usuarios al momento de utilizar la plataforma Cazamarket (en adelante, "la Plataforma"). Esta política está alineada con las normativas vigentes en la República Argentina, específicamente la Ley N° 25.326 de Protección de Datos Personales y sus normativas complementarias.
        </p>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          El responsable de las bases de datos es la Empresa, con domicilio legal en <strong>[Dirección Legal]</strong>, Provincia de Córdoba, República Argentina.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'white', marginBottom: '16px', fontSize: '1.4rem' }}>2. Información que Recopilamos</h2>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          Para el correcto funcionamiento de la Plataforma, recopilamos los siguientes tipos de información, divididos según su obligatoriedad:
        </p>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>2.1. Datos Obligatorios:</h3>
        <ul style={{ paddingLeft: '20px', marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          <li style={{ marginBottom: '8px' }}><strong>Para Usuarios (Compradores/Foro):</strong> Nombre, apellido, dirección de correo electrónico, nombre de usuario y una contraseña cifrada.</li>
          <li style={{ marginBottom: '8px' }}><strong>Para Negocios (Vendedores):</strong> Además de los datos anteriores, se requiere la razón social, un número de contacto (WhatsApp) y, en el caso de personas jurídicas o negocios formalizados, el número de CUIT.</li>
        </ul>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>2.2. Datos Opcionales (Perfil de Negocio):</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          Los Usuarios vendedores pueden optar por enriquecer su "vidriera" proporcionando datos adicionales de carácter público, tales como: ubicación exacta o sucursales físicas, enlaces a redes sociales, horarios de atención y fotografía o logotipo de perfil.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'white', marginBottom: '16px', fontSize: '1.4rem' }}>3. Uso y Privacidad de la Información</h2>
        
        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>3.1. Datos de Carácter Privado</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          La Empresa trata con estricta confidencialidad el correo electrónico, las contraseñas (las cuales se almacenan encriptadas de extremo a extremo) y el número de CUIT. Estos datos son de uso estrictamente interno para la autenticación en el sistema, validación de la veracidad del negocio, gestión de la cuenta y comunicaciones operativas. La Empresa no vende, cede, alquila ni comercializa estas bases de datos a agencias de marketing, anunciantes ni a ningún tercero.
        </p>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>3.2. Datos de Carácter Público</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          Al operar como un directorio clasificado, el Usuario vendedor comprende y acepta que los datos provistos para su perfil comercial (nombre del negocio, WhatsApp de contacto, ubicación, redes sociales, horarios y fotos) serán de acceso público para cualquier visitante de la Plataforma, con el fin de facilitar el contacto directo entre comprador y vendedor.
        </p>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>3.3. Pasarelas de Pago</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          La Empresa no almacena ni procesa directamente números de tarjetas de crédito o débito. Esta información es gestionada de manera encriptada y exclusiva por las pasarelas de pago externas integradas a la Plataforma.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'white', marginBottom: '16px', fontSize: '1.4rem' }}>4. Uso de Cookies</h2>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          La Plataforma emplea cookies operativas y tecnologías similares con el objetivo principal de mantener la sesión del Usuario abierta y activa, facilitando la navegación sin necesidad de ingresar las credenciales de acceso de forma reiterada. El Usuario puede configurar su navegador para rechazar o eliminar las cookies en cualquier momento; sin embargo, esto puede afectar el correcto funcionamiento o la experiencia de uso de la Plataforma.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'white', marginBottom: '16px', fontSize: '1.4rem' }}>5. Retención y Eliminación de Datos (Baja de Cuenta)</h2>
        
        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>5.1. Proceso de Eliminación</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          El Usuario puede solicitar la eliminación definitiva de su cuenta en cualquier momento desde la configuración de su perfil.
        </p>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>5.2. Período de Retención Preventiva</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          Al solicitar la baja, la cuenta y sus publicaciones se ocultarán inmediatamente del acceso público. Sin embargo, por razones de seguridad, prevención de fraudes y para otorgar un período de gracia en caso de eliminación accidental, la Empresa mantendrá la información del Usuario de manera inactiva en sus bases de datos por un plazo de quince (15) días corridos.
        </p>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>5.3. Eliminación Definitiva</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          Transcurrido el plazo de quince (15) días, el sistema purgará y eliminará de forma permanente e irreversible todos los datos personales asociados a la cuenta, salvo aquellos que deban conservarse por obligaciones legales, fiscales o contables vigentes.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'white', marginBottom: '16px', fontSize: '1.4rem' }}>6. Seguridad de los Datos</h2>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          La Empresa emplea sistemas avanzados, conexiones seguras (HTTPS) y bases de datos protegidas con encriptación para evitar accesos no autorizados, alteraciones o pérdida de datos. No obstante, el Usuario reconoce que ninguna transmisión de datos a través de Internet es completamente segura, por lo que la Empresa no puede garantizar la seguridad absoluta de la información transmitida.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'white', marginBottom: '16px', fontSize: '1.4rem' }}>7. Derechos de los Titulares de los Datos</h2>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          En cumplimiento de la Ley N° 25.326, el titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses. Asimismo, el Usuario tiene derecho a solicitar la rectificación, actualización o supresión de sus datos personales incluidos en nuestras bases de datos.
        </p>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          Para ejercer estos derechos, el Usuario puede modificar su información directamente desde el panel de configuración de su cuenta o enviar un correo electrónico a <strong>[Correo electrónico de soporte/legales de Cazamarket]</strong>.
        </p>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'white', marginBottom: '16px', fontSize: '1.4rem' }}>8. Cambios en esta Política</h2>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          La Empresa se reserva el derecho de actualizar o modificar esta Política de Privacidad en cualquier momento. Se notificará a los Usuarios sobre cambios significativos a través de un aviso destacado en la Plataforma o mediante el envío de un correo electrónico a la dirección registrada.
        </p>
      </section>

      <div style={{ marginTop: '40px', padding: '20px', background: 'var(--color-bg-surface-elevated)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
        <p style={{ marginBottom: '16px' }}>Si tienes dudas sobre nuestras políticas o servicios, revisa nuestros Términos y Condiciones.</p>
        <Link href="/terminos-y-condiciones" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 'bold' }}>
          Ver Términos y Condiciones
        </Link>
      </div>
    </div>
  );
}
