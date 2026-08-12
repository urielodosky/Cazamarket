import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: 'var(--color-text-main)', marginBottom: '16px' }}>Dashboard de Administración</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
        Bienvenido al panel superadmin. Estás autenticado bajo Sudo Mode.
      </p>
      
      <div style={{ marginTop: '40px', padding: '24px', background: 'var(--color-bg-elevated)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--color-text-main)', marginBottom: '16px' }}>Información del Sistema</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          ID de sesión: {user?.id}
        </p>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>
          La cookie `admin_sudo_session` está protegiendo tus acciones críticas.
        </p>
      </div>
    </div>
  );
}
