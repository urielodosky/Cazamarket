'use client';

import { useState } from 'react';
import { updateReportStatus } from '@/app/actions/adminReportAction';
import toast from 'react-hot-toast';

type Report = {
  id: string;
  reporter_id: string;
  reported_id: string;
  reported_type: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
};

export default function AdminReportsList({ initialReports }: { initialReports: Report[] }) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved' | 'dismissed'>('pending');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const filteredReports = reports.filter(r => r.status === activeTab);

  const handleStatusChange = async (reportId: string, newStatus: 'pending' | 'resolved' | 'dismissed') => {
    setIsUpdating(reportId);
    const res = await updateReportStatus(reportId, newStatus);
    
    if (res.success) {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
      toast.success(newStatus === 'resolved' ? 'Denuncia resuelta' : newStatus === 'dismissed' ? 'Denuncia descartada' : 'Vuelta a pendientes');
    } else {
      toast.error(res.error || 'Error al cambiar estado');
    }
    
    setIsUpdating(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'resolved': return { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' };
      case 'dismissed': return { bg: 'rgba(156, 163, 175, 0.1)', text: '#9ca3af', border: 'rgba(156, 163, 175, 0.3)' };
      default: return { bg: 'transparent', text: '#fff', border: 'transparent' };
    }
  };

  const generateLink = (type: string, id: string) => {
    switch (type) {
      case 'product': return `/productos/${id}`;
      case 'service': return `/servicios/${id}`;
      case 'post': return `/comunidad/tema/${id}`;
      case 'user': return `/negocios/${id}`;
      default: return '#';
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{ padding: '8px 16px', borderRadius: '8px', background: activeTab === 'pending' ? 'var(--color-primary)' : 'var(--color-bg-surface)', color: activeTab === 'pending' ? '#fff' : 'var(--color-text-muted)', border: '1px solid', borderColor: activeTab === 'pending' ? 'var(--color-primary)' : 'var(--color-border)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
        >
          Pendientes ({reports.filter(r => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          style={{ padding: '8px 16px', borderRadius: '8px', background: activeTab === 'resolved' ? 'rgba(34, 197, 94, 0.1)' : 'var(--color-bg-surface)', color: activeTab === 'resolved' ? '#22c55e' : 'var(--color-text-muted)', border: '1px solid', borderColor: activeTab === 'resolved' ? 'rgba(34, 197, 94, 0.5)' : 'var(--color-border)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
        >
          Resueltas ({reports.filter(r => r.status === 'resolved').length})
        </button>
        <button
          onClick={() => setActiveTab('dismissed')}
          style={{ padding: '8px 16px', borderRadius: '8px', background: activeTab === 'dismissed' ? 'rgba(156, 163, 175, 0.1)' : 'var(--color-bg-surface)', color: activeTab === 'dismissed' ? '#9ca3af' : 'var(--color-text-muted)', border: '1px solid', borderColor: activeTab === 'dismissed' ? 'rgba(156, 163, 175, 0.5)' : 'var(--color-border)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
        >
          Descartadas ({reports.filter(r => r.status === 'dismissed').length})
        </button>
      </div>

      {/* Grid de Tarjetas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredReports.length === 0 ? (
          <div style={{ padding: '40px', background: 'var(--color-bg-surface-elevated)', borderRadius: '16px', border: '1px dashed var(--color-border)', textAlign: 'center', color: 'var(--color-text-muted)', gridColumn: '1 / -1' }}>
            No hay denuncias en esta categoría.
          </div>
        ) : (
          filteredReports.map(report => (
            <div key={report.id} style={{ background: 'var(--color-bg-surface-elevated)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              
              <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '4px' }}>
                    {report.reason}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Denuncia #{report.id.substring(0, 8)}
                  </div>
                </div>
                <div style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', background: getStatusColor(report.status).bg, color: getStatusColor(report.status).text, border: `1px solid ${getStatusColor(report.status).border}` }}>
                  {report.status === 'pending' ? 'Pendiente' : report.status === 'resolved' ? 'Resuelta' : 'Descartada'}
                </div>
              </div>

              <div style={{ padding: '16px', flex: 1 }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>Descripción del usuario</div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', lineHeight: '1.5', background: 'var(--color-bg-base)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    {report.description ? `"${report.description}"` : <i>Sin descripción adicional.</i>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Tipo: </span>
                    <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{report.reported_type}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Fecha: </span>
                    <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <a 
                  href={generateLink(report.reported_type, report.reported_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', background: 'var(--color-bg-base)', border: '1px solid var(--color-primary)', borderRadius: '8px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', transition: 'background 0.2s' }}
                >
                  Ver Contenido Reportado
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              </div>

              <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-base)', display: 'flex', gap: '8px' }}>
                {report.status !== 'resolved' && (
                  <button
                    disabled={isUpdating === report.id}
                    onClick={() => handleStatusChange(report.id, 'resolved')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.5)', fontWeight: 600, cursor: isUpdating === report.id ? 'not-allowed' : 'pointer' }}
                  >
                    Resolver
                  </button>
                )}
                {report.status !== 'dismissed' && (
                  <button
                    disabled={isUpdating === report.id}
                    onClick={() => handleStatusChange(report.id, 'dismissed')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(156, 163, 175, 0.1)', color: '#9ca3af', border: '1px solid rgba(156, 163, 175, 0.5)', fontWeight: 600, cursor: isUpdating === report.id ? 'not-allowed' : 'pointer' }}
                  >
                    Descartar
                  </button>
                )}
                {report.status !== 'pending' && (
                  <button
                    disabled={isUpdating === report.id}
                    onClick={() => handleStatusChange(report.id, 'pending')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)', fontWeight: 600, cursor: isUpdating === report.id ? 'not-allowed' : 'pointer' }}
                  >
                    Pendiente
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
