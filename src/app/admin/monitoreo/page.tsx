import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { verifySudoMode } from '@/lib/auth/verifySudo';

import { headers } from 'next/headers';

export default async function MonitoreoPage() {
  // 1. Verificacion de seguridad Sudo Mode + Superadmin
  try {
    await verifySudoMode();
  } catch {
    redirect('/admin/login-sudo');
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/ingreso');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_superadmin) redirect('/');

  const headersList = await headers();
  const host = headersList.get('host') || 'tu-dominio.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const webhookUrl = `${protocol}://${host}/api/webhooks/posthog`;

  const posthogDashboardUrl = process.env.NEXT_PUBLIC_POSTHOG_SHARED_DASHBOARD || '';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--color-text-main)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Monitoreo en Tiempo Real</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', margin: 0 }}>
            Analíticas de producto, errores y comportamiento de usuarios vía PostHog.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link
            href="/admin"
            style={{
              background: 'var(--color-bg-surface-elevated)',
              color: 'var(--color-text-main)',
              padding: '8px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Volver al Dashboard
          </Link>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></div>
            Sudo Mode Activo
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(34, 197, 94, 0.15)', padding: '8px', borderRadius: '8px', color: '#22c55e' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Estado</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#22c55e' }}>Operativo</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '8px', borderRadius: '8px', color: '#3b82f6' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Telemetría</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-main)' }}>PostHog</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '8px', borderRadius: '8px', color: '#a855f7' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Webhook</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Configurado</div>
        </div>
      </div>

      {/* PostHog Embedded Dashboard */}
      <div className="glass-panel" style={{ borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main)' }}>Dashboard de Analíticas</h2>
          </div>
          {posthogDashboardUrl && (
            <a
              href={posthogDashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Abrir en PostHog
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          )}
        </div>

        {posthogDashboardUrl ? (
          <iframe
            src={posthogDashboardUrl}
            style={{
              width: '100%',
              height: '75vh',
              border: 'none',
              display: 'block',
              background: '#1a1a2e'
            }}
            title="PostHog Dashboard"
            allow="clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        ) : (
          <div style={{ padding: '80px 40px', textAlign: 'center' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '24px', opacity: 0.4 }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            <h3 style={{ color: 'var(--color-text-main)', fontSize: '1.3rem', marginBottom: '12px' }}>Dashboard no configurado</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Para visualizar las analíticas, necesitas agregar la variable de entorno <code style={{ background: 'var(--color-bg-base)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>NEXT_PUBLIC_POSTHOG_SHARED_DASHBOARD</code> con la URL del dashboard compartido de PostHog.
            </p>
            <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', maxWidth: '500px', margin: '0 auto', textAlign: 'left' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: '0 0 12px 0', fontWeight: 600 }}>Como obtener la URL:</p>
              <ol style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0, paddingLeft: '18px', lineHeight: 1.8 }}>
                <li>Ingresa a tu proyecto en <strong>posthog.com</strong></li>
                <li>Ve a <strong>Dashboards</strong> y selecciona el dashboard deseado</li>
                <li>Hace clic en <strong>Share</strong> (arriba a la derecha)</li>
                <li>Activa <strong>&quot;Share as embedded iframe&quot;</strong></li>
                <li>Copia la URL del <code style={{ background: 'var(--color-bg-surface-elevated)', padding: '1px 4px', borderRadius: '3px' }}>src</code> del iframe generado</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Webhook Info */}
      <div style={{ marginTop: '24px', padding: '20px 24px', background: 'var(--color-bg-surface-elevated)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          Configuracion del Webhook de Alertas
        </h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0 0 12px 0', lineHeight: 1.6 }}>
          Para recibir alertas automaticas cuando PostHog detecte errores criticos, configura el siguiente endpoint como Webhook en PostHog:
        </p>
        <code style={{ display: 'block', background: 'var(--color-bg-base)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--color-primary)', wordBreak: 'break-all', border: '1px solid var(--color-border)' }}>
          POST {webhookUrl}
        </code>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: '12px 0 0 0' }}>
          Configurable en: PostHog → Data Pipelines → Destinations → Webhook.
        </p>
      </div>
    </div>
  );
}
