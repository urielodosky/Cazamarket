'use client';

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const getPageNumbers = () => {
    const pages = [];
    
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    
    if (currentPage >= totalPages - 3) {
      pages.push(1, '...');
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('...', totalPages);
    } else {
      pages.push(1, '...');
      pages.push(currentPage - 1, currentPage, currentPage + 1);
      pages.push('...', totalPages);
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
        disabled={currentPage === totalPages}
        className="pagination-btn pagination-arrow"
        aria-label="Página siguiente"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    </div>
  );
}
