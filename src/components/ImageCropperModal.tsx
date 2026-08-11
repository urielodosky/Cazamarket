import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImgUrl } from '@/utils/cropImage';

interface ImageCropperModalProps {
  imageSrc: string;
  aspect: number;
  onCropComplete: (croppedAreaPixels: any) => void;
  onCancel: () => void;
  title?: string;
}

export default function ImageCropperModal({ imageSrc, aspect, onCropComplete, onCancel, title = 'Ajustar Imagen' }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropCompleteInternal = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ color: '#fff', margin: 0, fontSize: '1.2rem' }}>{title}</h3>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div style={{ position: 'relative', flex: 1, backgroundColor: '#000' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={setZoom}
          style={{ containerStyle: { width: '100%', height: '100%' } }}
        />
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', background: 'var(--color-bg-base)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', maxWidth: '400px' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--color-primary)' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={onCancel} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', borderRadius: 'var(--radius-full)', fontWeight: 600, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button 
            onClick={() => onCropComplete(croppedAreaPixels)} 
            style={{ padding: '12px 24px', background: 'var(--color-primary)', border: 'none', color: '#fff', borderRadius: 'var(--radius-full)', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,115,0,0.3)' }}
          >
            Aplicar y Subir
          </button>
        </div>
      </div>
    </div>
  );
}
