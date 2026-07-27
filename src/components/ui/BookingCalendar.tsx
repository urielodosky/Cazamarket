'use client';

import React, { useState } from 'react';

interface BookingCalendarProps {
  mode?: 'client' | 'admin';
  value: string | string[]; // string for client (single), string[] for client(multiple) or admin
  onChange: (val: any) => void;
  blockedDates?: string[];
  allowMultiple?: boolean;
}

export default function BookingCalendar({ mode = 'client', value, onChange, blockedDates = [], allowMultiple = false }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday...

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const cells = [];
  
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= daysInMonth; i++) {
    const cellDate = new Date(year, month, i);
    const dateString = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
    
    const isPast = cellDate < today;
    const isBlocked = blockedDates.includes(dateString);
    
    let isSelected = false;
    if (mode === 'admin' || allowMultiple) {
      isSelected = Array.isArray(value) && value.includes(dateString);
    } else {
      isSelected = value === dateString || (Array.isArray(value) && value.length > 0 && value[0] === dateString);
    }

    const isDisabled = mode === 'client' && (isPast || isBlocked);
    const isAdminDisabled = mode === 'admin' && isPast;

    const handleClick = () => {
      if (isDisabled || isAdminDisabled) return;

      if (mode === 'admin' || allowMultiple) {
        const arr = Array.isArray(value) ? value : [];
        if (arr.includes(dateString)) {
          onChange(arr.filter(d => d !== dateString));
        } else {
          onChange([...arr, dateString]);
        }
      } else {
        onChange(dateString);
      }
    };

    cells.push(
      <div 
        key={dateString} 
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '42px',
          width: '42px',
          margin: '0 auto',
          borderRadius: '50%',
          cursor: (isDisabled || isAdminDisabled) ? 'not-allowed' : 'pointer',
          background: isSelected 
            ? (mode === 'admin' ? 'rgba(239, 68, 68, 0.15)' : 'linear-gradient(135deg, var(--color-primary), #ff9500)') 
            : 'transparent',
          border: isSelected && mode === 'admin' 
            ? `1.5px solid #ef4444` 
            : '1.5px solid transparent',
          color: (isDisabled || isAdminDisabled) 
            ? 'rgba(255, 255, 255, 0.15)' 
            : (isSelected ? '#fff' : 'rgba(255, 255, 255, 0.85)'),
          fontWeight: isSelected ? 700 : 500,
          fontSize: '0.95rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          boxShadow: isSelected && mode !== 'admin' ? '0 4px 12px rgba(255, 115, 0, 0.4)' : 'none',
          transform: isSelected && mode !== 'admin' ? 'scale(1.05)' : 'scale(1)'
        }}
        onMouseEnter={(e) => {
          if (!isDisabled && !isAdminDisabled && !isSelected) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled && !isAdminDisabled && !isSelected) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        {i}
        {mode === 'client' && isBlocked && (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.8 }}>
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '24px',
      padding: '24px',
      width: '100%',
      maxWidth: '380px',
      margin: '0 auto',
      fontFamily: 'var(--font-primary)',
      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)'
    }}>
      {/* Cabecera del mes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button 
          onClick={prevMonth}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', cursor: 'pointer', padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>
          {monthNames[month]} <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>{year}</span>
        </div>
        <button 
          onClick={nextMonth}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', cursor: 'pointer', padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      {/* Días de la semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {dayNames.map(day => (
          <div key={day} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {day}
          </div>
        ))}
      </div>

      {/* Cuadrícula del mes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {cells}
      </div>
      
      {mode === 'admin' && (
        <div style={{ marginTop: '24px', padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }}></div>
          Haz clic en las fechas para bloquearlas
        </div>
      )}
    </div>
  );
}
