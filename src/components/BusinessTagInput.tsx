'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

export type BusinessTag = {
  id?: string;
  name: string;
  avatar?: string;
  type: 'registered' | 'unregistered';
};

interface BusinessTagInputProps {
  label: string;
  tags: BusinessTag[];
  onChange: (tags: BusinessTag[]) => void;
  placeholder?: string;
}

export default function BusinessTagInput({ label, tags, onChange, placeholder }: BusinessTagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchProfiles = async () => {
      if (!inputValue.trim() || inputValue.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, store_name, full_name, avatar_url')
        .eq('role', 'negocio')
        .or(`store_name.ilike.%${inputValue}%,full_name.ilike.%${inputValue}%`)
        .limit(5);

      if (!error && data) {
        setSuggestions(data);
      }
      setIsSearching(false);
    };

    const debounce = setTimeout(searchProfiles, 300);
    return () => clearTimeout(debounce);
  }, [inputValue]);

  const addTag = (tag: BusinessTag) => {
    if (!tags.find(t => t.name.toLowerCase() === tag.name.toLowerCase())) {
      onChange([...tags, tag]);
    }
    setInputValue('');
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag({
          name: inputValue.trim(),
          type: 'unregistered'
        });
      }
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
      <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
        {label}
      </label>
      
      {/* Tag List */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: tags.length > 0 ? '8px' : '0' }}>
        {tags.map((tag, idx) => (
          <div key={idx} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: tag.type === 'registered' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(255,255,255,0.05)', 
            border: tag.type === 'registered' ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid var(--color-border)',
            padding: '4px 10px 4px 4px', 
            borderRadius: '20px',
            fontSize: '0.85rem'
          }}>
            {tag.avatar ? (
              <Image src={tag.avatar} alt={tag.name} width={24} height={24} style={{ borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
            )}
            <span style={{ color: 'var(--color-text-main)', fontWeight: tag.type === 'registered' ? 600 : 400 }}>{tag.name}</span>
            <button 
              type="button"
              onClick={() => removeTag(idx)}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      {/* Input */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Buscar o escribir nombre y presionar Enter...'}
          onFocus={() => setShowDropdown(true)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-base)',
            color: 'var(--color-text-main)',
            fontSize: '0.95rem'
          }}
        />

        {/* Dropdown Suggestions */}
        {showDropdown && inputValue.length > 0 && (
          <div style={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            right: 0, 
            background: 'var(--color-bg-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            marginTop: '4px',
            zIndex: 100,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            maxHeight: '250px',
            overflowY: 'auto'
          }}>
            {isSearching ? (
              <div style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                Buscando negocios...
              </div>
            ) : suggestions.length > 0 ? (
              <>
                {suggestions.map(s => (
                  <div 
                    key={s.id}
                    onClick={() => addTag({ id: s.id, name: s.store_name || s.full_name, avatar: s.avatar_url, type: 'registered' })}
                    style={{ 
                      padding: '12px 16px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--color-border)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Image src={s.avatar_url || '/placeholder.jpg'} alt={s.store_name || s.full_name} width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{s.store_name || s.full_name}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Negocio verificado</div>
                    </div>
                  </div>
                ))}
                {/* Option to add custom if it doesn't match perfectly */}
                <div 
                  onClick={() => addTag({ name: inputValue.trim(), type: 'unregistered' })}
                  style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer', 
                    color: 'var(--color-primary)',
                    fontSize: '0.9rem',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  + Agregar "{inputValue}" como no registrado
                </div>
              </>
            ) : (
              <div 
                onClick={() => addTag({ name: inputValue.trim(), type: 'unregistered' })}
                style={{ 
                  padding: '12px 16px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '8px',
                  color: 'var(--color-text-main)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
                Agregar "{inputValue}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
