'use client';

import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import CustomSelect from '@/components/ui/CustomSelect';
import { useThemeColors } from '@/hooks/useThemeColors';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const VisualBotBuilder = lazy(() => import('./VisualBotBuilder'));

export type GotoOption = { value: string; label: string };

export type AdvisorOption = {
  id: string;
  label: string;
  responseType: 'text' | 'options' | 'file' | 'whatsapp' | 'goto' | 'input';
  responseText: string;
  conditionType?: 'exact' | 'keyword' | 'always';
  conditionValue?: string;
  options?: AdvisorOption[];
  fileName?: string;
  whatsappText?: string;
  gotoId?: string;
};

export type AdvisorRule = {
  id: string;
  conditionType: 'exact' | 'keyword' | 'always';
  conditionValue: string;
  responseType: 'text' | 'options' | 'file' | 'whatsapp' | 'goto' | 'input';
  responseText: string;
  reactivationText?: string;
  options?: AdvisorOption[];
  fileName?: string;
  attachmentUrl?: string;
  attachmentType?: string;
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
    <div className="nested-option-node" style={{ background: themeColors.bgSubtle2, padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
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
              <CustomSelect options={[{ value: 'text', label: 'Solo Texto' }, { value: 'options', label: 'Sub-Opciones' }, { value: 'file', label: 'Archivo Adjunto' }, { value: 'whatsapp', label: 'Derivar a WhatsApp' }, { value: 'goto', label: 'Volver a un Menú / Reenviar Opciones' }]} value={opt.responseType} onChange={(val: any) => handleUpdateOption(index, { responseType: val })} />

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

            {(opt.responseType === 'file') && (
              <div style={{ marginBottom: '12px' }}>
                <input type="text" value={opt.fileName || ''} onChange={e => handleUpdateOption(index, { fileName: e.target.value })} placeholder="Ej: catalogo.pdf" style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }} />
              </div>
            )}

            {opt.responseType === 'whatsapp' && (
              <div style={{ marginBottom: '12px' }}>
                <textarea value={opt.whatsappText || ''} onChange={e => handleUpdateOption(index, { whatsappText: e.target.value })} placeholder="Texto pre-llenado que se enviará al WhatsApp del vendedor..." style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', minHeight: '60px', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }} />
              </div>
            )}

            {(opt.responseType === 'options') && (
              <div className="nested-options-container" style={{ paddingLeft: '16px', borderLeft: `2px solid ${themeColors.borderSubtle3}`, marginTop: '16px' }}>
                <NestedOptionsBuilder options={opt.options || []} onChange={onChangeNested} pathPrefix={`${currentPath}.`} availableGotos={availableGotos} />
              </div>
            )}

            {(opt.responseType === 'text' || opt.responseType === 'file') && (
              <div className="nested-options-container" style={{ paddingLeft: '16px', borderLeft: `2px solid ${themeColors.borderSubtle3}`, marginTop: '16px' }}>
                <NestedNextBuilder opt={opt} onChangeNested={onChangeNested} availableGotos={availableGotos} currentPath={currentPath} />
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

function NestedNextBuilder({ opt, onChangeNested, availableGotos, currentPath }: any) {
  const hasNext = opt.options && opt.options.length > 0 && opt.options[0].label === '__next__';
  const handleAddNext = () => onChangeNested([{ id: Date.now().toString() + Math.random().toString(), label: '__next__', responseType: 'text', responseText: '' }]);
  const handleRemoveNext = () => onChangeNested([]);
  const handleUpdateNext = (updates: any) => {
    const newOptions = [{ ...opt.options[0], ...updates }];
    onChangeNested(newOptions);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {hasNext ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>Siguiente Paso ⤵</span>
            <button onClick={handleRemoveNext} style={{ background: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>Quitar Paso</button>
          </div>
          <NestedOptionNode opt={opt.options[0]} index={0} currentPath={`${currentPath} (Sig)`} handleUpdateOption={(_: number, updates: any) => handleUpdateNext(updates)} handleRemoveOption={handleRemoveNext} availableGotos={availableGotos} onChangeNested={(newNested: any) => handleUpdateNext({ options: newNested })} />
        </>
      ) : (
        <button onClick={handleAddNext} style={{ background: 'transparent', color: 'var(--color-primary)', border: '1px dashed var(--color-primary)', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', alignSelf: 'flex-start', marginTop: '8px' }}>+ Enviar otro mensaje después</button>
      )}
    </div>
  );
}

export default function VirtualAdvisorModal({ onClose, productId }: VirtualAdvisorModalProps) {
  const themeColors = useThemeColors();
  const { supabaseUser } = useAuth();
  const supabase = createClient();
  
  const [rules, setRules] = useState<AdvisorRule[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [builderMode, setBuilderMode] = useState<'select' | 'classic' | 'visual'>('select');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const visualBuilderRef = useRef<any>(null);

  // Settings state
  const [retargetingDays, setRetargetingDays] = useState<number | ''>('');
  const [retargetingMessage, setRetargetingMessage] = useState('');
  const [botReactivationHours, setBotReactivationHours] = useState<number | ''>('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Form State
  const [conditionType, setConditionType] = useState<'exact' | 'keyword' | 'always'>('exact');
  const [conditionValue, setConditionValue] = useState('');
  const [responseType, setResponseType] = useState<'text' | 'options' | 'file' | 'whatsapp' | 'goto' | 'input'>('text');
  const [responseText, setResponseText] = useState('');
  const [reactivationText, setReactivationText] = useState('');
  const [options, setOptions] = useState<AdvisorOption[]>([]);
  const [fileName, setFileName] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [whatsappText, setWhatsappText] = useState('');
  const [gotoId, setGotoId] = useState('');
  const [cooldownHours, setCooldownHours] = useState<number | ''>('');
  const [fireOnce, setFireOnce] = useState(false);

  const [availableGotos, setAvailableGotos] = useState<GotoOption[]>([]);

  useEffect(() => {
    const gotos: GotoOption[] = [];
    if (responseType === 'options') {
      gotos.push({ value: 'root', label: 'Volver al inicio de esta regla' });
      
      // Añadir opciones para derivar a otras reglas
      rules.forEach(r => {
        if (r.id !== editingRuleId) {
          let ruleLabel = '';
          if (r.conditionType === 'always') ruleLabel = 'Siempre (Menú Principal)';
          else if (r.conditionType === 'exact') ruleLabel = `Exacto: "${r.conditionValue}"`;
          else if (r.conditionType === 'keyword') ruleLabel = `Palabra Clave: "${r.conditionValue}"`;
          
          if (ruleLabel) {
            gotos.push({ value: `rule_${r.id}`, label: `Ir a -> Regla ${ruleLabel}` });
          }
        }
      });

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
  }, [responseType, options, rules, editingRuleId]);

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
        setRetargetingDays(settingsData.retargeting_days || '');
        setRetargetingMessage(settingsData.retargeting_message || '');
        setBotReactivationHours(settingsData.bot_reactivation_hours || '');
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
        retargeting_days: retargetingDays === '' ? null : retargetingDays,
        retargeting_message: retargetingMessage || null,
        bot_reactivation_hours: botReactivationHours === '' ? null : botReactivationHours
      };
      await supabase.from('bot_settings').upsert(payload, { onConflict: 'seller_id,product_id' });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch(e) { console.error(e); }
  };

  const validateOptions = (opts: any[]): boolean => {
    for (const opt of opts) {
      if (!opt.label || !opt.label.trim()) return false;
      if ((opt.responseType === 'options' || opt.responseType === 'file_options') && opt.options) {
        if (opt.options.length === 0) return false;
        if (!validateOptions(opt.options)) return false;
      }
    }
    return true;
  };

  const handleAddRule = async () => {
    if (conditionType !== 'always' && !conditionValue.trim()) { alert('Ingresa el valor de la condición.'); return; }
    
    if (responseType === 'options') {
      if (options.length === 0) {
        alert('Debes agregar al menos una opción.');
        return;
      }
      if (!validateOptions(options)) {
        alert('Todas las opciones y sub-opciones deben tener un Nombre del Botón (texto visible).');
        return;
      }
    }

    if (responseType !== 'goto' && responseType !== 'whatsapp') {
      const hasText = !!responseText.trim();
      const hasFile = (responseType === 'file') && (attachmentFile || fileName);
      const hasOptions = (responseType === 'options') && options.length > 0;
      
      if (!hasText && !hasFile && !hasOptions) {
        alert('Debes ingresar al menos un texto de respuesta, opciones o un archivo adjunto.');
        return;
      }
    }
    
    if (responseType === 'goto' && !gotoId) { alert('Selecciona a qué opciones volver.'); return; }
    
    if (conditionType === 'always' && !fireOnce && cooldownHours === '') {
      alert('Para reglas de Activación Siempre, debes definir un Cooldown (horas) o marcar "Disparar una sola vez".');
      return;
    }

    if (!supabaseUser) return;

    let finalAttachmentUrl = null;
    let finalAttachmentType = null;
    let finalFileName = fileName;

    if ((responseType === 'file') && attachmentFile) {
      setIsUploading(true);
      try {
        const fileExt = attachmentFile.name.split('.').pop();
        const storageFileName = `bot_${supabaseUser.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        let type = 'document';
        if (attachmentFile.type.startsWith('image/')) type = 'image';
        else if (attachmentFile.type.startsWith('video/')) type = 'video';
        else if (attachmentFile.type.startsWith('audio/')) type = 'audio';

        const { error: uploadError } = await supabase.storage
          .from('chat_attachments')
          .upload(storageFileName, attachmentFile, { upsert: false });

        if (uploadError) {
          alert('Error al subir el archivo: ' + uploadError.message);
          setIsUploading(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage.from('chat_attachments').getPublicUrl(storageFileName);
        finalAttachmentUrl = publicUrl;
        finalAttachmentType = type;
        finalFileName = attachmentFile.name;
      } catch (err) {
        console.error(err);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const payload = {
      seller_id: supabaseUser.id,
      product_id: productId || null,
      condition_type: conditionType,
      condition_value: conditionType === 'always' ? null : conditionValue.trim().toLowerCase(),
      response_type: responseType,
      response_text: responseText.trim(),
      reactivation_text: reactivationText.trim() || null,
      options: (responseType === 'options') ? options : null,
      file_name: (responseType === 'file') ? (finalFileName.trim() || 'documento') : null,
      attachment_url: finalAttachmentUrl,
      attachment_type: finalAttachmentType,
      whatsapp_text: responseType === 'whatsapp' ? (whatsappText.trim() || 'Hola') : null,
      goto_id: responseType === 'goto' ? gotoId : null,
      cooldown_hours: conditionType === 'always' && !fireOnce ? cooldownHours : null,
      fire_once: conditionType === 'always' ? fireOnce : false
    };

    if (editingRuleId) {
      const { data, error } = await supabase.from('bot_rules').update(payload).eq('id', editingRuleId).select().single();
      if (data) {
        setRules(rules.map(r => r.id === editingRuleId ? {
          id: data.id,
          conditionType: data.condition_type,
          conditionValue: data.condition_value || '',
          responseType: data.response_type,
          responseText: data.response_text,
          reactivationText: data.reactivation_text || '',
          options: data.options,
          fileName: data.file_name,
          attachmentUrl: data.attachment_url,
          attachmentType: data.attachment_type,
          whatsappText: data.whatsapp_text,
          gotoId: data.goto_id,
          cooldownHours: data.cooldown_hours,
          fireOnce: data.fire_once
        } : r));
      }
    } else {
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
          attachmentUrl: data.attachment_url,
          attachmentType: data.attachment_type,
          whatsappText: data.whatsapp_text,
          gotoId: data.goto_id,
          cooldownHours: data.cooldown_hours,
          fireOnce: data.fire_once
        }]);
      }
    }

    setIsAdding(false);
    setEditingRuleId(null);
    setBuilderMode('select');
    // Reset
    setConditionType('exact'); setConditionValue(''); setResponseType('text');
    setResponseText(''); setReactivationText(''); setOptions([]); setFileName(''); setWhatsappText(''); setGotoId('');
    setCooldownHours(''); setFireOnce(false);
  };

  const handleEditRule = (rule: AdvisorRule) => {
    setEditingRuleId(rule.id);
    setConditionType(rule.conditionType);
    setConditionValue(rule.conditionValue);
    setResponseType(rule.responseType);
    setResponseText(rule.responseText);
    setReactivationText(rule.reactivationText || '');
    setOptions(rule.options || []);
    setFileName(rule.fileName || '');
    setWhatsappText(rule.whatsappText || '');
    setGotoId(rule.gotoId || '');
    setCooldownHours(rule.cooldownHours || '');
    setFireOnce(rule.fireOnce || false);
    setIsAdding(true);
    setBuilderMode(rule.responseType === 'options' ? 'visual' : 'classic');
  };

  const handleDeleteRule = async (id: string) => {
    await supabase.from('bot_rules').delete().eq('id', id);
    setRules(rules.filter(r => r.id !== id));
  };

  return (
    <div className="virtual-advisor-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel virtual-advisor-modal" style={{ width: '100%', maxWidth: isAdding && (responseType === 'options') ? '95vw' : '1100px', maxHeight: '95vh', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--color-border)', background: themeColors.surfaceElevated, fontFamily: 'var(--font-inter), sans-serif', transition: 'max-width 0.3s ease' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'var(--color-primary)' }}>Configurar Asesor Virtual {productId ? `(Personalizado)` : `(General)`}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: themeColors.textWhite, cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>

        {/* Content */}
        <div className="virtual-advisor-content" style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {isLoading ? (
            <p>Cargando configuración...</p>
          ) : (
            <>
              {/* GLOBAL SETTINGS CARD */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: 'var(--radius-lg)', border: `1px solid rgba(255, 255, 255, 0.05)`, transition: 'all 0.3s ease' }}>
                <div 
                  onClick={() => setShowAdvanced(!showAdvanced)} 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', paddingBottom: showAdvanced ? '16px' : '0', borderBottom: showAdvanced ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255, 115, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    </div>
                    <h3 style={{ margin: 0, color: 'var(--color-text-main)', fontSize: '1.1rem', fontWeight: 600 }}>Configuración Avanzada</h3>
                  </div>
                  <div style={{ transition: 'transform 0.3s ease', transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>

                {showAdvanced && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ marginBottom: '24px', padding: '16px', background: themeColors.bgSubtle3, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-text-main)', fontSize: '0.95rem' }}>1. Pausa Automática (Predeterminado)</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                        El bot se pausa automáticamente y deja de responder cuando envías un mensaje manual para no interrumpir tu conversación.
                      </p>
                    </div>
                    
                    <div style={{ marginBottom: '24px', padding: '16px', background: themeColors.bgSubtle3, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-text-main)', fontSize: '0.95rem' }}>2. Reactivación Automática</h4>
                      <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                        El bot podrá volverse a utilizar de manera silenciosa para seguir escuchando luego de X horas de inactividad tras tu último mensaje manual.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="number" min="1" value={botReactivationHours} onChange={e => setBotReactivationHours(Number(e.target.value) || '')} placeholder="Horas (Ej: 12)" style={{ width: '120px', padding: '10px', background: themeColors.bgSubtle2, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', outline: 'none' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>horas.</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '24px', padding: '16px', background: themeColors.bgSubtle3, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-text-main)', fontSize: '0.95rem' }}>3. Retargeting Automático</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                        Mensaje de no respuesta: si no hay charla en X horas, el bot tomará la iniciativa y enviará automáticamente este mensaje. ¡Perfecto para revivir leads caídos!
                      </p>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <input type="number" min="1" value={retargetingDays} onChange={e => setRetargetingDays(Number(e.target.value) || '')} placeholder="Horas (Ej: 24)" style={{ width: '120px', padding: '10px', background: themeColors.bgSubtle2, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', outline: 'none' }} />
                        <input type="text" value={retargetingMessage} onChange={e => setRetargetingMessage(e.target.value)} placeholder="Ej: ¡Hola! ¿Aún sigues interesado en nuestros productos?" style={{ flex: '1 1 200px', padding: '10px', background: themeColors.bgSubtle2, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', outline: 'none' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <button onClick={saveSettings} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Guardar Configuración Avanzada</button>
                      {saveSuccess && <span style={{ color: '#4caf50', fontWeight: 500, fontSize: '0.9rem' }}>¡Guardado correctamente!</span>}
                    </div>
                  </div>
                )}
              </div>

              {!isAdding ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      Reglas Activas
                    </h3>
                    <button 
                      onClick={() => { setIsAdding(true); setBuilderMode('select'); setResponseType('text'); }} 
                      style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '100px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(255, 115, 0, 0.3)', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 115, 0, 0.4)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 115, 0, 0.3)'; }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      Nueva Regla
                    </button>
                  </div>

                  {rules.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      <div>
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-text-main)' }}>Aún no hay reglas configuradas</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>El bot no responderá a ningún mensaje hasta que agregues una regla.</p>
                      </div>
                      <button onClick={() => { setIsAdding(true); setBuilderMode('select'); setResponseType('text'); }} style={{ background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', padding: '8px 16px', borderRadius: '100px', cursor: 'pointer', fontWeight: 600, marginTop: '8px' }}>Crear la primera regla</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {rules.map(rule => (
                        <div 
                          key={rule.id} 
                          style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', transition: 'all 0.3s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                        >
                          <div style={{ flex: 1, paddingRight: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                              <span style={{ background: 'rgba(255, 115, 0, 0.1)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px' }}>SI RECIBE</span>
                              <span style={{ color: themeColors.textWhite, fontSize: '1rem', fontWeight: 500 }}>
                                {rule.conditionType === 'always' ? 'Cualquier mensaje inicial (Activar siempre)' : rule.conditionType === 'keyword' ? <span>Palabra clave: <b style={{ color: 'var(--color-primary)' }}>"{rule.conditionValue}"</b></span> : <span>Mensaje exacto: <b style={{ color: 'var(--color-primary)' }}>"{rule.conditionValue}"</b></span>}
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px' }}>ENTONCES</span>
                              <span style={{ color: 'var(--color-text-main)', fontSize: '0.95rem' }}>
                                {rule.responseType === 'goto' ? (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg> Volver a menú <b style={{ color: 'var(--color-primary)' }}>{rule.gotoId === 'root' ? 'Principal' : rule.gotoId}</b></span>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {rule.responseText && <div style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>"{rule.responseText}"</div>}
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                                      {rule.options && rule.options.length > 0 && <span style={{ fontSize: '0.75rem', background: 'rgba(255, 115, 0, 0.1)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '100px' }}>{rule.options.length} opciones</span>}
                                      {rule.fileName && <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', color: 'var(--color-text-main)', padding: '2px 8px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg> {rule.fileName}</span>}
                                      {rule.responseType === 'whatsapp' && <span style={{ fontSize: '0.75rem', background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', padding: '2px 8px', borderRadius: '100px' }}>Derivar a WA</span>}
                                    </div>
                                  </div>
                                )}
                              </span>
                            </div>
                            
                            {rule.conditionType === 'always' && (
                              <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(255, 153, 0, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 153, 0, 0.2)', fontSize: '0.85rem', color: '#ff9900', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {rule.fireOnce ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>}
                                  <span style={{ fontWeight: 600 }}>{rule.fireOnce ? 'Se dispara SOLO UNA VEZ' : `Cooldown de ${rule.cooldownHours}hs`}</span>
                                </div>
                                {rule.reactivationText && <div><span style={{ color: 'var(--color-text-muted)' }}>Al reactivarse:</span> "{rule.reactivationText}"</div>}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center', borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '20px' }}>
                            <button 
                              onClick={() => handleEditRule(rule)} 
                              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-main)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--color-text-main)'; }}
                              title="Editar Regla"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button 
                              onClick={() => handleDeleteRule(rule.id)} 
                              style={{ background: 'rgba(255,50,50,0.05)', color: '#ff4444', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#ff4444'; e.currentTarget.style.color = '#fff'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,50,50,0.05)'; e.currentTarget.style.color = '#ff4444'; }}
                              title="Eliminar Regla"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : builderMode === 'select' ? (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '40px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 12px 0', color: 'var(--color-text-main)', fontSize: '1.5rem' }}>¿Cómo quieres crear esta regla?</h3>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Elige el formato de edición que prefieras.</p>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', width: '100%', maxWidth: '800px' }}>
                    
                    {/* Modo Visual */}
                    <div 
                      onClick={() => { setResponseType('options'); setBuilderMode('visual'); }}
                      style={{ background: 'rgba(255, 115, 0, 0.05)', border: '1px solid rgba(255, 115, 0, 0.2)', padding: '32px', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.background = 'rgba(255, 115, 0, 0.1)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 115, 0, 0.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255, 115, 0, 0.05)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '8px' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary)' }}>Modo Visual (Cajitas)</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Crea árboles de decisión arrastrando y conectando cajitas en un lienzo interactivo.</p>
                    </div>

                    {/* Modo Clásico */}
                    <div 
                      onClick={() => setBuilderMode('classic')}
                      style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '32px', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.2)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-main)', marginBottom: '8px' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text-main)' }}>Formato Clásico</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Utiliza el formulario estándar para configurar la respuesta de texto simple, archivos, etc.</p>
                    </div>

                  </div>
                  
                  <button onClick={() => { setIsAdding(false); setBuilderMode('select'); }} style={{ background: 'transparent', color: 'var(--color-text-muted)', border: 'none', marginTop: '16px', cursor: 'pointer', padding: '8px 16px', fontSize: '1rem' }}>Volver atrás</button>
                </div>
              ) : (
                <div style={{ 
                  background: 'rgba(255,255,255,0.02)', 
                  padding: builderMode === 'visual' ? '0' : '24px', 
                  borderRadius: 'var(--radius-lg)', 
                  border: '1px solid rgba(255,255,255,0.05)', 
                  display: builderMode === 'visual' ? 'flex' : 'block',
                  overflow: 'hidden'
                }}>
                  {/* Left Column (Sidebar) */}
                  <div style={{ 
                    width: builderMode === 'visual' ? '320px' : '100%', 
                    padding: builderMode === 'visual' ? '24px' : '0',
                    borderRight: builderMode === 'visual' ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '16px',
                    overflowY: 'auto',
                    maxHeight: builderMode === 'visual' ? '700px' : 'auto'
                  }}>
                    <h3 style={{ margin: '0 0 4px 0', color: 'var(--color-text-main)' }}>{editingRuleId ? 'Editar Regla' : 'Crear Nueva Regla'} {builderMode === 'visual' ? '(Modo Visual)' : ''}</h3>
                    
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
                          <div 
                            onClick={() => setFireOnce(!fireOnce)}
                            style={{ 
                              width: '24px', height: '24px', 
                              border: `2px solid ${fireOnce ? 'var(--color-primary)' : 'var(--color-border)'}`, 
                              borderRadius: '6px', 
                              background: fireOnce ? 'var(--color-primary)' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s'
                            }}
                          >
                            {fireOnce && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                          </div>
                          <label onClick={() => setFireOnce(!fireOnce)} style={{ color: themeColors.textWhite, cursor: 'pointer', userSelect: 'none', lineHeight: 1.4 }}>
                            Disparar SOLO una vez y no volver a molestar
                          </label>
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

                    {builderMode === 'classic' && (
                      <>
                        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Tipo de Respuesta Principal</label>
                          <CustomSelect options={[{ value: 'text', label: 'Solo Texto' }, { value: 'options', label: 'Sub-Opciones' }, { value: 'file', label: 'Archivo Adjunto' }, { value: 'input', label: 'Esperar Respuesta Textual' }, { value: 'whatsapp', label: 'Derivar a WhatsApp' }, { value: 'goto', label: 'Volver a un Menú / Reenviar Opciones' }]} value={responseType} onChange={(val: any) => setResponseType(val)} />
                        </div>
                      </>
                    )}

                    {responseType === 'goto' ? (
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>¿A cuáles opciones volver?</label>
                        <CustomSelect options={availableGotos} value={gotoId} onChange={(val: any) => setGotoId(val)} />
                      </div>
                    ) : (
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                          Texto de Respuesta Inicial { (responseType === 'options' || responseType === 'file') ? '(Opcional si hay opciones/archivo)' : '' }
                        </label>
                        <textarea value={responseText} onChange={e => setResponseText(e.target.value)} style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', minHeight: '80px', outline: 'none', resize: 'vertical' }} />
                      </div>
                    )}

                    {builderMode === 'classic' && (responseType === 'options') && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Opciones Interactivas</label>
                        <NestedOptionsBuilder options={options} onChange={setOptions} availableGotos={availableGotos} />
                      </div>
                    )}

                    {builderMode === 'classic' && (responseType === 'text' || responseType === 'file') && (
                      <div style={{ marginTop: '8px' }}>
                        <NestedNextBuilder opt={{ options }} onChangeNested={setOptions} availableGotos={availableGotos} currentPath="Paso 2" />
                      </div>
                    )}

                    {builderMode === 'classic' && (responseType === 'file') && (
                      <div style={{ background: themeColors.bgSubtle3, padding: '20px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <h4 style={{ margin: '0 0 16px 0', color: 'var(--color-text-main)' }}>Archivo Adjunto</h4>
                        
                        <div 
                          style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', border: '2px dashed var(--color-primary)', borderRadius: 'var(--radius-md)', background: 'rgba(255, 115, 0, 0.05)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                          onDragOver={e => { e.preventDefault(); e.currentTarget.style.background = 'rgba(255, 115, 0, 0.1)'; }}
                          onDragLeave={e => { e.currentTarget.style.background = 'rgba(255, 115, 0, 0.05)'; }}
                          onDrop={e => { e.preventDefault(); e.currentTarget.style.background = 'rgba(255, 115, 0, 0.05)'; const file = e.dataTransfer.files?.[0]; if (file) { setAttachmentFile(file); setFileName(file.name); } }}
                        >
                          <input 
                            type="file" 
                            id="bot-file-upload"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setAttachmentFile(file);
                                setFileName(file.name);
                              }
                            }} 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                          />
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                          <span style={{ color: 'var(--color-text-main)', fontWeight: 600, fontSize: '0.95rem' }}>Haz clic para subir o arrastra el archivo</span>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Soporta PDF, JPG, PNG, MP4, etc.</span>
                        </div>
                        
                        {(fileName || attachmentFile) && (
                          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: themeColors.bgSubtle2, padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success, #4caf50)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ color: 'var(--color-text-main)', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {attachmentFile ? attachmentFile.name : fileName}
                              </div>
                              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                {attachmentFile ? 'Listo para subirse' : 'Archivo actual guardado'}
                              </div>
                            </div>
                            {attachmentFile && (
                              <button onClick={() => { setAttachmentFile(null); setFileName(''); (document.getElementById('bot-file-upload') as HTMLInputElement).value = ''; }} style={{ background: 'transparent', border: 'none', color: 'var(--color-danger, #ff4444)', cursor: 'pointer', padding: '4px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {builderMode === 'classic' && responseType === 'whatsapp' && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Mensaje de WA</label>
                        <textarea value={whatsappText} onChange={e => setWhatsappText(e.target.value)} style={{ width: '100%', padding: '10px', background: themeColors.bgSubtle3, color: themeColors.textWhite, border: '1px solid var(--color-border)', borderRadius: '4px', minHeight: '80px', outline: 'none', resize: 'vertical' }} />
                      </div>
                    )}

                    {builderMode === 'visual' && (
                      <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-text-main)' }}>Añadir Cajita (Respuesta)</h4>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button type="button" onClick={() => visualBuilderRef.current?.addNewNode('text')} style={{ flex: '1 1 45%', background: 'rgba(243,156,18,0.2)', color: '#f39c12', border: '1px solid rgba(243,156,18,0.4)', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>+ Solo Texto</button>
                          <button type="button" onClick={() => visualBuilderRef.current?.addNewNode('options')} style={{ flex: '1 1 45%', background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>+ Sub-Opciones</button>
                          <button type="button" onClick={() => visualBuilderRef.current?.addNewNode('file')} style={{ flex: '1 1 45%', background: 'rgba(52,152,219,0.2)', color: '#3498db', border: '1px solid rgba(52,152,219,0.4)', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>+ Archivo Adjunto</button>
                          <button type="button" onClick={() => visualBuilderRef.current?.addNewNode('whatsapp')} style={{ flex: '1 1 45%', background: '#25d366', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>+ WhatsApp</button>
                          <button type="button" onClick={() => visualBuilderRef.current?.addNewNode('goto')} style={{ flex: '1 1 45%', background: '#9b59b6', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>+ Volver a Menú</button>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '16px' }}>
                      <button onClick={handleAddRule} disabled={isUploading} style={{ flex: 1, background: 'var(--color-primary)', color: themeColors.textWhite, border: 'none', padding: '12px', borderRadius: '100px', cursor: isUploading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: isUploading ? 0.7 : 1 }}>
                        {isUploading ? 'Guardando...' : (editingRuleId ? 'Actualizar Regla' : 'Guardar Regla')}
                      </button>
                      <button onClick={() => { setIsAdding(false); setEditingRuleId(null); setBuilderMode('select'); }} disabled={isUploading} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: themeColors.textWhite, border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '100px', cursor: isUploading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>Cancelar</button>
                    </div>
                  </div>

                  {/* Main Canvas Area for Visual Mode */}
                  {(builderMode === 'visual' || responseType === 'options') && (
                    <div style={{ flex: 1, minWidth: 0, padding: builderMode === 'visual' ? '0' : '0' }}>
                      <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando constructor visual...</div>}>
                        <VisualBotBuilder
                          ref={visualBuilderRef}
                            responseText={responseText}
                            options={options}
                            responseType={responseType}
                            onChange={(text: string, opts: any[], rootType: string, rootFile?: string, rootWhatsapp?: string, rootGoto?: string) => {
                              setResponseText(text);
                              setOptions(opts);
                              setResponseType(rootType as any);
                              if (rootFile !== undefined) setFileName(rootFile);
                              if (rootWhatsapp !== undefined) setWhatsappText(rootWhatsapp);
                              if (rootGoto !== undefined) setGotoId(rootGoto);
                            }}
                            allRules={rules}
                            editingRuleId={editingRuleId}
                          />
                        </Suspense>
                      </div>
                    )}
                  
                  {/* End of layout wrappers */}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
