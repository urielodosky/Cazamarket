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

  // Fetch de perfiles para mapear quién denuncia
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, contact_email');

  const reports = (reportsData || []).map(r => {
    const reporter = profiles?.find(p => p.id === r.reporter_id);
    return {
      ...r,
      reporter_name: reporter?.full_name || reporter?.contact_email || 'Usuario Desconocido'
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
