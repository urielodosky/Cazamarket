'use client';

import React, { useState, useEffect } from 'react';
import CustomSelect from '@/components/ui/CustomSelect';
import { useThemeColors } from '@/hooks/useThemeColors';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  conditionType: 'exact' | 'keyword' | 'always';
  conditionValue: string;
  responseType: 'text' | 'options' | 'file' | 'whatsapp' | 'goto';
  responseText: string;
  reactivationText?: string;
  options?: AdvisorOption[];
  fileName?: string;
  whatsappText?: string;
  gotoId?: string;
  cooldownHours?: number;
  fireOnce?: boolean;
};

interface VirtualAdvisorModalProps {
  onClose: () => void;
  productId?: string;
}

// Reusable nested option builder...
function NestedOptionNode({ 
  opt, index, currentPath, handleUpdateOption, handleRemoveOption, availableGotos, onChangeNested 
}: any) {
  const themeColors = useThemeColors();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div style={{ background: themeColors.bgSubtle2, padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: 'var(--color-primary)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>{currentPath}</span>
          <span style={{ color: themeColors.textWhite, fontWeight: 600 }}>{opt.label || 'Nueva Opción'}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>{isExpanded ? '▼' : '▶'}</span>
          <button onClick={(e) => { e.stopPropagation(); handleRemoveOption(index); }} style={{ background: 'rgba(255,50,50,0.1)', color: '#ff4444', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
        </div>
      </div>

      {isExpanded && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${themeColors.borderSubtle2}` }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Texto del Botón (Opción)</label>
            <input type="text" value={opt.label} onChange={e => handleUpdateOption(index, { label: e.target.value })} placeholder="Ej: Ver Precios" style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>¿Qué responderá al tocar este botón?</label>
            <div style={{ marginBottom: '12px' }}>
              <CustomSelect options={[{ value: 'text', label: 'Solo Texto' }, { value: 'options', label: 'Texto + Sub-Opciones' }, { value: 'file', label: 'Texto + Archivo Adjunto' }, { value: 'whatsapp', label: 'Derivar a WhatsApp' }, { value: 'goto', label: 'Volver a un Menú / Reenviar Opciones' }]} value={opt.responseType} onChange={(val: any) => handleUpdateOption(index, { responseType: val })} />
            </div>

            {opt.responseType === 'goto' ? (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>¿A cuáles opciones volver?</label>
                <CustomSelect options={availableGotos} value={opt.gotoId || ''} onChange={(val: any) => handleUpdateOption(index, { gotoId: val })} />
              </div>
            ) : (
              <div style={{ marginBottom: '12px' }}>
                <textarea value={opt.responseText} onChange={e => handleUpdateOption(index, { responseText: e.target.value })} placeholder="Respuesta del bot..." style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', minHeight: '60px', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }} />
              </div>
            )}

            {opt.responseType === 'file' && (
              <div style={{ marginBottom: '12px' }}>
                <input type="text" value={opt.fileName || ''} onChange={e => handleUpdateOption(index, { fileName: e.target.value })} placeholder="Ej: catalogo.pdf" style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }} />
              </div>
            )}

            {opt.responseType === 'whatsapp' && (
              <div style={{ marginBottom: '12px' }}>
                <textarea value={opt.whatsappText || ''} onChange={e => handleUpdateOption(index, { whatsappText: e.target.value })} placeholder="Texto pre-llenado que se enviará al WhatsApp del vendedor..." style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', minHeight: '60px', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }} />
              </div>
            )}

            {opt.responseType === 'options' && (
              <div style={{ paddingLeft: '16px', borderLeft: `2px solid ${themeColors.borderSubtle3}`, marginTop: '16px' }}>
                <NestedOptionsBuilder options={opt.options || []} onChange={onChangeNested} pathPrefix={`${currentPath}.`} availableGotos={availableGotos} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NestedOptionsBuilder({ options, onChange, pathPrefix = "", availableGotos }: any) {
  const handleAddOption = () => onChange([...options, { id: Date.now().toString() + Math.random().toString(), label: '', responseType: 'text', responseText: '' }]);
  const handleUpdateOption = (index: number, updates: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    onChange(newOptions);
  };
  const handleRemoveOption = (index: number) => onChange(options.filter((_: any, i: number) => i !== index));

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {options.map((opt: any, index: number) => (
        <NestedOptionNode key={opt.id} opt={opt} index={index} currentPath={`${pathPrefix}${index + 1}`} handleUpdateOption={handleUpdateOption} handleRemoveOption={handleRemoveOption} availableGotos={availableGotos} onChangeNested={(newNested: any) => handleUpdateOption(index, { options: newNested })} />
      ))}
      <button onClick={handleAddOption} style={{ background: 'transparent', color: 'var(--color-primary)', border: '1px dashed var(--color-primary)', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', alignSelf: 'flex-start', marginTop: '8px' }}>+ Agregar Opción</button>
    </div>
  );
}

export default function VirtualAdvisorModal({ onClose, productId }: VirtualAdvisorModalProps) {
  const themeColors = useThemeColors();
  const { supabaseUser } = useAuth();
  const supabase = createClient();
  
  const [rules, setRules] = useState<AdvisorRule[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Settings state
  const [inheritGeneral, setInheritGeneral] = useState(true);
  const [retargetingDays, setRetargetingDays] = useState<number | ''>('');
  const [retargetingMessage, setRetargetingMessage] = useState('');
  
  // Form State
  const [conditionType, setConditionType] = useState<'exact' | 'keyword' | 'always'>('exact');
  const [conditionValue, setConditionValue] = useState('');
  const [responseType, setResponseType] = useState<'text' | 'options' | 'file' | 'whatsapp' | 'goto'>('text');
  const [responseText, setResponseText] = useState('');
  const [reactivationText, setReactivationText] = useState('');
  const [options, setOptions] = useState<AdvisorOption[]>([]);
  const [fileName, setFileName] = useState('');
  const [whatsappText, setWhatsappText] = useState('');
  const [gotoId, setGotoId] = useState('');
  const [cooldownHours, setCooldownHours] = useState<number | ''>('');
  const [fireOnce, setFireOnce] = useState(false);

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

  useEffect(() => {
    if (!supabaseUser) return;
    const fetchData = async () => {
      setIsLoading(true);
      // Fetch Settings
      let query = supabase.from('bot_settings').select('*').eq('seller_id', supabaseUser.id);
      if (productId) query = query.eq('product_id', productId);
      else query = query.is('product_id', null);
      
      const { data: settingsData } = await query.maybeSingle();
      if (settingsData) {
        setInheritGeneral(settingsData.inherit_general);
        setRetargetingDays(settingsData.retargeting_days || '');
        setRetargetingMessage(settingsData.retargeting_message || '');
      }

      // Fetch Rules
      let ruleQuery = supabase.from('bot_rules').select('*').eq('seller_id', supabaseUser.id);
      if (productId) ruleQuery = ruleQuery.eq('product_id', productId);
      else ruleQuery = ruleQuery.is('product_id', null);

      const { data: rulesData } = await ruleQuery;
      if (rulesData) {
        const mapped: AdvisorRule[] = rulesData.map((r: any) => ({
          id: r.id,
          conditionType: r.condition_type,
          conditionValue: r.condition_value || '',
          responseType: r.response_type,
          responseText: r.response_text || '',
          reactivationText: r.reactivation_text || '',
          options: r.options || undefined,
          fileName: r.file_name || '',
          whatsappText: r.whatsapp_text || '',
          gotoId: r.goto_id || '',
          cooldownHours: r.cooldown_hours || undefined,
          fireOnce: r.fire_once || false
        }));
        setRules(mapped);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [productId, supabaseUser, supabase]);

  const saveSettings = async () => {
    if (!supabaseUser) return;
    try {
      const payload = {
        seller_id: supabaseUser.id,
        product_id: productId || null,
        inherit_general: inheritGeneral,
        retargeting_days: retargetingDays === '' ? null : retargetingDays,
        retargeting_message: retargetingMessage || null
      };
      await supabase.from('bot_settings').upsert(payload, { onConflict: 'seller_id,product_id' });
      alert('Configuración global guardada.');
    } catch(e) { console.error(e); }
  };

  const handleAddRule = async () => {
    if (conditionType !== 'always' && !conditionValue.trim()) { alert('Ingresa el valor de la condición.'); return; }
    if (responseType !== 'goto' && !responseText.trim()) { alert('Ingresa el texto de respuesta.'); return; }
    if (responseType === 'goto' && !gotoId) { alert('Selecciona a qué opciones volver.'); return; }
    
    if (conditionType === 'always' && !fireOnce && cooldownHours === '') {
      alert('Para reglas de Activación Siempre, debes definir un Cooldown (horas) o marcar "Disparar una sola vez".');
      return;
    }

    if (!supabaseUser) return;

    const payload = {
      seller_id: supabaseUser.id,
      product_id: productId || null,
      condition_type: conditionType,
      condition_value: conditionType === 'always' ? null : conditionValue.trim().toLowerCase(),
      response_type: responseType,
      response_text: responseText.trim(),
      reactivation_text: reactivationText.trim() || null,
      options: responseType === 'options' ? options : null,
      file_name: responseType === 'file' ? (fileName.trim() || 'documento.pdf') : null,
      whatsapp_text: responseType === 'whatsapp' ? (whatsappText.trim() || 'Hola') : null,
      goto_id: responseType === 'goto' ? gotoId : null,
      cooldown_hours: conditionType === 'always' && !fireOnce ? cooldownHours : null,
      fire_once: conditionType === 'always' ? fireOnce : false
    };

    const { data, error } = await supabase.from('bot_rules').insert(payload).select().single();
    
    if (data) {
      setRules([...rules, {
        id: data.id,
        conditionType: data.condition_type,
        conditionValue: data.condition_value || '',
        responseType: data.response_type,
        responseText: data.response_text,
        reactivationText: data.reactivation_text || '',
        options: data.options,
        fileName: data.file_name,
        whatsappText: data.whatsapp_text,
        gotoId: data.goto_id,
        cooldownHours: data.cooldown_hours,
        fireOnce: data.fire_once
      }]);
    }

    setIsAdding(false);
    // Reset
    setConditionType('exact'); setConditionValue(''); setResponseType('text');
    setResponseText(''); setReactivationText(''); setOptions([]); setFileName(''); setWhatsappText(''); setGotoId('');
    setCooldownHours(''); setFireOnce(false);
  };

  const handleDeleteRule = async (id: string) => {
    await supabase.from('bot_rules').delete().eq('id', id);
    setRules(rules.filter(r => r.id !== id));
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '1100px', maxHeight: '90vh', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--color-border)', background: themeColors.surfaceElevated, fontFamily: 'var(--font-inter), sans-serif' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'var(--color-primary)' }}>Configurar Asesor Virtual {productId ? `(Personalizado)` : `(General)`}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: themeColors.textWhite, cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {isLoading ? (
            <p>Cargando configuración...</p>
          ) : (
            <>
              {/* GLOBAL SETTINGS CARD */}
              <div style={{ background: themeColors.bgSubtle2, padding: '20px', borderRadius: 'var(--radius-md)', border: `1px solid var(--color-primary)` }}>
                <h3 style={{ margin: '0 0 16px 0', color: 'var(--color-text-main)' }}>Ajustes Globales del Bot</h3>
                
                {productId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <input type="checkbox" id="inheritGen" checked={inheritGeneral} onChange={e => setInheritGeneral(e.target.checked)} />
                    <label htmlFor="inheritGen" style={{ color: themeColors.textWhite }}>Heredar también reglas del Bot General (Si no coincide ninguna específica)</label>
                  </div>
                )}
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Retargeting Automático (Horas de Inactividad)</label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px', lineHeight: 1.4 }}>Si el cliente deja de hablar durante X horas, el bot enviará automáticamente este mensaje. ¡Perfecto para revivir leads caídos!</p>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <input type="number" min="1" value={retargetingDays} onChange={e => setRetargetingDays(Number(e.target.value) || '')} placeholder="Horas (Ej: 24)" style={{ width: '120px', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', outline: 'none' }} />
                    <input type="text" value={retargetingMessage} onChange={e => setRetargetingMessage(e.target.value)} placeholder="Ej: ¡Hola! ¿Aún sigues interesado en nuestros productos?" style={{ flex: '1 1 200px', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', outline: 'none' }} />
                  </div>
                </div>

                <button onClick={saveSettings} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Guardar Ajustes Globales</button>
              </div>

              {!isAdding ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Reglas Activas</h3>
                    <button onClick={() => setIsAdding(true)} style={{ background: 'var(--color-primary)', color: themeColors.textWhite, border: 'none', padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>+ Nueva Regla</button>
                  </div>

                  {rules.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', background: themeColors.bgSubtle2, borderRadius: 'var(--radius-md)' }}>No tienes reglas.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {rules.map(rule => (
                        <div key={rule.id} style={{ background: themeColors.bgSubtle2, padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>SI RECIBE </span>
                              <span style={{ color: themeColors.textWhite }}>
                                {rule.conditionType === 'always' ? 'Cualquier mensaje inicial (Activar siempre)' : rule.conditionType === 'keyword' ? `Palabra clave: "${rule.conditionValue}"` : `Mensaje exacto: "${rule.conditionValue}"`}
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
                                    {rule.options && ` [${rule.options.length} opciones]`}{rule.responseType === 'whatsapp' && ` [Derivar a WA]`}
                                  </>
                                )}
                              </span>
                            </div>
                            {rule.conditionType === 'always' && (
                              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#ff9900' }}>
                                <i>{rule.fireOnce ? '⚠️ Se dispara SOLO UNA VEZ' : `⏱️ Cooldown de ${rule.cooldownHours}hs`}</i>
                                {rule.reactivationText && <div style={{ marginTop: '4px' }}><b>Al reactivarse:</b> "{rule.reactivationText}"</div>}
                              </div>
                            )}
                          </div>
                          <button onClick={() => handleDeleteRule(rule.id)} style={{ background: 'rgba(255,50,50,0.1)', color: '#ff4444', border: 'none', padding: '8px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', height: 'fit-content' }}>Eliminar</button>
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
                        options={[{ value: 'exact', label: 'Mensaje exacto (ej: "Precio")' }, { value: 'keyword', label: 'Contiene palabra clave (ej: "envío")' }, { value: 'always', label: 'Activar siempre (Bienvenida/Menú)' }]}
                        value={conditionType} onChange={(val: any) => setConditionType(val)}
                      />
                    </div>

                    {conditionType !== 'always' && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Valor de la Condición</label>
                        <input type="text" value={conditionValue} onChange={e => setConditionValue(e.target.value)} style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', outline: 'none' }} />
                      </div>
                    )}

                    {conditionType === 'always' && (
                      <div style={{ background: 'rgba(255, 115, 0, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 115, 0, 0.2)' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-primary)' }}>Configuración de Reactivación y Cooldown</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                          <input type="checkbox" id="fireOnceCheck" checked={fireOnce} onChange={e => setFireOnce(e.target.checked)} />
                          <label htmlFor="fireOnceCheck" style={{ color: themeColors.textWhite }}>Disparar SOLO una vez y no volver a molestar</label>
                        </div>
                        
                        {!fireOnce && (
                          <>
                            <div style={{ marginBottom: '16px' }}>
                              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Horas de Cooldown antes de reactivarse</label>
                              <input type="number" min="1" value={cooldownHours} onChange={e => setCooldownHours(Number(e.target.value) || '')} placeholder="Ej: 24" style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', outline: 'none' }} />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Mensaje Alternativo de Reactivación (Opcional)</label>
                              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>En lugar de saludar desde cero, puedes enviarle otro mensaje cuando el bot vuelve a saltar tras el cooldown.</p>
                              <input type="text" value={reactivationText} onChange={e => setReactivationText(e.target.value)} placeholder="Ej: ¡Hola de nuevo! ¿Te sigo ayudando con esto?" style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', outline: 'none' }} />
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '8px 0' }} />

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Tipo de Respuesta Principal</label>
                      <CustomSelect options={[{ value: 'text', label: 'Solo Texto' }, { value: 'options', label: 'Texto + Opciones (Botones)' }, { value: 'file', label: 'Texto + Archivo Adjunto' }, { value: 'whatsapp', label: 'Derivar a WhatsApp' }, { value: 'goto', label: 'Volver a un Menú / Reenviar Opciones' }]} value={responseType} onChange={(val: any) => setResponseType(val)} />
                    </div>

                    {responseType === 'goto' ? (
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>¿A cuáles opciones volver?</label>
                        <CustomSelect options={availableGotos} value={gotoId} onChange={(val: any) => setGotoId(val)} />
                      </div>
                    ) : (
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Texto de Respuesta Inicial</label>
                        <textarea value={responseText} onChange={e => setResponseText(e.target.value)} style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', minHeight: '80px', outline: 'none', resize: 'vertical' }} />
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
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Nombre del Archivo</label>
                        <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', outline: 'none' }} />
                      </div>
                    )}

                    {responseType === 'whatsapp' && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Mensaje de WA</label>
                        <textarea value={whatsappText} onChange={e => setWhatsappText(e.target.value)} style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', minHeight: '80px', outline: 'none', resize: 'vertical' }} />
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                      <button onClick={handleAddRule} style={{ flex: 1, background: 'var(--color-primary)', color: themeColors.textWhite, border: 'none', padding: '12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>Guardar Regla</button>
                      <button onClick={() => setIsAdding(false)} style={{ flex: 1, background: themeColors.bgSubtle3, color: themeColors.textWhite, border: 'none', padding: '12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
