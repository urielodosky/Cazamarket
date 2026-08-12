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
    <>
      <style>{`
        .admin-layout-container {
          display: flex;
          min-height: 100vh;
          background: var(--color-bg-base);
          flex-direction: column;
        }
        .admin-sidebar {
          width: 100%;
          background: var(--color-bg-surface);
          border-bottom: 1px solid var(--color-border);
          padding: 20px;
        }
        .admin-nav {
          display: flex;
          flex-direction: row;
          gap: 12px;
          overflow-x: auto;
        }
        .admin-main {
          flex: 1;
          padding: 20px;
        }
        @media (min-width: 768px) {
          .admin-layout-container {
            flex-direction: row;
          }
          .admin-sidebar {
            width: 250px;
            border-bottom: none;
            border-right: 1px solid var(--color-border);
          }
          .admin-nav {
            flex-direction: column;
          }
          .admin-main {
            padding: 40px;
          }
        }
      `}</style>
      <div className="admin-layout-container">
        {/* Sidebar Admin */}
        <aside className="admin-sidebar">
          <h2 style={{ color: 'var(--color-primary)', fontSize: '1.25rem', marginBottom: '24px' }}>CazaMarket Admin</h2>
          <nav className="admin-nav">
            <a href="/admin" style={{ color: 'var(--color-text-main)', textDecoration: 'none', padding: '10px', borderRadius: '8px', background: 'var(--color-bg-elevated)', whiteSpace: 'nowrap' }}>Dashboard</a>
            <a href="/admin/denuncias" style={{ color: 'var(--color-text-main)', textDecoration: 'none', padding: '10px', borderRadius: '8px', whiteSpace: 'nowrap' }}>Denuncias</a>
            <a href="/admin/usuarios" style={{ color: 'var(--color-text-main)', textDecoration: 'none', padding: '10px', borderRadius: '8px', whiteSpace: 'nowrap' }}>Usuarios</a>
          </nav>
        </aside>

        {/* Contenido Principal */}
        <main className="admin-main">
          {children}
        </main>
      </div>
    </>
  );
}
