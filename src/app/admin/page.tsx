import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminUsersTable from '@/components/AdminUsersTable';

// Precios de los planes en USD (Según configuración en planTypes.ts)
const PLAN_PRICES: Record<string, number> = {
  gratis: 0,
  basico: 14,
  emprendedor: 30,
  comercial: 52,
  empresarial: 80,
};

export default async function AdminDashboardPage() {
  // 1. Verificación Fuerte de Seguridad
  const cookieStore = await cookies();
  const sudoSession = cookieStore.get('admin_sudo_session');
  
  if (!sudoSession || sudoSession.value !== 'active') {
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

  // 2. Fetch de Métricas (Server-side)
  // a) Obtener todos los usuarios para la tabla y métricas
  const { data: usersData, error: usersError } = await supabase
    .from('profiles')
    .select('id, contact_email, full_name, person_type, plan_tier, created_at')
    .order('created_at', { ascending: false });

  const users = usersData?.map(u => ({
    ...u,
    email: u.contact_email // mapeamos a email para que la tabla lo entienda
  })) || [];
  
  // b) Contar denuncias pendientes
  const { count: reportsCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // c) Denuncias recientes (para la lista de alertas)
  const { data: recentReports } = await supabase
    .from('reports')
    .select('id, reason, reported_type, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  // 3. Cálculos de KPIs
  const totalUsers = users.length;
  let paidUsersCount = 0;
  let mrrUSD = 0;

  users.forEach(u => {
    const tier = u.plan_tier || 'gratis';
    if (tier !== 'gratis') {
      paidUsersCount++;
      mrrUSD += (PLAN_PRICES[tier] || 0);
    }
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--color-text-main)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Dashboard Analytics</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', margin: 0 }}>
            Bienvenido al centro de comando de CazaMarket.
          </p>
        </div>
        <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></div>
          Sudo Mode Activo
        </div>
      </div>
      
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        
        {/* MRR Card */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(255, 115, 0, 0.15)', padding: '10px', borderRadius: '10px', color: 'var(--color-primary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-text-muted)' }}>MRR Proyectado</h3>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-1px' }}>
            ${mrrUSD.toLocaleString('en-US')} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>USD/mes</span>
          </div>
        </div>

        {/* Total Users */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '10px', borderRadius: '10px', color: '#3b82f6' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-text-muted)' }}>Usuarios Totales</h3>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-1px' }}>
            {totalUsers.toLocaleString()}
          </div>
        </div>

        {/* Paid Users */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '10px', borderRadius: '10px', color: '#a855f7' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-text-muted)' }}>Negocios con Plan</h3>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-1px' }}>
            {paidUsersCount.toLocaleString()}
          </div>
        </div>

        {/* Reports / Alerts */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: reportsCount && reportsCount > 0 ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: reportsCount && reportsCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(156, 163, 175, 0.15)', padding: '10px', borderRadius: '10px', color: reportsCount && reportsCount > 0 ? '#ef4444' : '#9ca3af' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-text-muted)' }}>Denuncias Pendientes</h3>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: reportsCount && reportsCount > 0 ? '#ef4444' : 'var(--color-text-main)', letterSpacing: '-1px' }}>
            {reportsCount || 0}
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px' }}>
        {/* Main Users Table */}
        <div style={{ minWidth: 0 }}>
          <AdminUsersTable users={users} />
        </div>

        {/* Right Sidebar Alerts */}
        <div>
          <div style={{ background: 'var(--color-bg-surface-elevated)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              Alertas Recientes
            </h3>
            
            {recentReports && recentReports.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentReports.map(report => (
                  <div key={report.id} style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Nueva Denuncia</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', marginBottom: '8px' }}>{report.reason} en {report.reported_type}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Hace {Math.floor((new Date().getTime() - new Date(report.created_at).getTime()) / (1000 * 3600 * 24))} días</div>
                  </div>
                ))}
                <a href="/admin/denuncias" style={{ display: 'block', textAlign: 'center', padding: '8px', color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, marginTop: '8px' }}>Ver todas las denuncias →</a>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', background: 'var(--color-bg-base)', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                No hay denuncias pendientes. ¡Todo en orden!
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
