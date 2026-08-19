'use client';

import React, { useState, useTransition } from 'react';
import StarRating from '../ui/StarRating';
import { submitSellerReviewAction } from '@/app/actions/reviewActions';
import { toast } from 'react-hot-toast';

interface SellerReviewFormProps {
  interactionId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function SellerReviewForm({ interactionId, onSuccess, onCancel }: SellerReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await submitSellerReviewAction(interactionId, rating, comment);
      
      if (result.success) {
        toast.success('¡Reseña enviada con éxito! La interacción ya es pública.');
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.error || 'Error al enviar la reseña');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-4 sm:p-6 bg-[rgba(255,255,255,0.03)] border border-[var(--color-border)] rounded-xl">
      <div className="flex flex-col gap-2 items-center text-center">
        <label className="text-sm font-semibold text-[var(--color-text-main)]">
          Calificación general
        </label>
        <StarRating 
          rating={rating} 
          maxRating={5} 
          size={36} 
          isInteractive={true} 
          onChange={setRating} 
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="comment" className="text-sm font-semibold text-[var(--color-text-main)]">
          Comentario (opcional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Escribe algo sobre la experiencia con este comprador..."
          rows={4}
          maxLength={500}
          className="w-full bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
        />
        <span className="text-xs text-[var(--color-text-muted)] self-end">
          {comment.length}/500
        </span>
      </div>

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
          disabled={isPending}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending && (
            <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
          )}
          Calificar y Revelar
        </button>
      </div>
    </form>
  );
}
