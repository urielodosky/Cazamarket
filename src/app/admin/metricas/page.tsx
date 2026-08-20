import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { verifySudoMode } from '@/lib/auth/verifySudo';

export default async function AdminMetricsPage() {
  // Verificación Fuerte de Seguridad — JWT criptográfico
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Link href="/admin" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', transition: 'color 0.2s' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Volver al Dashboard
            </Link>
          </div>
          <h1 style={{ fontSize: '2rem', color: 'var(--color-text-main)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Métricas PostHog</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', margin: 0 }}>
            Visualiza en tiempo real los eventos, visitas y embudos de conversión.
          </p>
        </div>
      </div>

      <div style={{ background: 'var(--color-bg-surface-elevated)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden', height: 'calc(100vh - 200px)', minHeight: '600px' }}>
        <iframe 
          src="https://us.posthog.com/shared/1OyTS3AdlVLhEMjXyzjFU3Qu15u-Ng"
          width="100%" 
          height="100%" 
          style={{ border: 'none' }}
          title="PostHog Analytics Dashboard"
        />
      </div>
    </div>
  );
}
