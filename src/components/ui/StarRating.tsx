'use client';

import React, { useState } from 'react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  isInteractive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 24, 
  isInteractive = false,
  onChange
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleMouseEnter = (index: number) => {
    if (isInteractive) {
      setHoverRating(index);
    }
  };

  const handleMouseLeave = () => {
    if (isInteractive) {
      setHoverRating(null);
    }
  };

  const handleClick = (index: number) => {
    if (isInteractive && onChange) {
      onChange(index);
    }
  };

  const currentRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div 
      className={`flex items-center gap-1 ${isInteractive ? 'cursor-pointer' : ''}`}
      onMouseLeave={handleMouseLeave}
      role={isInteractive ? 'radiogroup' : 'img'}
      aria-label={isInteractive ? 'Calificación' : `Calificación de ${rating} sobre ${maxRating} estrellas`}
    >
      {[...Array(maxRating)].map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= currentRating;

        return (
          <svg
            key={starValue}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={isFilled ? 'var(--color-primary, #FFD700)' : 'none'}
            stroke={isFilled ? 'var(--color-primary, #FFD700)' : 'var(--color-text-muted, #888)'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ 
              transition: 'all 0.2s ease', 
              transform: isInteractive && hoverRating === starValue ? 'scale(1.15)' : 'scale(1)' 
            }}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            role={isInteractive ? 'radio' : 'presentation'}
            aria-checked={isFilled}
            tabIndex={isInteractive ? 0 : -1}
            onKeyDown={(e) => {
              if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleClick(starValue);
              }
            }}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      })}
    </div>
  );
}
