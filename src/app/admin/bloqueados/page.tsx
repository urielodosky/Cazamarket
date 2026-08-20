import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminBlockedTable from '@/components/AdminBlockedTable';

export default async function BloqueadosPage() {
  const supabase = await createClient();
  
  // Verificamos permisos
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/ingreso');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_superadmin) {
    redirect('/');
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', color: 'var(--color-text-main)' }}>Apelaciones y Sancionados</h1>
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Gestioná a los usuarios bloqueados y revisá sus apelaciones.</p>
      </div>

      <AdminBlockedTable />
    </div>
  );
}
