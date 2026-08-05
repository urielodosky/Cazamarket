"use client";

import React, { useState, useEffect, useRef } from 'react';
import './DatePicker.css';

interface DatePickerProps {
  value: string; // Formato DD/MM/AAAA
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function DatePicker({ value, onChange, placeholder = "DD/MM/AAAA", id, required }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear() - 18); // Default to 18 years ago
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If value changes and is valid, update calendar view
    const parts = value.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0]);
      const m = parseInt(parts[1]);
      const y = parseInt(parts[2]);
      if (y >= 1900 && y <= new Date().getFullYear() && m >= 1 && m <= 12) {
        setCurrentMonth(m - 1);
        setCurrentYear(y);
      }
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDayClick = (day: number) => {
    const formattedDay = day.toString().padStart(2, '0');
    const formattedMonth = (currentMonth + 1).toString().padStart(2, '0');
    onChange(`${formattedDay}/${formattedMonth}/${currentYear}`);
    setIsOpen(false);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const blanks = Array(firstDay).fill(null);
    const dayElements = Array.from({ length: days }, (_, i) => i + 1);
    
    // Check if selected
    let selectedDay = 0;
    let selectedMonth = -1;
    let selectedYear = 0;
    if (value) {
      const parts = value.split('/');
      if (parts.length === 3) {
        selectedDay = parseInt(parts[0]);
        selectedMonth = parseInt(parts[1]) - 1;
        selectedYear = parseInt(parts[2]);
      }
    }

    return (
      <div className="calendar-popup">
        <div className="calendar-header">
          <button type="button" onClick={prevMonth} className="cal-btn">&lt;</button>
          <div className="cal-title">
            <select 
              value={currentMonth} 
              onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
              className="cal-select"
            >
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select 
              value={currentYear} 
              onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              className="cal-select"
            >
              {Array.from({length: 120}, (_, i) => new Date().getFullYear() - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button type="button" onClick={nextMonth} className="cal-btn">&gt;</button>
        </div>
        <div className="calendar-grid">
          {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(d => (
            <div key={d} className="cal-day-name">{d}</div>
          ))}
          {blanks.map((_, i) => <div key={`blank-${i}`} className="cal-cell empty"></div>)}
          {dayElements.map(day => {
            const isSelected = day === selectedDay && currentMonth === selectedMonth && currentYear === selectedYear;
            return (
              <button 
                key={day} 
                type="button" 
                className={`cal-cell day ${isSelected ? 'selected' : ''}`}
                onClick={() => handleDayClick(day)}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    
    if (val.length >= 2) {
      let day = parseInt(val.slice(0, 2));
      if (day > 31) val = '31' + val.slice(2);
      if (day === 0) val = '01' + val.slice(2);
    }
    if (val.length >= 4) {
      let month = parseInt(val.slice(2, 4));
      if (month > 12) val = val.slice(0, 2) + '12' + val.slice(4);
      if (month === 0) val = val.slice(0, 2) + '01' + val.slice(4);
      
      let day = parseInt(val.slice(0, 2));
      if (month === 2) {
        let isLeapYear = false;
        if (val.length >= 8) {
          let year = parseInt(val.slice(4, 8));
          isLeapYear = ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
        }
        let maxDays = isLeapYear ? 29 : (val.length < 8 ? 29 : 28);
        if (day > maxDays) val = maxDays.toString() + val.slice(2);
      } else if ([4, 6, 9, 11].includes(month)) {
        if (day > 30) val = '30' + val.slice(2);
      }
    }
    
    let formatted = val;
    if (val.length > 2) formatted = val.slice(0, 2) + '/' + val.slice(2);
    if (val.length > 4) formatted = formatted.slice(0, 5) + '/' + val.slice(4, 8);
    
    if ((e.nativeEvent as InputEvent).inputType === 'deleteContentBackward') {
      if (value.endsWith('/')) {
         formatted = formatted.slice(0, -1);
      }
    }

    onChange(formatted);
  };

  return (
    <div className="custom-datepicker-wrapper" ref={wrapperRef}>
      <div className="input-with-icon">
        <input 
          type="text" 
          id={id} 
          placeholder={placeholder} 
          value={value}
          onChange={handleInputChange}
          maxLength={10}
          required={required}
          onFocus={() => setIsOpen(true)}
        />
        <button 
          type="button" 
          className="calendar-icon-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Abrir calendario"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        </button>
      </div>
      {isOpen && renderCalendar()}
    </div>
  );
}
