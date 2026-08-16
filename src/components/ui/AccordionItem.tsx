'use client';

import React, { useState } from 'react';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
}

export default function AccordionItem({ title, children }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{
      marginBottom: '16px',
      borderRadius: 'var(--radius-lg)',
      background: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      overflow: 'hidden'
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-main)',
          fontSize: '1.1rem',
          fontWeight: 600,
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <span>{title}</span>
        <svg 
          width="20" height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            color: 'var(--color-primary)'
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      
      {isOpen && (
        <div style={{
          padding: '0 20px 20px 20px',
          color: 'var(--color-text-muted)',
          fontSize: '0.95rem',
          lineHeight: 1.6
        }}>
          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '16px' }}></div>
          {children}
        </div>
      )}
    </div>
  );
}
