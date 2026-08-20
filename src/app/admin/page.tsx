import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import AdminUsersTable from '@/components/AdminUsersTable';
import { verifySudoMode } from '@/lib/auth/verifySudo';

// Definición de tipos para las métricas del panel
interface AdminMetrics {
  total_users: number;
  paid_users_count: number;
  mrr_usd: number;
}

export default async function AdminDashboardPage() {
  // 1. Verificación Fuerte de Seguridad — JWT criptográfico
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

  // Instanciamos supabaseAdmin para saltar el RLS y obtener los datos de métricas
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 2. Fetch de Métricas (Server-side)
  // a) Obtener los últimos 25 usuarios para la tabla (paginado para no colapsar la memoria)
  const { data: usersData, error: usersError } = await supabaseAdmin
    .from('profiles')
    .select('id, contact_email, full_name, person_type, product_plan_tier, service_plan_tier, created_at, is_superadmin, is_blocked')
    .order('created_at', { ascending: false })
    .range(0, 24);

  const users = usersData?.map(u => ({
    ...u,
    email: u.contact_email, // mapeamos a email para que la tabla lo entienda
  })) || [];
  
  // b) Contar denuncias pendientes
  const { count: reportsCount } = await supabaseAdmin
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // c) Denuncias recientes (para la lista de alertas)
  const { data: recentReports } = await supabaseAdmin
    .from('reports')
    .select('id, reason, reported_type, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  // d) Anuncios Patrocinados (Activos y no vencidos)
  const { data: sponsoredAdsData } = await supabaseAdmin
    .from('sponsored_ads')
    .select('*')
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString())
    .order('end_date', { ascending: true });

  let activeAds = sponsoredAdsData || [];
  
  if (activeAds.length > 0) {
    const userIds = activeAds.map(ad => ad.user_id);
    const { data: adProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, store_name, full_name, contact_email')
      .in('id', userIds);
      
    activeAds = activeAds.map(ad => {
      const p = adProfiles?.find(profile => profile.id === ad.user_id);
      return {
        ...ad,
        profiles: p || null
      };
    });
  }

  // 3. Obtener KPIs desde PostgreSQL (RPC súper ligero)
  const { data: metricsData, error: metricsError } = await supabaseAdmin
    .rpc('get_admin_metrics')
    .single();

  const metrics = metricsData as AdminMetrics | null;
  const totalUsers = metrics?.total_users || 0;
  const paidUsersCount = metrics?.paid_users_count || 0;
  const mrrUSD = metrics?.mrr_usd || 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--color-text-main)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Dashboard Analytics</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', margin: 0 }}>
            Bienvenido al centro de comando de CazaMarket.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin/metricas" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(59, 130, 246, 0.2)', transition: 'all 0.2s' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            Métricas
          </Link>
          <Link href="/admin/monitoreo" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(168, 85, 247, 0.2)', transition: 'all 0.2s' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
            Monitoreo
          </Link>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></div>
            Sudo Mode Activo
          </div>
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

        {/* Sponsored Ads */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(234, 179, 8, 0.15)', padding: '10px', borderRadius: '10px', color: '#eab308' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-text-muted)' }}>Anuncios Activos</h3>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-1px' }}>
            {activeAds.length} <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>/ 150</span>
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
                <Link href="/admin/denuncias" style={{ display: 'block', textAlign: 'center', padding: '8px', color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, marginTop: '8px' }}>Ver todas las denuncias →</Link>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', background: 'var(--color-bg-base)', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                No hay denuncias pendientes. ¡Todo en orden!
              </div>
            )}
          </div>
          
          {/* Active Sponsors */}
          <div style={{ background: 'var(--color-bg-surface-elevated)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '20px', marginTop: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              Anunciantes (Mes)
            </h3>
            
            {activeAds && activeAds.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeAds.map(ad => (
                  <div key={ad.id} style={{ padding: '12px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                        {ad.profiles?.store_name || ad.profiles?.full_name || ad.profiles?.contact_email || 'Desconocido'}
                      </span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Activo
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ textTransform: 'capitalize' }}>{ad.plan_type === 'monthly' ? 'Mensual' : 'Semanal'}</span>
                      <span>Hasta {new Date(ad.end_date).toLocaleDateString('es-AR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-bg-base)', borderRadius: '8px', fontSize: '0.9rem' }}>
                No hay anuncios patrocinados activos en este momento.
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
