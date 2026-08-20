import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { verifySudoMode } from '@/lib/auth/verifySudo';

export default async function AdminAlertasPage() {
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

  const { data: logs, error } = await supabase
    .from('system_logs')
    .select('*, profiles(email, full_name)')
    .order('created_at', { ascending: false })
    .limit(50);

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
          <h1 style={{ fontSize: '2rem', color: 'var(--color-text-main)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Registro de Seguridad</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', margin: 0 }}>
            Monitoreo proactivo de errores críticos, fallos del sistema y alertas de seguridad.
          </p>
        </div>
      </div>

      <div style={{ background: 'var(--color-bg-surface-elevated)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        {error ? (
          <div style={{ padding: '20px', color: '#ef4444' }}>Error al cargar logs: {error.message}</div>
        ) : !logs || logs.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '16px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <p>No hay alertas registradas en el sistema. Todo está funcionando correctamente.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Nivel</th>
                  <th style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Fecha</th>
                  <th style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Acción</th>
                  <th style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Usuario Afectado</th>
                  <th style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const getLevelStyles = (lvl: string) => {
                    switch (lvl) {
                      case 'CRITICAL': return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)' };
                      case 'ERROR': return { bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.5)' };
                      case 'WARNING': return { bg: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.5)' };
                      default: return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.5)' };
                    }
                  };
                  const levelStyles = getLevelStyles(log.level);

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px', background: levelStyles.bg, color: levelStyles.color, border: levelStyles.border }}>
                          {log.level}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        {new Date(log.created_at).toLocaleString('es-AR')}
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--color-text-main)', fontSize: '0.9rem', fontWeight: 500 }}>
                        <code style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 6px', borderRadius: '4px' }}>{log.action}</code>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        {log.profiles ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: 'var(--color-text-main)' }}>{log.profiles.full_name || 'Sin Nombre'}</span>
                            <span style={{ fontSize: '0.8rem' }}>{log.profiles.email}</span>
                          </div>
                        ) : 'Sistema / Anónimo'}
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--color-text-main)', fontSize: '0.9rem' }}>
                        {log.message}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
