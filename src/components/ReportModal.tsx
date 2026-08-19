'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

export type ReportType = 'product' | 'service' | 'community_post' | 'profile';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedType: ReportType;
  reportedId: string;
}

const REPORT_REASONS = [
  'Contenido Inapropiado u Ofensivo',
  'Infracción de Derechos de Autor (Copyright)',
  'Fraude o Estafa',
  'Spam o Publicidad no deseada',
  'Otro motivo'
];

export default function ReportModal({ isOpen, onClose, reportedType, reportedId }: ReportModalProps) {
  const { supabaseUser } = useAuth();
  const supabase = createClient();

  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isDescriptionRequired = reason === 'Infracción de Derechos de Autor (Copyright)' || reason === 'Fraude o Estafa';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUser) {
      toast.error('Tenés que iniciar sesión para denunciar.');
      return;
    }

    if (isDescriptionRequired && !description.trim()) {
      toast.error('Por favor, brindá más detalles en la descripción para este tipo de denuncia.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: supabaseUser.id,
          reported_type: reportedType,
          reported_id: reportedId,
          reason,
          description: description.trim() || null
        });

      if (error) throw error;

      toast.success('Denuncia enviada para revisión.');
      onClose();
      // Reset form
      setReason(REPORT_REASONS[0]);
      setDescription('');
    } catch (err) {
      console.error('Error submitting report:', err);
      toast.error('Hubo un error al enviar la denuncia. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--color-bg-base)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      }}>
        <h3 id="report-modal-title" style={{ fontSize: '1.25rem', color: 'var(--color-text-main)', margin: '0 0 16px 0' }}>
          Denunciar Publicación
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              Motivo de la denuncia
            </label>
            <select 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text-main)',
                fontSize: '0.95rem'
              }}
            >
              {REPORT_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              Detalles adicionales {isDescriptionRequired ? <span style={{color: 'var(--color-warning)'}}>* (Obligatorio)</span> : '(Opcional)'}
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isDescriptionRequired ? "Proporcioná enlaces, pruebas o más detalles sobre tu reclamo..." : "Agregá más detalles si lo creés necesario..."}
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text-main)',
                fontSize: '0.95rem',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 16px',
                background: 'var(--color-warning)', // Usually red/orange for reports
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                fontWeight: 600
              }}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Denuncia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
