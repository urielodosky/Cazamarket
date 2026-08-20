import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export default async function SuspendidoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ingreso');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_blocked, block_reason, block_expires_at')
    .eq('id', user.id)
    .single();

  if (!profile?.is_blocked) {
    redirect('/');
  }

  // Verificar si expiró el baneo
  if (profile.block_expires_at && new Date(profile.block_expires_at).getTime() < Date.now()) {
    // Si ya pasó la fecha, desbanear automáticamente
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabaseAdmin
      .from('profiles')
      .update({ is_blocked: false, block_reason: null, block_expires_at: null })
      .eq('id', user.id);
    
    redirect('/');
  }

  const expirationText = profile.block_expires_at 
    ? new Date(profile.block_expires_at).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })
    : 'Permanente';

  const reasonText = profile.block_reason || 'Infracción a nuestras políticas de uso.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: '20px' }}>
      <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
      </div>
      <h1 style={{ fontSize: '2.5rem', color: 'var(--color-text-main)', marginBottom: '16px' }}>Cuenta Suspendida</h1>
      
      <div style={{ background: 'var(--color-bg-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '100%', marginBottom: '32px', textAlign: 'left' }}>
        <h3 style={{ margin: '0 0 12px 0', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>Motivo de la Sanción</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: '1.5', margin: '0 0 20px 0' }}>
          {reasonText}
        </p>

        <h3 style={{ margin: '0 0 12px 0', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>Duración</h3>
        <div style={{ display: 'inline-block', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          {profile.block_expires_at ? `Expira el ${expirationText}` : 'Bloqueo Permanente'}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '16px' }}>
        <a href="mailto:soporte@cazamarket.com" style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--color-bg-surface-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', textDecoration: 'none', fontWeight: 600 }}>
          Contactar Soporte
        </a>
        <Link href="/" style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--color-primary)', color: '#000', textDecoration: 'none', fontWeight: 600 }}>
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
