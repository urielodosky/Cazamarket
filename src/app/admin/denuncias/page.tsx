import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import AdminReportsList from '@/components/AdminReportsList';

export default async function AdminReportsPage() {
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

  // Instanciamos supabaseAdmin para saltar el RLS
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 2. Fetch de todas las denuncias
  const { data: reportsData, error } = await supabaseAdmin
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
  }

  // Fetch de perfiles para mapear quién denuncia y a quién denuncia (si es un perfil)
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, contact_email, store_name');

  // Obtener IDs reportados por categoría
  const reportedProductIds = (reportsData || []).filter(r => r.reported_type === 'product').map(r => r.reported_id);
  const reportedServiceIds = (reportsData || []).filter(r => r.reported_type === 'service').map(r => r.reported_id);

  // Fetch de productos reportados
  let products: any[] = [];
  if (reportedProductIds.length > 0) {
    const { data } = await supabaseAdmin.from('products').select('id, title').in('id', reportedProductIds);
    if (data) products = data;
  }

  // Fetch de servicios reportados
  let services: any[] = [];
  if (reportedServiceIds.length > 0) {
    const { data } = await supabaseAdmin.from('services').select('id, title').in('id', reportedServiceIds);
    if (data) services = data;
  }

  const reports = (reportsData || []).map(r => {
    const reporter = profiles?.find(p => p.id === r.reporter_id);
    let reportedName = 'Contenido Desconocido';
    
    if (r.reported_type === 'product') {
      reportedName = products.find(p => p.id === r.reported_id)?.title || 'Producto Eliminado';
    } else if (r.reported_type === 'service') {
      reportedName = services.find(s => s.id === r.reported_id)?.title || 'Servicio Eliminado';
    } else if (r.reported_type === 'profile' || r.reported_type === 'user') {
      const p = profiles?.find(p => p.id === r.reported_id);
      reportedName = p?.store_name || p?.full_name || p?.contact_email || 'Usuario Eliminado';
    } else if (r.reported_type === 'community_post' || r.reported_type === 'post') {
      reportedName = 'Posteo de Comunidad';
    }

    return {
      ...r,
      reporter_name: reporter?.full_name || reporter?.contact_email || 'Usuario Desconocido',
      reported_name: reportedName
    };
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--color-text-main)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Centro de Moderación</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', margin: 0 }}>
            Revisá y gestioná el contenido reportado por la comunidad.
          </p>
        </div>
      </div>
      
      <AdminReportsList initialReports={reports} />
    </div>
  );
}
