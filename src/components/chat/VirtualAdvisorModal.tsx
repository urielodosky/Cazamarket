'use client';

import React, { useState, useEffect } from 'react';
import CustomSelect from '@/components/ui/CustomSelect';
import { useThemeColors } from '@/hooks/useThemeColors';

export type GotoOption = { value: string; label: string };

export type AdvisorOption = {
  id: string;
  label: string;
  responseType: 'text' | 'options' | 'file' | 'whatsapp' | 'goto';
  responseText: string;
  options?: AdvisorOption[];
  fileName?: string;
  whatsappText?: string;
  gotoId?: string;
};

export type AdvisorRule = {
  id: string;
  conditionType: 'exact' | 'keyword' | 'any';
  conditionValue: string;
  responseType: 'text' | 'options' | 'file' | 'whatsapp' | 'goto';
  responseText: string;
  options?: AdvisorOption[];
  fileName?: string;
  whatsappText?: string;
  gotoId?: string;
};

export type VirtualAdvisorData = {
  generalRules: AdvisorRule[];
  productRules: Record<string, AdvisorRule[]>; // key is productId
};

interface VirtualAdvisorModalProps {
  onClose: () => void;
  productId?: string;
}

function NestedOptionNode({ 
  opt, 
  index, 
  currentPath, 
  handleUpdateOption, 
  handleRemoveOption, 
  availableGotos, 
  onChangeNested 
}: any) {
  const themeColors = useThemeColors();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div style={{ background: themeColors.bgSubtle2, padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
      {/* Header that can be clicked to collapse */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            background: 'var(--color-primary)', color: '#fff', 
            padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' 
          }}>
            {currentPath}
          </span>
          <span style={{ color: themeColors.textWhite, fontWeight: 600 }}>{opt.label || 'Nueva Opción'}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); handleRemoveOption(index); }} 
            style={{ background: 'rgba(255,50,50,0.1)', color: '#ff4444', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Eliminar
          </button>
        </div>
      </div>

      {isExpanded && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${themeColors.borderSubtle2}` }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Texto del Botón (Opción)</label>
            <input 
              type="text" 
              value={opt.label}
              onChange={e => handleUpdateOption(index, { label: e.target.value })}
              placeholder="Ej: Ver Precios"
              style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>¿Qué responderá al tocar este botón?</label>
            <div style={{ marginBottom: '12px' }}>
              <CustomSelect 
                options={[
                  { value: 'text', label: 'Solo Texto' },
                  { value: 'options', label: 'Texto + Sub-Opciones' },
                  { value: 'file', label: 'Texto + Archivo Adjunto' },
                  { value: 'whatsapp', label: 'Derivar a WhatsApp' },
                  { value: 'goto', label: 'Volver a un Menú / Reenviar Opciones' }
                ]}
                value={opt.responseType} 
                onChange={(val: any) => handleUpdateOption(index, { responseType: val })}
              />
            </div>

            {opt.responseType === 'goto' ? (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>¿A cuáles opciones volver?</label>
                <CustomSelect 
                  options={availableGotos}
                  value={opt.gotoId || ''} 
                  onChange={(val: any) => handleUpdateOption(index, { gotoId: val })}
                />
              </div>
            ) : (
              <div style={{ marginBottom: '12px' }}>
                <textarea 
                  value={opt.responseText}
                  onChange={e => handleUpdateOption(index, { responseText: e.target.value })}
                  placeholder="Respuesta del bot..."
                  style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', minHeight: '60px', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                />
              </div>
            )}

            {opt.responseType === 'file' && (
              <div style={{ marginBottom: '12px' }}>
                <input 
                  type="text" 
                  value={opt.fileName || ''}
                  onChange={e => handleUpdateOption(index, { fileName: e.target.value })}
                  placeholder="Ej: catalogo.pdf"
                  style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
            )}

            {opt.responseType === 'whatsapp' && (
              <div style={{ marginBottom: '12px' }}>
                <textarea 
                  value={opt.whatsappText || ''}
                  onChange={e => handleUpdateOption(index, { whatsappText: e.target.value })}
                  placeholder="Texto pre-llenado que se enviará al WhatsApp del vendedor..."
                  style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', minHeight: '60px', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                />
              </div>
            )}

            {opt.responseType === 'options' && (
              <div style={{ paddingLeft: '16px', borderLeft: `2px solid ${themeColors.borderSubtle3}`, marginTop: '16px' }}>
                <NestedOptionsBuilder 
                  options={opt.options || []} 
                  onChange={onChangeNested} 
                  pathPrefix={`${currentPath}.`}
                  availableGotos={availableGotos}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NestedOptionsBuilder({ 
  options, 
  onChange,
  pathPrefix = "",
  availableGotos
}: { 
  options: AdvisorOption[], 
  onChange: (opts: AdvisorOption[]) => void,
  pathPrefix?: string,
  availableGotos: GotoOption[]
}) {
  
  const handleAddOption = () => {
    onChange([...options, {
      id: Date.now().toString() + Math.random().toString(),
      label: '',
      responseType: 'text',
      responseText: '',
    }]);
  };

  const handleUpdateOption = (index: number, updates: Partial<AdvisorOption>) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    onChange(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {options.map((opt, index) => (
        <NestedOptionNode
          key={opt.id}
          opt={opt}
          index={index}
          currentPath={`${pathPrefix}${index + 1}`}
          handleUpdateOption={handleUpdateOption}
          handleRemoveOption={handleRemoveOption}
          availableGotos={availableGotos}
          onChangeNested={(newNested: any) => handleUpdateOption(index, { options: newNested })}
        />
      ))}
      <button 
        onClick={handleAddOption}
        style={{ background: 'transparent', color: 'var(--color-primary)', border: '1px dashed var(--color-primary)', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', alignSelf: 'flex-start', marginTop: '8px' }}
      >
        + Agregar Opción
      </button>
    </div>
  );
}


export default function VirtualAdvisorModal({ onClose, productId }: VirtualAdvisorModalProps) {
  const themeColors = useThemeColors();
  const [rules, setRules] = useState<AdvisorRule[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [conditionType, setConditionType] = useState<'exact' | 'keyword' | 'any'>('exact');
  const [conditionValue, setConditionValue] = useState('');
  const [responseType, setResponseType] = useState<'text' | 'options' | 'file' | 'whatsapp' | 'goto'>('text');
  const [responseText, setResponseText] = useState('');
  const [options, setOptions] = useState<AdvisorOption[]>([]);
  const [fileName, setFileName] = useState('');
  const [whatsappText, setWhatsappText] = useState('');
  const [gotoId, setGotoId] = useState('');

  // Collect available gotos based on current root responseType and options tree
  const [availableGotos, setAvailableGotos] = useState<GotoOption[]>([]);

  useEffect(() => {
    const gotos: GotoOption[] = [];
    if (responseType === 'options') {
      gotos.push({ value: 'root', label: 'Menú Principal (Raíz)' });
      
      const traverse = (opts: AdvisorOption[], prefix: string = '') => {
        opts.forEach((opt, idx) => {
          const currentPath = `${prefix}${idx + 1}`;
          if (opt.responseType === 'options') {
            gotos.push({ value: opt.id, label: `Opciones de Opción ${currentPath} (${opt.label})` });
            if (opt.options) traverse(opt.options, `${currentPath}.`);
          }
        });
      };
      
      traverse(options);
    }
    setAvailableGotos(gotos);
  }, [responseType, options]);


  // Load rules on mount
  useEffect(() => {
    const saved = localStorage.getItem('cazamarket_virtual_advisor');
    if (saved) {
      try {
        const parsed: VirtualAdvisorData = JSON.parse(saved);
        if (productId) {
          setRules(parsed.productRules[productId] || []);
        } else {
          setRules(parsed.generalRules || []);
        }
      } catch (e) {}
    }
  }, [productId]);

  const saveRulesToStorage = (newRules: AdvisorRule[]) => {
    let data: VirtualAdvisorData = { generalRules: [], productRules: {} };
    const saved = localStorage.getItem('cazamarket_virtual_advisor');
    if (saved) {
      try { data = JSON.parse(saved); } catch (e) {}
    }

    if (productId) {
      data.productRules[productId] = newRules;
    } else {
      data.generalRules = newRules;
    }

    localStorage.setItem('cazamarket_virtual_advisor', JSON.stringify(data));
    setRules(newRules);
  };

  const handleAddRule = () => {
    if (conditionType !== 'any' && !conditionValue.trim()) {
      alert('Ingresa el valor de la condición (palabra o mensaje exacto).');
      return;
    }
    if (responseType !== 'goto' && !responseText.trim()) {
      alert('Ingresa el texto de respuesta.');
      return;
    }
    if (responseType === 'goto' && !gotoId) {
      alert('Selecciona a qué opciones volver.');
      return;
    }
    
    // Quick validation of the tree
    const validateOptions = (opts: AdvisorOption[]): boolean => {
      for (const opt of opts) {
        if (!opt.label.trim()) return false;
        if (opt.responseType !== 'goto' && !opt.responseText.trim()) return false;
        if (opt.responseType === 'goto' && !opt.gotoId) return false;
        if (opt.responseType === 'options' && opt.options) {
          if (!validateOptions(opt.options)) return false;
        }
      }
      return true;
    };

    if (responseType === 'options' && (!options.length || !validateOptions(options))) {
      alert('Por favor completa todos los textos y campos requeridos en las opciones.');
      return;
    }

    const newRule: AdvisorRule = {
      id: Date.now().toString(),
      conditionType,
      conditionValue: conditionValue.trim().toLowerCase(),
      responseType,
      responseText: responseText.trim(),
      options: responseType === 'options' ? options : undefined,
      fileName: responseType === 'file' ? (fileName.trim() || 'documento.pdf') : undefined,
      whatsappText: responseType === 'whatsapp' ? (whatsappText.trim() || 'Hola, me gustaría más información.') : undefined,
      gotoId: responseType === 'goto' ? gotoId : undefined
    };

    const newRules = [...rules, newRule];
    saveRulesToStorage(newRules);
    
    // Reset form
    setIsAdding(false);
    setConditionType('exact');
    setConditionValue('');
    setResponseType('text');
    setResponseText('');
    setOptions([]);
    setFileName('');
    setWhatsappText('');
    setGotoId('');
  };

  const handleDeleteRule = (id: string) => {
    const newRules = rules.filter(r => r.id !== id);
    saveRulesToStorage(newRules);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '1100px', maxHeight: '90vh',
        borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', border: '1px solid var(--color-border)',
        background: themeColors.surfaceElevated, fontFamily: 'var(--font-inter), sans-serif'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'var(--color-primary)' }}>
            Configurar Asesor Virtual {productId ? `(Personalizado)` : `(General)`}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: themeColors.textWhite, cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {!isAdding ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Reglas Activas</h3>
                <button 
                  onClick={() => setIsAdding(true)}
                  style={{ background: 'var(--color-primary)', color: themeColors.textWhite, border: 'none', padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}
                >
                  + Nueva Regla
                </button>
              </div>

              {rules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', background: themeColors.bgSubtle2, borderRadius: 'var(--radius-md)' }}>
                  No tienes ninguna regla configurada.{productId ? ' Este asesor responderá solo a consultas sobre este producto.' : ' Este asesor responderá a todos los mensajes de forma predeterminada.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {rules.map(rule => (
                    <div key={rule.id} style={{ background: themeColors.bgSubtle2, padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>SI RECIBE </span>
                          <span style={{ color: themeColors.textWhite }}>
                            {rule.conditionType === 'any' ? 'Cualquier mensaje' : rule.conditionType === 'keyword' ? `Palabra clave: "${rule.conditionValue}"` : `Mensaje exacto: "${rule.conditionValue}"`}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ENTONCES </span>
                          <span style={{ color: 'var(--color-text-muted)' }}>
                            {rule.responseType === 'goto' ? (
                              <span>Volver a menú {rule.gotoId === 'root' ? 'Principal' : rule.gotoId}</span>
                            ) : (
                              <>
                                Responder: "{rule.responseText}"
                                {rule.responseType === 'options' && rule.options && ` [${rule.options.length} opciones configuradas]`}
                                {rule.responseType === 'file' && ` [Archivo: ${rule.fileName}]`}
                                {rule.responseType === 'whatsapp' && ` [Derivar a WhatsApp]`}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteRule(rule.id)} style={{ background: 'rgba(255,50,50,0.1)', color: '#ff4444', border: 'none', padding: '8px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', height: 'fit-content' }}>
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ background: themeColors.bgSubtle2, padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: '0 0 20px 0', color: 'var(--color-text-main)' }}>Crear Nueva Regla</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Condición de Activación</label>
                  <CustomSelect 
                    options={[
                      { value: 'exact', label: 'Mensaje exacto (ej: "Precio")' },
                      { value: 'keyword', label: 'Contiene palabra clave (ej: "envío")' },
                      { value: 'any', label: 'Cualquier mensaje (Respuesta por defecto)' }
                    ]}
                    value={conditionType} 
                    onChange={(val: any) => setConditionType(val)}
                  />
                </div>

                {conditionType !== 'any' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Valor de la Condición</label>
                    <input 
                      type="text" 
                      value={conditionValue}
                      onChange={e => setConditionValue(e.target.value)}
                      placeholder={conditionType === 'exact' ? "Escribe el mensaje exacto" : "Escribe la palabra clave"}
                      style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                )}

                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '8px 0' }} />

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Tipo de Respuesta Principal</label>
                  <CustomSelect 
                    options={[
                      { value: 'text', label: 'Solo Texto' },
                      { value: 'options', label: 'Texto + Opciones (Botones)' },
                      { value: 'file', label: 'Texto + Archivo Adjunto' },
                      { value: 'whatsapp', label: 'Derivar a WhatsApp' },
                      { value: 'goto', label: 'Volver a un Menú / Reenviar Opciones' }
                    ]}
                    value={responseType} 
                    onChange={(val: any) => setResponseType(val)}
                  />
                </div>

                {responseType === 'goto' ? (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>¿A cuáles opciones volver?</label>
                    <CustomSelect 
                      options={availableGotos}
                      value={gotoId} 
                      onChange={(val: any) => setGotoId(val)}
                    />
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Texto de Respuesta</label>
                    <textarea 
                      value={responseText}
                      onChange={e => setResponseText(e.target.value)}
                      placeholder="Lo que el bot responderá inicialmente..."
                      style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', minHeight: '80px', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                )}

                {responseType === 'options' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Opciones Interactivas</label>
                    <NestedOptionsBuilder options={options} onChange={setOptions} availableGotos={availableGotos} />
                  </div>
                )}

                {responseType === 'file' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Nombre del Archivo (Simulado)</label>
                    <input 
                      type="text" 
                      value={fileName}
                      onChange={e => setFileName(e.target.value)}
                      placeholder="Ej: catalogo.pdf"
                      style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                )}

                {responseType === 'whatsapp' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Mensaje pre-llenado de WhatsApp</label>
                    <textarea 
                      value={whatsappText}
                      onChange={e => setWhatsappText(e.target.value)}
                      placeholder="Ej: Hola, quiero terminar la compra del producto..."
                      style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', minHeight: '80px', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button 
                    onClick={handleAddRule}
                    style={{ flex: 1, background: 'var(--color-primary)', color: themeColors.textWhite, border: 'none', padding: '12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Guardar Regla
                  </button>
                  <button 
                    onClick={() => setIsAdding(false)}
                    style={{ flex: 1, background: themeColors.bgSubtle3, color: themeColors.textWhite, border: 'none', padding: '12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Cancelar
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
