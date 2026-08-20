'use client';

import { useState } from 'react';
import { submitBlockAppeal } from '@/app/actions/userManagementAction';
import toast from 'react-hot-toast';

export default function AppealForm() {
  const [appeal, setAppeal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appeal.trim()) return;

    setIsSubmitting(true);
    const res = await submitBlockAppeal(appeal);
    setIsSubmitting(false);

    if (res.success) {
      toast.success('Apelación enviada correctamente');
      setSubmitted(true);
    } else {
      toast.error(res.error || 'Error al enviar la apelación');
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: '20px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '12px', marginTop: '24px', textAlign: 'center' }}>
        <h4 style={{ color: '#22c55e', margin: '0 0 8px 0', fontSize: '1.05rem' }}>Apelación Enviada</h4>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: 0 }}>
          Tu apelación fue recibida y está siendo revisada por nuestro equipo de moderación.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '24px', textAlign: 'left', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
      <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-text-main)', fontSize: '1.05rem' }}>¿Creés que esto fue un error?</h4>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: '0 0 16px 0', lineHeight: '1.5' }}>
        Podés enviar una apelación explicando tu caso. El equipo de moderación la revisará lo antes posible. Solo podés enviar una apelación por sanción.
      </p>
      <textarea
        value={appeal}
        onChange={(e) => setAppeal(e.target.value)}
        placeholder="Escribe los motivos de tu apelación aquí..."
        style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)', resize: 'vertical', marginBottom: '16px' }}
        required
      />
      <div style={{ textAlign: 'right' }}>
        <button
          type="submit"
          disabled={isSubmitting || !appeal.trim()}
          style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--color-primary)', color: '#000', fontWeight: 600, border: 'none', cursor: (isSubmitting || !appeal.trim()) ? 'not-allowed' : 'pointer', opacity: (isSubmitting || !appeal.trim()) ? 0.5 : 1 }}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Apelación'}
        </button>
      </div>
    </form>
  );
}
