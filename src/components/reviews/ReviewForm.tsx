'use client';

import React, { useState, useTransition } from 'react';
import StarRating from '../ui/StarRating';
import { submitBuyerReviewAction } from '@/app/actions/reviewActions';
import { toast } from 'react-hot-toast';

interface ReviewFormProps {
  interactionId: string;
  productId: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({ interactionId, productId, onSuccess, onCancel }: ReviewFormProps) {
  const [outcome, setOutcome] = useState<'concreto' | 'no_concreto' | 'no_comunico' | ''>('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!outcome) {
      toast.error('Debes seleccionar cómo resultó la interacción.');
      return;
    }

    startTransition(async () => {
      const result = await submitBuyerReviewAction(interactionId, outcome, comment, rating, productId);
      
      if (result.success) {
        toast.success('¡Reseña enviada con éxito! Quedará visible cuando el vendedor deje la suya.');
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.error || 'Error al enviar la reseña');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-4 sm:p-6 bg-[rgba(255,255,255,0.03)] border border-[var(--color-border)] rounded-xl">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[var(--color-text-main)]">
          ¿Cómo resultó la interacción?
        </label>
        <div className="flex flex-wrap gap-2">
          <button 
            type="button" 
            onClick={() => setOutcome('concreto')}
            className={`px-4 py-2 rounded-lg text-sm transition-all border ${
              outcome === 'concreto' 
                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white font-semibold' 
                : 'bg-transparent border-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:border-[rgba(255,255,255,0.3)]'
            }`}
          >
            Se concretó la compra
          </button>
          <button 
            type="button" 
            onClick={() => setOutcome('no_concreto')}
            className={`px-4 py-2 rounded-lg text-sm transition-all border ${
              outcome === 'no_concreto' 
                ? 'bg-[#ef4444] border-[#ef4444] text-white font-semibold' 
                : 'bg-transparent border-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:border-[rgba(255,255,255,0.3)]'
            }`}
          >
            No se concretó
          </button>
          <button 
            type="button" 
            onClick={() => setOutcome('no_comunico')}
            className={`px-4 py-2 rounded-lg text-sm transition-all border ${
              outcome === 'no_comunico' 
                ? 'bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.2)] text-white font-semibold' 
                : 'bg-transparent border-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:border-[rgba(255,255,255,0.3)]'
            }`}
          >
            No se comunicó
          </button>
        </div>
      </div>

      {outcome !== '' && outcome !== 'no_comunico' && (
        <div className="animate-fade-in flex flex-col gap-5 mt-2 pt-5 border-t border-[rgba(255,255,255,0.05)]">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--color-text-main)]">
              Calificación general
            </label>
            <StarRating 
              rating={rating} 
              maxRating={5} 
              size={32} 
              isInteractive={true} 
              onChange={setRating} 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="comment" className="text-sm font-semibold text-[var(--color-text-main)]">
              Comentario u Opinión (opcional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué te pareció el producto y la atención?"
              rows={4}
              maxLength={500}
              className="w-full bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
            />
            <span className="text-xs text-[var(--color-text-muted)] self-end">
              {comment.length}/500
            </span>
          </div>
        </div>
      )}

      {outcome === 'no_comunico' && (
        <p className="text-sm text-[var(--color-text-muted)] mt-2">
          Si el vendedor no se comunicó, dejaremos asentada esta falta de respuesta para afectar su reputación y pausar sus anuncios de ser necesario.
        </p>
      )}

      <div className="flex justify-end gap-3 mt-4">
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            disabled={isPending}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[var(--color-text-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
        <button 
          type="submit" 
          disabled={!outcome || isPending}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPending && (
            <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
          )}
          Enviar Reseña
        </button>
      </div>
    </form>
  );
}
