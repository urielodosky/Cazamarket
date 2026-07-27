'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Step = 1 | 2 | 2.5 | 3 | 4;

interface AdCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdCampaignModal({ isOpen, onClose }: AdCampaignModalProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [plan, setPlan] = useState<'semanal' | 'mensual' | null>(null);
  const [entityType, setEntityType] = useState<'negocio' | 'producto' | 'servicio' | null>(null);
  
  // Design state
  const [layout, setLayout] = useState<'full' | 'side' | 'none'>('full');
  const [imageSide, setImageSide] = useState<'left' | 'right'>('left');
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('bottom');
  const [adTitle, setAdTitle] = useState('');
  const [adDesc, setAdDesc] = useState('');
  const [adImage, setAdImage] = useState('');

  // Real data state
  const { isVendor, supabaseUser } = useAuth();
  const supabase = createClient();
  const [entities, setEntities] = useState<any[]>([]);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPlan(null);
      setEntityType(null);
      setLayout('full');
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSelectPlan = (selected: 'semanal' | 'mensual') => {
    setPlan(selected);
    setStep(2);
  };

  const handleSelectEntity = async (type: 'negocio' | 'producto' | 'servicio') => {
    setEntityType(type);
    
    if (type === 'negocio') {
      // Just go to step 3 for business directly
      setAdTitle('Mi Negocio');
      setAdDesc('Descripción de mi negocio.');
      setAdImage('https://picsum.photos/id/1018/800/400');
      setStep(3);
    } else {
      // Fetch products or services
      setStep(2.5);
      setIsLoadingEntities(true);
      setEntities([]);
      
      if (supabaseUser) {
        const table = type === 'producto' ? 'productos' : 'servicios';
        // Mock the fetch if table doesn't exist, but we assume it does based on CazaMarket structure
        const { data, error } = await supabase.from(table).select('*').eq('vendedor_id', supabaseUser.id);
        
        if (!error && data) {
          setEntities(data);
        }
      }
      setIsLoadingEntities(false);
    }
  };

  const handleEntityChoice = (entity: any) => {
    setSelectedEntityId(entity.id);
    setAdTitle(entity.titulo || entity.nombre || 'Sin Título');
    setAdDesc(entity.descripcion || 'Sin descripción');
    if (entity.imagenes && entity.imagenes.length > 0) {
      setAdImage(entity.imagenes[0]);
    } else {
      setAdImage('');
    }
    setStep(3);
  };

  const handlePublish = () => {
    setStep(4);
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div style={{
        background: '#1a1a1a',
        borderRadius: '16px',
        width: '100%',
        maxWidth: step === 3 ? '900px' : '500px',
        padding: '30px',
        position: 'relative',
        border: '1px solid #333',
        boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: '1.5rem',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          ×
        </button>

        {/* STEP 1: PLANES */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: '25px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 5px 0', color: 'white' }}>
                Planes de Publicidad
              </h2>
              <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0 }}>
                Selecciona la frecuencia para destacar tu anuncio.
              </p>
            </div>
            
            {!isVendor ? (
              <div style={{ background: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444', borderRadius: '12px', padding: '30px', textAlign: 'center' }}>
                <div style={{ 
                  width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255, 68, 68, 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px',
                  color: '#ff4444', fontSize: '2rem', fontWeight: 'bold', border: '2px solid #ff4444'
                }}>
                  !
                </div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#ff4444' }}>Se requiere cuenta de Negocio</h3>
                <p style={{ color: '#ddd', fontSize: '0.95rem', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                  Para poder crear y publicar anuncios en la plataforma, debes tener un negocio registrado y activo.
                </p>
                <button className="btn btn-primary" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px' }}>
                  Entendido
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ background: '#242424', border: '1px solid #444', borderRadius: '12px', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: 'white' }}>Aparición Semanal</h3>
                  <p style={{ color: '#aaa', fontSize: '0.9rem', margin: '0 0 15px 0' }}>Tu anuncio aparecerá destacado 1 vez por semana.</p>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '15px' }}>$20 USD</div>
                  <button className="btn btn-primary" onClick={() => handleSelectPlan('semanal')} style={{ width: '100%' }}>
                    Seleccionar (Gratis por ahora)
                  </button>
                </div>

                <div style={{ background: '#242424', border: '1px solid #444', borderRadius: '12px', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: 'white' }}>Aparición Mensual</h3>
                  <p style={{ color: '#aaa', fontSize: '0.9rem', margin: '0 0 15px 0' }}>Tu anuncio aparecerá destacado 1 vez por mes.</p>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white', marginBottom: '15px' }}>$5 USD</div>
                  <button className="btn btn-outline" onClick={() => handleSelectPlan('mensual')} style={{ width: '100%', background: '#333', border: 'none', color: 'white' }}>
                    Seleccionar (Gratis por ahora)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: ENTITY SELECTION */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: '25px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 5px 0', color: 'white' }}>
                Personalizar anuncio
              </h2>
              <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0 }}>
                ¿Qué deseas promocionar? (Debes tenerlo creado previamente).
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => handleSelectEntity('negocio')}
                style={{ padding: '20px', background: '#242424', border: '1px solid #444', borderRadius: '12px', color: 'white', textAlign: 'left', cursor: 'pointer' }}
              >
                <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>Promocionar Mi Negocio</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>Promociona el perfil completo de tu tienda.</p>
              </button>

              <button 
                onClick={() => handleSelectEntity('producto')}
                style={{ padding: '20px', background: '#242424', border: '1px solid #444', borderRadius: '12px', color: 'white', textAlign: 'left', cursor: 'pointer' }}
              >
                <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>Promocionar Un Producto</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>Destaca un producto específico de tu catálogo.</p>
              </button>

              <button 
                onClick={() => handleSelectEntity('servicio')}
                style={{ padding: '20px', background: '#242424', border: '1px solid #444', borderRadius: '12px', color: 'white', textAlign: 'left', cursor: 'pointer' }}
              >
                <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>Promocionar Un Servicio</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>Ofrece tus servicios guiados o actividades.</p>
              </button>
            </div>
            
            <button onClick={() => setStep(1)} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
              ← Volver
            </button>
          </div>
        )}

        {/* STEP 2.5: SELECT SPECIFIC ENTITY */}
        {step === 2.5 && (
          <div>
            <div style={{ marginBottom: '25px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 5px 0', color: 'white' }}>
                Selecciona tu {entityType === 'producto' ? 'Producto' : 'Servicio'}
              </h2>
              <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0 }}>
                Elige qué {entityType} específico deseas publicitar.
              </p>
            </div>
            
            {isLoadingEntities ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>
                Cargando...
              </div>
            ) : entities.length === 0 ? (
              <div style={{ background: 'rgba(255, 165, 0, 0.1)', border: '1px solid orange', borderRadius: '12px', padding: '30px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: 'orange' }}>No tienes {entityType}s publicados</h3>
                <p style={{ color: '#ddd', fontSize: '0.95rem', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                  Para crear un anuncio de {entityType}, primero debes publicar al menos uno en tu perfil de negocio.
                </p>
                <button onClick={() => setStep(2)} className="btn btn-outline" style={{ background: '#333', border: 'none', padding: '10px 20px', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
                  Volver atrás
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                {entities.map(ent => (
                  <div 
                    key={ent.id}
                    onClick={() => handleEntityChoice(ent)}
                    style={{ 
                      background: '#242424', border: '1px solid #444', borderRadius: '12px', padding: '15px', 
                      display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#444'}
                  >
                    <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: '#333', backgroundImage: ent.imagenes?.[0] ? `url(${ent.imagenes[0]})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '1rem' }}>{ent.titulo || ent.nombre}</h4>
                      <p style={{ margin: 0, color: '#aaa', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                        {ent.descripcion}
                      </p>
                    </div>
                  </div>
                ))}
                
                <button onClick={() => setStep(2)} style={{ width: '100%', padding: '12px', background: '#333', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', marginTop: '10px' }}>
                  Volver atrás
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: DESIGN */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom: '25px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 5px 0', color: 'white' }}>
                Diseño del Anuncio
              </h2>
              <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0 }}>
                Configura cómo se verá tu anuncio en pantalla.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
              {/* Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                <div>
                  <label style={{ display: 'block', color: '#aaa', marginBottom: '10px', fontSize: '0.9rem' }}>Distribución de Imagen</label>
                  <div style={{ display: 'flex', gap: '8px', background: '#242424', padding: '6px', borderRadius: '10px', border: '1px solid #444' }}>
                    <button 
                      onClick={() => setLayout('full')}
                      style={{ flex: 1, padding: '8px', border: 'none', background: layout === 'full' ? '#444' : 'transparent', color: layout === 'full' ? 'white' : '#aaa', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >Fondo</button>
                    <button 
                      onClick={() => setLayout('side')}
                      style={{ flex: 1, padding: '8px', border: 'none', background: layout === 'side' ? '#444' : 'transparent', color: layout === 'side' ? 'white' : '#aaa', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >Costado</button>
                    <button 
                      onClick={() => setLayout('none')}
                      style={{ flex: 1, padding: '8px', border: 'none', background: layout === 'none' ? '#444' : 'transparent', color: layout === 'none' ? 'white' : '#aaa', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >Sin foto</button>
                  </div>
                </div>

                {layout === 'side' && (
                  <div>
                    <label style={{ display: 'block', color: '#aaa', marginBottom: '10px', fontSize: '0.9rem' }}>Posición de la Imagen</label>
                    <div style={{ display: 'flex', gap: '8px', background: '#242424', padding: '6px', borderRadius: '10px', border: '1px solid #444' }}>
                      <button 
                        onClick={() => setImageSide('left')}
                        style={{ flex: 1, padding: '8px', border: 'none', background: imageSide === 'left' ? '#444' : 'transparent', color: imageSide === 'left' ? 'white' : '#aaa', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >Izquierda</button>
                      <button 
                        onClick={() => setImageSide('right')}
                        style={{ flex: 1, padding: '8px', border: 'none', background: imageSide === 'right' ? '#444' : 'transparent', color: imageSide === 'right' ? 'white' : '#aaa', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >Derecha</button>
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', color: '#aaa', marginBottom: '10px', fontSize: '0.9rem' }}>Alineación del Texto</label>
                  <div style={{ display: 'flex', gap: '8px', background: '#242424', padding: '6px', borderRadius: '10px', border: '1px solid #444' }}>
                    <button 
                      onClick={() => setTextPosition('top')}
                      style={{ flex: 1, padding: '8px', border: 'none', background: textPosition === 'top' ? '#444' : 'transparent', color: textPosition === 'top' ? 'white' : '#aaa', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >Arriba</button>
                    <button 
                      onClick={() => setTextPosition('center')}
                      style={{ flex: 1, padding: '8px', border: 'none', background: textPosition === 'center' ? '#444' : 'transparent', color: textPosition === 'center' ? 'white' : '#aaa', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >Centro</button>
                    <button 
                      onClick={() => setTextPosition('bottom')}
                      style={{ flex: 1, padding: '8px', border: 'none', background: textPosition === 'bottom' ? '#444' : 'transparent', color: textPosition === 'bottom' ? 'white' : '#aaa', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >Abajo</button>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Título Principal</label>
                    <span style={{ color: adTitle.length >= 40 ? '#ff4444' : '#666', fontSize: '0.8rem' }}>{adTitle.length}/40</span>
                  </div>
                  <textarea 
                    value={adTitle} 
                    onChange={(e) => {
                      if (e.target.value.split('\n').length <= 3) {
                        setAdTitle(e.target.value);
                      }
                    }}
                    maxLength={40}
                    rows={2}
                    style={{ width: '100%', padding: '10px', background: '#242424', border: '1px solid #444', color: 'white', borderRadius: '8px', resize: 'none' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Descripción (texto chico)</label>
                    <span style={{ color: adDesc.length >= 200 ? '#ff4444' : '#666', fontSize: '0.8rem' }}>{adDesc.length}/200</span>
                  </div>
                  <textarea 
                    value={adDesc} 
                    onChange={(e) => {
                      if (e.target.value.split('\n').length <= 6) {
                        setAdDesc(e.target.value);
                      }
                    }}
                    rows={4}
                    maxLength={200}
                    style={{ width: '100%', padding: '10px', background: '#242424', border: '1px solid #444', color: 'white', borderRadius: '8px', resize: 'none' }}
                  />
                </div>

                {layout !== 'none' && (
                  <div>
                    <label style={{ display: 'block', color: '#aaa', marginBottom: '5px', fontSize: '0.9rem' }}>Imagen del Anuncio</label>
                    <label 
                      style={{ 
                        display: 'block', 
                        width: '100%', 
                        padding: '12px', 
                        background: '#242424', 
                        border: '1px dashed #666', 
                        color: 'white', 
                        borderRadius: '8px', 
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span>Subir Imagen desde el dispositivo</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAdImage(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button onClick={() => setStep(2)} style={{ padding: '12px', background: '#333', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', flex: 1 }}>
                    Volver
                  </button>
                  <button onClick={handlePublish} className="btn btn-primary" style={{ padding: '12px', borderRadius: '8px', fontWeight: 'bold', flex: 2 }}>
                    Publicar Anuncio
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div>
                <label style={{ display: 'block', color: '#aaa', marginBottom: '10px', fontSize: '0.9rem' }}>Vista Previa en Vivo</label>
                
                <div style={{
                  position: 'relative',
                  background: '#242424',
                  border: '1px solid #444',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  height: '280px',
                  display: 'flex',
                  flexDirection: layout === 'side' 
                    ? (imageSide === 'left' ? 'row' : 'row-reverse') 
                    : 'column',
                  backgroundImage: layout === 'full' && adImage ? `url(${adImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}>
                  
                  {layout === 'full' && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', zIndex: 1
                    }} />
                  )}

                  {layout === 'side' && adImage && (
                    <div style={{ width: '40%', height: '100%', backgroundImage: `url(${adImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  )}

                  <div style={{ 
                    padding: '20px', 
                    position: 'relative', 
                    zIndex: 2, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: textPosition === 'top' ? 'flex-start' : textPosition === 'center' ? 'center' : 'flex-end',
                    flex: 1,
                    overflow: 'hidden'
                  }}>
                    <span style={{ 
                      background: 'var(--primary-color)', color: 'white', padding: '2px 8px', borderRadius: '10px', 
                      fontSize: '0.6rem', fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: '10px', flexShrink: 0 
                    }}>PATROCINADO</span>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
                      <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{adTitle || 'Sin título'}</h3>
                      <p style={{ margin: 0, color: '#ccc', fontSize: '0.85rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{adDesc || 'Sin descripción'}</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              color: 'white', fontSize: '2.5rem'
            }}>
              ✓
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 10px 0', color: 'white' }}>
              ¡Anuncio Creado!
            </h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>
              Tu anuncio se mostrará bajo el plan {plan === 'semanal' ? 'Semanal' : 'Mensual'}.
            </p>
            <button className="btn btn-primary" onClick={onClose} style={{ padding: '10px 30px', borderRadius: '8px' }}>
              Finalizar
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
