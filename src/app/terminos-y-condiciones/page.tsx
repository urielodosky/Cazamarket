import React from 'react';
import Link from 'next/link';

export default function TerminosYCondicionesPage() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      color: 'var(--color-text-main)',
      lineHeight: '1.6'
    }}>
      <h1 style={{ color: 'var(--color-primary)', marginBottom: '32px', textAlign: 'center' }}>Términos y Condiciones de Uso – Cazamarket</h1>
      
      <div style={{ background: 'rgba(255, 193, 7, 0.1)', border: '2px solid #ffc107', borderRadius: '8px', padding: '16px', marginBottom: '32px' }}>
        <h2 style={{ color: '#ffc107', marginTop: 0, marginBottom: '8px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          NATURALEZA DE LA PLATAFORMA
        </h2>
        <p style={{ color: 'white', margin: 0, fontWeight: 500 }}>
          CazaMarket opera exclusivamente como un <strong>portal de exhibición publicitaria (vidriera de clasificados)</strong> y no participa, media ni garantiza ninguna transacción entre usuarios. La negociación y el pago de los artículos se realizan por fuera de la plataforma. Para la transferencia de material regulado (Armas de Fuego, Municiones, etc.), los usuarios asumen la responsabilidad total y absoluta de cumplir con la normativa vigente de la <strong>ANMaC</strong>, incluyendo la tenencia de la <strong>Credencial de Legítimo Usuario (CLU)</strong> y la utilización de los formularios <strong>SIGIMAC</strong>.
        </p>
      </div>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'white', marginBottom: '16px', fontSize: '1.4rem' }}>1. Introducción y Marco Legal</h2>
        
        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>1.1. Aceptación de los Términos</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          Los presentes Términos y Condiciones de Uso (en adelante, los "Términos") regulan el acceso y la utilización de la plataforma Cazamarket (en adelante, "la Plataforma", el "SaaS" o "el Servicio"), operada y gestionada por <strong>[Nombre Completo de la Razón Social] S.A.</strong> (en adelante, "la Empresa"), con domicilio legal en <strong>[Dirección Legal]</strong>, Provincia de Córdoba, República Argentina, y CUIT N° <strong>[Número de CUIT]</strong>. Al registrarse, acceder, navegar o utilizar la Plataforma de cualquier forma, el Usuario acepta expresamente y sin reservas someterse a estos Términos.
        </p>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>1.2. Naturaleza del Servicio</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          Cazamarket opera exclusivamente como un Software as a Service (SaaS). La Empresa provee un espacio virtual que integra un directorio clasificado (vidriera) y foros de comunicación, permitiendo a los Usuarios publicar, ofrecer y adquirir bienes y servicios relacionados con el aire libre y el uso de sistemas de aire comprimido. La Empresa no es propietaria de los artículos ofrecidos, no los tiene en posesión, no los ofrece en venta directa ni interviene en el perfeccionamiento de las operaciones entre los Usuarios.
        </p>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>1.3. Modificaciones</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          La Empresa se reserva el derecho de modificar estos Términos en cualquier momento. Las modificaciones entrarán en vigencia tras su publicación en la Plataforma. El uso continuado del Servicio implicará la aceptación de dichos cambios.
        </p>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>1.4. Jurisdicción y Ley Aplicable</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          Este acuerdo estará regido en todos sus puntos por las leyes vigentes en la República Argentina. Cualquier controversia derivada del presente acuerdo, su existencia, validez, interpretación, alcance o cumplimiento, será sometida a los Tribunales Ordinarios de la Provincia de Córdoba, renunciando los Usuarios a cualquier otro fuero o jurisdicción.
        </p>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>1.5. Registro de Negocios, Capacidad y Naturaleza de Vidriera</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          La Plataforma actúa exclusivamente como un portal de clasificados o "vidriera" digital. La Empresa no interviene en las comunicaciones externas, no procesa los pagos entre comprador y vendedor, ni verifica la identidad, permisos o licencias de los compradores finales. Dicha responsabilidad recae íntegra y exclusivamente sobre el Usuario vendedor (el negocio). Para registrar y operar un perfil de negocio en la Plataforma, el Usuario físico debe ser mayor de dieciocho (18) años. En el caso de personas jurídicas, es obligatorio proveer un CUIT válido y vigente. La Empresa se reserva el derecho de suspender cuentas, así como de exigir documentación respaldatoria (como constancias de AFIP) para verificar la titularidad de las cuentas comerciales en cualquier momento.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'white', marginBottom: '16px', fontSize: '1.4rem' }}>2. Condiciones de Suscripción y Pagos</h2>
        
        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>2.1. Planes y Facturación</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          Para que un Usuario pueda publicar su negocio, bienes o servicios en la "vidriera" de Cazamarket, deberá suscribirse a un plan de pago mensual. El pago se realizará por adelantado a través de las pasarelas de pago integradas en la Plataforma, permitiendo el débito automático mediante tarjetas de débito, crédito u otros medios habilitados. Al suscribirse, el Usuario autoriza a la Empresa a cobrar la tarifa mensual de forma recurrente y automática.
        </p>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>2.2. Falta de Pago y Suspensión</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          En caso de que el cobro automático sea rechazado, el medio de pago expire, o no se registre el pago en la fecha de vencimiento, la Empresa procederá a la suspensión inmediata de la cuenta comercial. Esto implicará la ocultación automática del perfil del negocio, así como de todos sus productos y servicios publicados en la Plataforma, dejándolos inaccesibles para el público. La visibilidad de la cuenta y sus publicaciones se restablecerá únicamente cuando el Usuario regularice su deuda y el pago sea procesado con éxito.
        </p>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>2.3. Cancelaciones y Reembolsos</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          El Usuario puede cancelar su suscripción en cualquier momento desde la configuración de su cuenta. La cancelación evitará futuros cobros recurrentes. Sin embargo, los pagos ya procesados no son reembolsables. Si el Usuario cancela a mitad de su ciclo de facturación, mantendrá el acceso a su vidriera hasta el último día del período ya pagado.
        </p>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>2.4. Modificación de Tarifas</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          La Empresa se reserva el derecho de modificar el precio de la suscripción mensual. Cualquier cambio en las tarifas será notificado a los Usuarios suscritos con al menos quince (15) días de anticipación a la fecha del próximo cobro. Si el Usuario no cancela su suscripción antes de la entrada en vigencia del nuevo precio, se considerará que acepta la nueva tarifa.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'white', marginBottom: '16px', fontSize: '1.4rem' }}>3. Responsabilidad sobre las Transacciones</h2>
        
        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>3.1. Ausencia de Intermediación Comercial</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          Cazamarket funciona de manera exclusiva como un directorio o "vidriera" virtual. La Empresa no es propietaria de los artículos ofrecidos, no tiene posesión de ellos, ni interviene en el perfeccionamiento de las operaciones celebradas entre los Usuarios. Toda transacción, acuerdo, pago, entrega, garantía o reclamo se realiza directa y exclusivamente entre el Usuario comprador y el Usuario vendedor (negocio).
        </p>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>3.2. Exención de Responsabilidad</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          La Empresa no asume responsabilidad alguna por la existencia, calidad, cantidad, estado, integridad o legitimidad de los bienes o servicios ofrecidos o adquiridos por los Usuarios. La Empresa tampoco es responsable por la capacidad legal de los Usuarios para contratar, ni por la veracidad de los datos personales ingresados por los mismos. En caso de que uno o más Usuarios o algún tercero inicien cualquier tipo de reclamo o acción legal contra un negocio publicado, todos y cada uno de los involucrados en dichos reclamos eximen de toda responsabilidad a la Empresa, a sus directores, gerentes y empleados.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'white', marginBottom: '16px', fontSize: '1.4rem' }}>4. Uso de los Foros y Reglas de Conducta</h2>
        
        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>4.1. Propósito de la Comunidad</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          Los foros de Cazamarket están destinados exclusivamente al intercambio de información, experiencias y debates relacionados con el nicho de la plataforma, actividades al aire libre y temáticas afines.
        </p>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>4.2. Conductas Prohibidas</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          Los Usuarios se comprometen a utilizar los foros de manera respetuosa. Queda estrictamente prohibido, y será causal de suspensión inmediata y definitiva de la cuenta, la publicación de contenido que incurra en:
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          <li style={{ marginBottom: '8px' }}>Uso de lenguaje obsceno, discriminatorio, violento o difamatorio.</li>
          <li style={{ marginBottom: '8px' }}>Cualquier intento de estafa, fraude, ingeniería social (phishing) o engaño hacia otros miembros de la comunidad.</li>
          <li style={{ marginBottom: '8px' }}>Publicación de enlaces maliciosos, virus, o cualquier intento de vulnerar la seguridad de la Plataforma o de los dispositivos de otros Usuarios.</li>
          <li style={{ marginBottom: '8px' }}>Compartir información personal, privada o financiera de terceros sin su consentimiento (Doxxing).</li>
          <li style={{ marginBottom: '8px' }}>Desviar intencionalmente el foco del foro hacia temas ajenos al nicho de la Plataforma (Spam).</li>
        </ul>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>4.3. Moderación y Sanciones</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          La Empresa no revisa activamente todos los mensajes antes de ser publicados, pero se reserva el derecho absoluto de moderar, editar o eliminar cualquier contenido que, a su sola discreción, viole estos Términos. Asimismo, la Empresa podrá suspender temporal o permanentemente el acceso a los foros y a la Plataforma a cualquier Usuario infractor, sin necesidad de previo aviso y sin derecho a reclamo o indemnización alguna.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'white', marginBottom: '16px', fontSize: '1.4rem' }}>5. Artículos Regulados y Prohibidos</h2>
        
        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>5.1. Material Regulado (Armas de Fuego, Municiones)</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          CazaMarket permite la exhibición publicitaria de armas de fuego, municiones y accesorios regulados a través de su vidriera de clasificados. La Plataforma <strong>no interviene, media ni garantiza</strong> ninguna transacción entre usuarios. La negociación, el pago y la transferencia de dichos artículos se realizan por fuera de la Plataforma, bajo la exclusiva responsabilidad de las partes involucradas. Los usuarios que publiquen o adquieran material regulado asumen la responsabilidad total y absoluta de cumplir con la normativa vigente de la <strong>Agencia Nacional de Materiales Controlados (ANMaC)</strong>, incluyendo pero no limitándose a: la tenencia de la <strong>Credencial de Legítimo Usuario (CLU)</strong> vigente, la utilización de los formularios <strong>SIGIMAC</strong> para la transferencia de armas de fuego, y cualquier otro requisito legal aplicable. La Empresa se reserva el derecho de solicitar documentación probatoria y de dar de baja publicaciones que, a su sola discreción, considere que no cumplen con las regulaciones vigentes.
        </p>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>5.2. Artículos de Libre Circulación</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          La Plataforma permite además la publicación de marcadoras, armas de aire comprimido, sistemas PCP (Pre-Charged Pneumatic), CO2, resorte o pistón, y sus respectivos accesorios (balines, miras telescópicas, infladores, fundas, indumentaria, cuchillería), siempre y cuando su comercialización, transporte y tenencia sean de libre circulación bajo la legislación vigente.
        </p>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>5.3. Protección de Fauna</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          Queda prohibida la publicación, oferta y venta de animales vivos, especies protegidas o en peligro de extinción, así como productos, subproductos o trofeos cuya procedencia, comercialización o traslado viole las leyes de protección de fauna silvestre provinciales y nacionales.
        </p>

        <h3 style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '8px' }}>5.4. Sanciones por Infracción</h3>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
          La Empresa se reserva el derecho de auditar las publicaciones y eliminar de forma inmediata cualquier artículo que infrinja estas normativas. La violación de esta cláusula resultará en la baja definitiva e irrevocable de la cuenta del Usuario infractor, sin derecho a reembolso de la suscripción mensual abonada, reservándose la Empresa el derecho de informar a las autoridades competentes si se detectase la comisión de un delito.
        </p>
      </section>
      
      <div style={{ marginTop: '40px', padding: '20px', background: 'var(--color-bg-surface-elevated)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
        <p style={{ marginBottom: '16px' }}>Para conocer cómo manejamos tu información personal, consulta nuestra Política de Privacidad.</p>
        <Link href="/politica-de-privacidad" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 'bold' }}>
          Ver Política de Privacidad
        </Link>
      </div>
    </div>
  );
}
