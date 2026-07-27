import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
      {/* Image Skeleton */}
      <div style={{ height: '200px', width: '100%', background: 'rgba(255, 255, 255, 0.05)', animation: 'skeleton-pulse 1.5s infinite' }}></div>
      
      {/* Content Skeleton */}
      <div className="card-content-fluid" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
        
        {/* Provider / Header info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ height: '36px', width: '36px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', animation: 'skeleton-pulse 1.5s infinite' }}></div>
          <div style={{ height: '16px', width: '40%', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', animation: 'skeleton-pulse 1.5s infinite' }}></div>
        </div>
        
        {/* Title */}
        <div style={{ height: '24px', width: '90%', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', animation: 'skeleton-pulse 1.5s infinite', marginTop: '4px' }}></div>
        <div style={{ height: '24px', width: '60%', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', animation: 'skeleton-pulse 1.5s infinite' }}></div>
        
        {/* Features / Text lines */}
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ height: '14px', width: '80%', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.03)', animation: 'skeleton-pulse 1.5s infinite' }}></div>
            <div style={{ height: '14px', width: '70%', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.03)', animation: 'skeleton-pulse 1.5s infinite' }}></div>
            <div style={{ height: '14px', width: '50%', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.03)', animation: 'skeleton-pulse 1.5s infinite' }}></div>
        </div>
        
        {/* Price & Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '40%' }}>
            <div style={{ height: '12px', width: '60%', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.03)', animation: 'skeleton-pulse 1.5s infinite' }}></div>
            <div style={{ height: '24px', width: '100%', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', animation: 'skeleton-pulse 1.5s infinite' }}></div>
          </div>
          <div style={{ height: '36px', width: '35%', borderRadius: 'var(--radius-full)', background: 'rgba(255, 255, 255, 0.08)', animation: 'skeleton-pulse 1.5s infinite' }}></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes skeleton-pulse {
          0% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
