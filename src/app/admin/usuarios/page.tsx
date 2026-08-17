import { redirect } from 'next/navigation';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import AdminUsersTable from '@/components/AdminUsersTable';
import { verifySudoMode } from '@/lib/auth/verifySudo';

export default async function AdminUsuariosPage() {
  // 1. Verificación Fuerte de Seguridad — JWT criptográfico
  try {
    await verifySudoMode();
  } catch {
    redirect('/admin/login-sudo');
  }

  // Instanciamos supabaseAdmin para saltar el RLS
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 2. Fetch de todos los usuarios
  const { data: usersData, error: usersError } = await supabaseAdmin
    .from('profiles')
    .select('id, contact_email, full_name, person_type, product_plan_tier, created_at, is_superadmin, is_blocked')
    .order('created_at', { ascending: false });

  const users = usersData?.map(u => ({
    ...u,
    email: u.contact_email, // mapeamos a email para que la tabla lo entienda
    plan_tier: u.product_plan_tier // mapeamos a plan_tier
  })) || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--color-text-main)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Directorio de Usuarios</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', margin: 0 }}>
            Gestioná los planes, roles y accesos de toda tu base de usuarios.
          </p>
        </div>
      </div>
      
      <AdminUsersTable users={users} />
    </div>
  );
}
