'use client';

import { useState, useMemo } from 'react';
import { adminChangePlan, adminToggleBlock, adminSendNotification, adminSendGlobalNotification } from '@/app/actions/userManagementAction';
import toast from 'react-hot-toast';

type Profile = {
  id: string;
  email: string;
  full_name?: string;
  person_type?: string;
  product_plan_tier?: string;
  service_plan_tier?: string;
  created_at?: string;
  is_superadmin?: boolean;
  is_blocked?: boolean;
};

export default function AdminUsersTable({ users: initialUsers }: { users: Profile[] }) {
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState<{userId: string | null, isGlobal: boolean, title: string, message: string} | null>(null);
  const itemsPerPage = 10;

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const term = searchTerm.toLowerCase();
      const matchEmail = user.email?.toLowerCase().includes(term);
      const matchName = user.full_name?.toLowerCase().includes(term);
      return matchEmail || matchName;
    });
  }, [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset page on search
  };

  const handleSendNotification = async () => {
    if (!showNotificationModal || !showNotificationModal.title || !showNotificationModal.message) return;
    setIsUpdating(true);
    let res;
    if (showNotificationModal.isGlobal) {
      res = await adminSendGlobalNotification(showNotificationModal.title, showNotificationModal.message);
    } else if (showNotificationModal.userId) {
      res = await adminSendNotification(showNotificationModal.userId, showNotificationModal.title, showNotificationModal.message);
    }
    
    if (res?.success) {
      toast.success(showNotificationModal.isGlobal ? 'Notificación global enviada' : 'Notificación enviada');
      setShowNotificationModal(null);
    } else {
      toast.error(res?.error || 'Error al enviar notificación');
    }
    setIsUpdating(false);
  };

  const getPlanBadge = (tier: string, type: string) => {
    if (!tier || tier === 'gratis') return null;
    const defaultStyle = { padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' as const, display: 'inline-block', marginBottom: '4px', border: '1px solid var(--color-border)' };
    let bg, color, border;
    switch (tier) {
      case 'empresarial': bg = 'rgba(168, 85, 247, 0.15)'; color = '#d8b4fe'; border = '1px solid rgba(168, 85, 247, 0.3)'; break;
      case 'comercial': bg = 'rgba(255, 115, 0, 0.15)'; color = 'var(--color-primary)'; border = '1px solid rgba(255, 115, 0, 0.3)'; break;
      case 'emprendedor': bg = 'rgba(59, 130, 246, 0.15)'; color = '#93c5fd'; border = '1px solid rgba(59, 130, 246, 0.3)'; break;
      case 'basico': bg = 'rgba(34, 197, 94, 0.15)'; color = '#86efac'; border = '1px solid rgba(34, 197, 94, 0.3)'; break;
      default: bg = 'rgba(255, 255, 255, 0.05)'; color = 'rgba(255, 255, 255, 0.6)'; border = '1px solid rgba(255, 255, 255, 0.1)'; break;
    }
    return <div style={{ ...defaultStyle, background: bg, color, border }}><span style={{ opacity: 0.7, marginRight: '4px', fontWeight: 500 }}>{type}:</span><span style={{textTransform: 'capitalize'}}>{tier}</span></div>;
  };

  return (
    <div style={{ background: 'var(--color-bg-surface-elevated)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
      
      {/* Search Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text-main)' }}>Directorio de Usuarios</h3>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%', maxWidth: '450px' }}>
          <button
            onClick={() => setShowNotificationModal({ userId: null, isGlobal: true, title: '', message: '' })}
            style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(59, 130, 246, 0.3)', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Aviso Global
          </button>
          <div style={{ position: 'relative', width: '100%' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Buscar por nombre o email..." 
              value={searchTerm}
              onChange={handleSearch}
              style={{
                width: '100%',
                padding: '10px 10px 10px 38px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-base)',
                color: 'var(--color-text-main)',
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Nombre / Empresa</th>
              <th style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Email</th>
              <th style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Tipo</th>
              <th style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Plan</th>
              <th style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Registro</th>
              <th style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '16px 20px', color: 'var(--color-text-main)', fontSize: '0.95rem', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {user.full_name || '-'}
                    {user.is_superadmin && (
                      <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.5)', fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Admin</span>
                    )}
                    {user.is_blocked && (
                      <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.5)', fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Bloqueado</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  {user.email}
                </td>
                <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {user.person_type === 'juridica' ? 'Jurídica' : user.person_type === 'fisica' ? 'Física' : 'Comprador'}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {user.product_plan_tier && user.product_plan_tier !== 'gratis' ? getPlanBadge(user.product_plan_tier, 'Prod') : null}
                    {user.service_plan_tier && user.service_plan_tier !== 'gratis' ? getPlanBadge(user.service_plan_tier, 'Serv') : null}
                    {(!user.product_plan_tier || user.product_plan_tier === 'gratis') && (!user.service_plan_tier || user.service_plan_tier === 'gratis') && (
                      <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'inline-block' }}>Gratis</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('es-AR') : '-'}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <select 
                        disabled={isUpdating || user.is_superadmin}
                        value={user.product_plan_tier || 'gratis'}
                        onChange={async (e) => {
                          setIsUpdating(true);
                          const newPlan = e.target.value;
                          const res = await adminChangePlan(user.id, 'product_plan_tier', newPlan);
                          if (res.success) {
                            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, product_plan_tier: newPlan } : u));
                            toast.success('Plan de productos actualizado');
                          } else {
                            toast.error(res.error || 'Error al cambiar plan');
                          }
                          setIsUpdating(false);
                        }}
                        style={{ padding: '4px 6px', borderRadius: '6px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        <option value="gratis">Prod: Gratis</option>
                        <option value="basico">Prod: Básico</option>
                        <option value="emprendedor">Prod: Emprend</option>
                        <option value="comercial">Prod: Comerc</option>
                        <option value="empresarial">Prod: Empres</option>
                      </select>

                      <select 
                        disabled={isUpdating || user.is_superadmin}
                        value={user.service_plan_tier || 'gratis'}
                        onChange={async (e) => {
                          setIsUpdating(true);
                          const newPlan = e.target.value;
                          const res = await adminChangePlan(user.id, 'service_plan_tier', newPlan);
                          if (res.success) {
                            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, service_plan_tier: newPlan } : u));
                            toast.success('Plan de servicios actualizado');
                          } else {
                            toast.error(res.error || 'Error al cambiar plan');
                          }
                          setIsUpdating(false);
                        }}
                        style={{ padding: '4px 6px', borderRadius: '6px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        <option value="gratis">Serv: Gratis</option>
                        <option value="basico">Serv: Básico</option>
                        <option value="emprendedor">Serv: Emprend</option>
                        <option value="comercial">Serv: Comerc</option>
                        <option value="empresarial">Serv: Empres</option>
                      </select>
                    </div>
                    
                    {!user.is_superadmin && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <button
                          disabled={isUpdating}
                          onClick={() => setShowNotificationModal({ userId: user.id, isGlobal: false, title: '', message: '' })}
                          style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.5)', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Aviso
                        </button>
                        <button
                          disabled={isUpdating}
                          onClick={async () => {
                            if (!confirm(`¿Estás seguro de que quieres ${user.is_blocked ? 'desbloquear' : 'bloquear'} a este usuario?`)) return;
                            setIsUpdating(true);
                          const res = await adminToggleBlock(user.id, user.is_blocked || false);
                          if (res.success) {
                            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_blocked: !user.is_blocked } : u));
                            toast.success(user.is_blocked ? 'Usuario desbloqueado' : 'Usuario bloqueado');
                          } else {
                            toast.error(res.error || 'Error al modificar estado');
                          }
                          setIsUpdating(false);
                        }}
                        style={{ padding: '6px 12px', borderRadius: '6px', background: user.is_blocked ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${user.is_blocked ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`, color: user.is_blocked ? '#22c55e' : '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {user.is_blocked ? 'Desbloquear' : 'Bloquear'}
                      </button>
                    </div>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredUsers.length)} de {filteredUsers.length} usuarios
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              Anterior
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {showNotificationModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--color-bg-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--color-text-main)', fontSize: '1.2rem' }}>
              {showNotificationModal.isGlobal ? 'Enviar Aviso Global' : 'Enviar Aviso a Usuario'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Título</label>
                <input 
                  type="text" 
                  value={showNotificationModal.title}
                  onChange={(e) => setShowNotificationModal({ ...showNotificationModal, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-base)', color: 'var(--color-text-main)' }}
                  placeholder="Ej: Actualización de términos"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Mensaje</label>
                <textarea 
                  value={showNotificationModal.message}
                  onChange={(e) => setShowNotificationModal({ ...showNotificationModal, message: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-base)', color: 'var(--color-text-main)', minHeight: '100px', resize: 'vertical' }}
                  placeholder="Escribe el mensaje aquí..."
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button 
                  onClick={() => setShowNotificationModal(null)}
                  disabled={isUpdating}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSendNotification}
                  disabled={isUpdating || !showNotificationModal.title || !showNotificationModal.message}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--color-primary)', border: 'none', color: '#000', fontWeight: 600, cursor: (!showNotificationModal.title || !showNotificationModal.message) ? 'not-allowed' : 'pointer', opacity: (!showNotificationModal.title || !showNotificationModal.message) ? 0.5 : 1 }}
                >
                  {isUpdating ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
