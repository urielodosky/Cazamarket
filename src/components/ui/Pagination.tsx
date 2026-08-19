'use client';

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Ensure totalPages is at least 1 so it always shows page 1
  const safeTotalPages = Math.max(1, totalPages);

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < safeTotalPages) onPageChange(currentPage + 1);
  };

  const getPageNumbers = () => {
    const pages = [];
    
    if (safeTotalPages <= 6) {
      for (let i = 1; i <= safeTotalPages; i++) pages.push(i);
      return pages;
    }
    
    if (currentPage >= safeTotalPages - 3) {
      pages.push(1, '...');
      for (let i = safeTotalPages - 4; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('...', safeTotalPages);
    } else {
      pages.push(1, '...');
      pages.push(currentPage - 1, currentPage, currentPage + 1);
      pages.push('...', safeTotalPages);
    }
    
    return pages;
  };

  return (
    <div className="pagination-container">
      <button 
        onClick={handlePrevious} 
        disabled={currentPage === 1}
        className="pagination-btn pagination-arrow"
        aria-label="Página anterior"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      
      {getPageNumbers().map((page, idx) => (
        <React.Fragment key={idx}>
          {page === '...' ? (
            <span className="pagination-ellipsis">...</span>
          ) : (
            <button 
              onClick={() => onPageChange(page as number)}
              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}
      
      <button 
        onClick={handleNext} 
        disabled={currentPage === safeTotalPages}
        className="pagination-btn pagination-arrow"
        aria-label="Página siguiente"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    </div>
  );
}
