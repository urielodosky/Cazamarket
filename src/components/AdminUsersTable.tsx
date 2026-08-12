'use client';

import { useState, useMemo } from 'react';

type Profile = {
  id: string;
  email: string;
  full_name?: string;
  person_type?: string;
  plan_tier?: string;
  created_at?: string;
};

export default function AdminUsersTable({ users }: { users: Profile[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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

  const getPlanBadge = (tier: string) => {
    const defaultStyle = { padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 };
    switch (tier) {
      case 'empresarial':
        return <span style={{ ...defaultStyle, background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe', border: '1px solid rgba(168, 85, 247, 0.5)' }}>Empresarial</span>;
      case 'comercial':
        return <span style={{ ...defaultStyle, background: 'rgba(255, 115, 0, 0.2)', color: 'var(--color-primary)', border: '1px solid rgba(255, 115, 0, 0.5)' }}>Comercial</span>;
      case 'emprendedor':
        return <span style={{ ...defaultStyle, background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.5)' }}>Emprendedor</span>;
      case 'basico':
        return <span style={{ ...defaultStyle, background: 'rgba(34, 197, 94, 0.2)', color: '#86efac', border: '1px solid rgba(34, 197, 94, 0.5)' }}>Básico</span>;
      default:
        return <span style={{ ...defaultStyle, background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.7)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>Gratis</span>;
    }
  };

  return (
    <div style={{ background: 'var(--color-bg-surface-elevated)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
      
      {/* Search Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text-main)' }}>Directorio de Usuarios</h3>
        
        <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
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
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '16px 20px', color: 'var(--color-text-main)', fontSize: '0.95rem', fontWeight: 500 }}>
                  {user.full_name || '-'}
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  {user.email}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {user.person_type === 'juridica' ? 'Jurídica' : user.person_type === 'fisica' ? 'Física' : 'Comprador'}
                  </span>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {getPlanBadge(user.plan_tier || 'gratis')}
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('es-AR') : '-'}
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
    </div>
  );
}
