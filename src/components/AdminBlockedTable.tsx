'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { adminToggleBlock } from '@/app/actions/userManagementAction';

type BlockedUser = {
  id: string;
  email: string;
  full_name: string | null;
  block_reason: string | null;
  block_expires_at: string | null;
  block_appeal: string | null;
};

export default function AdminBlockedTable() {
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [expandedAppeal, setExpandedAppeal] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, block_reason, block_expires_at, block_appeal')
      .eq('is_blocked', true);

    if (error) {
      toast.error('Error al cargar usuarios bloqueados');
    } else {
      setUsers(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleLiftBlock = async (userId: string) => {
    if (!confirm('¿Estás seguro de que querés aceptar la apelación y desbloquear a este usuario?')) return;
    
    setIsUpdating(true);
    const res = await adminToggleBlock(userId, true);
    if (res.success) {
      toast.success('Sanción levantada correctamente');
      setUsers(prev => prev.filter(u => u.id !== userId));
    } else {
      toast.error(res.error || 'Error al levantar sanción');
    }
    setIsUpdating(false);
  };

  if (isLoading) {
    return <div style={{ color: 'var(--color-text-muted)' }}>Cargando usuarios...</div>;
  }

  return (
    <div style={{ background: 'var(--color-bg-surface-elevated)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Usuario</th>
              <th style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Motivo</th>
              <th style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Expira</th>
              <th style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Apelación</th>
              <th style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '16px 20px', color: 'var(--color-text-main)', fontSize: '0.95rem', fontWeight: 500 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{user.full_name || 'Sin Nombre'}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>{user.email}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  {user.block_reason || '-'}
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  {user.block_expires_at ? new Date(user.block_expires_at).toLocaleDateString('es-AR') : 'Permanente'}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {user.block_appeal ? (
                    <div>
                      <span 
                        style={{ color: '#3b82f6', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}
                        onClick={() => setExpandedAppeal(expandedAppeal === user.id ? null : user.id)}
                      >
                        {expandedAppeal === user.id ? 'Ocultar' : 'Leer Apelación'}
                      </span>
                      {expandedAppeal === user.id && (
                        <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--color-text-main)', fontStyle: 'italic', maxWidth: '300px', whiteSpace: 'pre-wrap' }}>
                          "{user.block_appeal}"
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Sin apelación</span>
                  )}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <button
                    disabled={isUpdating}
                    onClick={() => handleLiftBlock(user.id)}
                    style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.5)', color: '#22c55e', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Aceptar y Desbloquear
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No hay usuarios bloqueados actualmente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
