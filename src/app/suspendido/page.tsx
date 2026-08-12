import Link from 'next/link';

export default function SuspendidoPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: '20px' }}>
      <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
      </div>
      <h1 style={{ fontSize: '2.5rem', color: 'var(--color-text-main)', marginBottom: '16px' }}>Cuenta Suspendida</h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', maxWidth: '500px', lineHeight: '1.6', marginBottom: '32px' }}>
        El acceso a esta cuenta ha sido restringido por el equipo de moderación debido a infracciones en nuestras políticas de uso o comportamiento indebido en la plataforma.
      </p>
      
      <div style={{ display: 'flex', gap: '16px' }}>
        <a href="mailto:soporte@cazamarket.com" style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--color-bg-surface-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', textDecoration: 'none', fontWeight: 600 }}>
          Contactar Soporte
        </a>
        <Link href="/ingreso" style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
          Cerrar Sesión
        </Link>
      </div>
    </div>
  );
}
