import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ingreso');
  }

  // Comprobación estricta a la base de datos de is_superadmin
  // Esto corre en el servidor solo al renderizar la página o layout,
  // por lo que es mucho más seguro y eficiente que hacerlo en el Edge Middleware.
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single();

  if (error || !profile?.is_superadmin) {
    console.warn(`[SECURITY] Intento de acceso a panel admin bloqueado para usuario ${user.id}`);
    redirect('/');
  }

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-base)' }}>
      {/* Sidebar Admin (Simplificado) */}
      <aside style={{ width: '250px', background: 'var(--color-bg-surface)', borderRight: '1px solid var(--color-border)', padding: '20px' }}>
        <h2 style={{ color: 'var(--color-primary)', fontSize: '1.25rem', marginBottom: '24px' }}>CazaMarket Admin</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a href="/admin" style={{ color: 'var(--color-text-main)', textDecoration: 'none', padding: '10px', borderRadius: '8px', background: 'var(--color-bg-elevated)' }}>Dashboard</a>
          <a href="/admin/denuncias" style={{ color: 'var(--color-text-main)', textDecoration: 'none', padding: '10px', borderRadius: '8px' }}>Denuncias</a>
          <a href="/admin/usuarios" style={{ color: 'var(--color-text-main)', textDecoration: 'none', padding: '10px', borderRadius: '8px' }}>Usuarios</a>
        </nav>
      </aside>

      {/* Contenido Principal */}
      <main style={{ flex: 1, padding: '40px' }}>
        {children}
      </main>
    </div>
  );
}
