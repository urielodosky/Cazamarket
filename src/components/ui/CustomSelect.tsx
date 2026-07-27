'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useThemeColors } from '@/hooks/useThemeColors';
import './CustomSelect.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  id?: string;
  options: SelectOption[];
  value: string | string[];
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  multiple?: boolean;
}

export default function CustomSelect({ id, options, value, onChange, placeholder = 'Seleccionar...', disabled = false, searchable = false, multiple = false }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropUp, setDropUp] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const themeColors = useThemeColors();

  const selectedOption = !multiple ? options.find(opt => opt.value === value) : null;
  const displayValue = multiple 
    ? (Array.isArray(value) && value.length > 0 
        ? `${value.length} seleccionado${value.length > 1 ? 's' : ''}` 
        : placeholder)
    : (selectedOption ? selectedOption.label : (value && typeof value === 'string' && value.trim() !== '' ? value : placeholder));

  const isPlaceholder = !multiple && (!selectedOption && (!value || typeof value !== 'string' || value.trim() === ''));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const portalEl = document.getElementById(`select-portal-${id || 'dropdown'}`);
        if (portalEl && portalEl.contains(event.target as Node)) return;
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [id]);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldDropUp = spaceBelow < 250 && rect.top > spaceBelow;
      setDropUp(shouldDropUp);
      
      setCoords({
        top: shouldDropUp ? rect.top : rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleScrollOrResize = () => updateCoords();
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      
      const timer = setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);

      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredOptions = options.filter(opt => 
    normalize(opt.label).includes(normalize(searchTerm))
  );

  return (
    <div 
      className={`custom-select-container ${isOpen ? 'open-active' : ''} ${disabled ? 'disabled' : ''}`} 
      ref={containerRef} 
      id={id}
    >
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`} 
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={isPlaceholder ? 'placeholder-text' : ''} title={typeof displayValue === 'string' ? displayValue : ''}>{displayValue}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      
      {isOpen && !disabled && typeof window !== 'undefined' && createPortal(
        <div 
          id={`select-portal-${id || 'dropdown'}`}
          className={`custom-select-dropdown ${dropUp ? 'drop-up' : ''}`}
          style={{
            position: 'fixed',
            top: dropUp ? 'auto' : `${coords.top}px`,
            bottom: dropUp ? `${window.innerHeight - coords.top + 4}px` : 'auto',
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            minWidth: `${coords.width}px`,
            maxWidth: `${coords.width}px`,
            boxSizing: 'border-box',
            maxHeight: '320px',
            overflowY: 'auto',
            backgroundColor: themeColors.surfaceElevated,
            background: themeColors.surfaceElevated,
            border: `1px solid ${themeColors.borderSubtle2}`,
            boxShadow: themeColors.shadowHeavy,
            zIndex: 99999999,
            opacity: 1
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {(searchable || options.length > 5) && (
            <div className="custom-select-search-container">
              <input 
                type="text" 
                className="custom-select-search"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                ref={inputRef}
              />
            </div>
          )}
          <ul className="custom-select-options">
            {filteredOptions.length > 0 ? filteredOptions.map((opt) => (
              <li 
                key={opt.value} 
                title={opt.label}
                className={`custom-select-option ${(multiple ? (Array.isArray(value) && value.includes(opt.value)) : value === opt.value) ? 'selected' : ''}`}
                onClick={(e) => { 
                  if (multiple) {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (currentValues.includes(opt.value)) {
                      onChange(currentValues.filter(v => v !== opt.value));
                    } else {
                      onChange([...currentValues, opt.value]);
                    }
                  } else {
                    onChange(opt.value); 
                    setIsOpen(false); 
                    setSearchTerm(''); 
                  }
                }}
                style={{
                  ...(multiple ? { display: 'flex', alignItems: 'center', gap: '8px' } : {}),
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                }}
              >
                {multiple && (
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    background: themeColors.bgSubtle,
                    border: `1px solid ${themeColors.borderSubtle2}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s'
                  }}>
                    {Array.isArray(value) && value.includes(opt.value) && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                )}
                {opt.label.includes('•') ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '10px' }}>
                    <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 'bold', flexShrink: 0 }}>•</span>
                    <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{opt.label.replace(/^[\s•└]+/, '')}</span>
                  </div>
                ) : (
                  <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{opt.label}</span>
                )}
              </li>
            )) : (
              <li className="custom-select-option placeholder" style={{ fontStyle: 'italic', opacity: 0.6, cursor: 'default' }}>
                No se encontraron resultados
              </li>
            )}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}
