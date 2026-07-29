'use client';

import { useRef, useState, useEffect } from 'react';
import './config.css';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import { createClient } from '@/lib/supabase/client';
import CustomSelect, { SelectOption } from '@/components/ui/CustomSelect';
import { isValidCuit } from '@/utils/validateCuit';

function SucursalEditor({ index, sucursal, provincias, onChange, onRemove }: { index: number, sucursal: any, provincias: SelectOption[], onChange: (updated: any) => void, onRemove: () => void }) {
  const [localidades, setLocalidades] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sucursal.provincia) {
      setLoading(true);
      const provEnc = encodeURIComponent(sucursal.provincia);
      Promise.allSettled([
        fetch(`https://apis.datos.gob.ar/georef/api/localidades?provincia=${provEnc}&campos=id,nombre&max=1000&orden=nombre`).then(r => r.json()),
        fetch(`https://apis.datos.gob.ar/georef/api/municipios?provincia=${provEnc}&campos=id,nombre&max=1000&orden=nombre`).then(r => r.json())
      ]).then(([locRes, munRes]) => {
        const locNames = locRes.status === 'fulfilled' ? (locRes.value.localidades || []).map((l: any) => l.nombre) : [];
        const munNames = munRes.status === 'fulfilled' ? (munRes.value.municipios || []).map((l: any) => l.nombre) : [];
        const combined = Array.from(new Set([...locNames, ...munNames])).sort();
        const prev = sucursal.localidad;
        const finalNames = Array.from(new Set(prev ? [prev, ...combined] : combined));
        setLocalidades(finalNames.map(name => ({ value: name, label: name })));
        setLoading(false);
      }).catch(() => { setLoading(false); });
    } else {
      setLocalidades([]);
    }
  }, [sucursal.provincia]);

  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontWeight: 'bold' }}>Sucursal {index + 1}</span>
        <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}>Eliminar</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="form-group-config">
          <label>Provincia</label>
          <CustomSelect
            id={`prov-${index}`}
            options={provincias}
            value={sucursal.provincia || ''}
            onChange={(val) => onChange({ ...sucursal, provincia: val, localidad: '' })}
            placeholder="Seleccione provincia"
          />
        </div>
        <div className="form-group-config">
          <label>Localidad</label>
          <CustomSelect
            id={`loc-${index}`}
            options={localidades}
            value={sucursal.localidad || ''}
            onChange={(val) => onChange({ ...sucursal, localidad: val })}
            placeholder={loading ? 'Cargando...' : 'Seleccione localidad'}
            disabled={!sucursal.provincia || loading}
          />
        </div>
        <div className="form-group-config">
          <label>Calle</label>
          <input type="text" value={sucursal.calle || ''} onChange={(e) => onChange({ ...sucursal, calle: e.target.value })} placeholder="Ej. San Martín" />
        </div>
        <div className="form-group-config">
          <label>Número</label>
          <input type="text" value={sucursal.numero || ''} onChange={(e) => onChange({ ...sucursal, numero: e.target.value })} placeholder="Ej. 456" />
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracionPage() {
  const supabase = createClient();
  const { 
    username, email, avatar, updateUser, isVendor, upgradeToVendor,
    personType, birthDate, cuit, phone, contactEmail,
    firstName, lastName, storeName, storeDescription, street, streetNumber, province, locality,
    socialMedia, branches, schedules 
  } = useAuth();
  const { planDisplayName, isPaidPlan, productPlanTier, servicePlanTier, permissions } = usePlan();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const validateTime = (val: string) => {
    let v = val.replace(/\D/g, '');
    if (v.length === 0) return '00:00';
    let hStr = v.length > 2 ? v.substring(0, 2) : v;
    let mStr = v.length > 2 ? v.substring(2, 4) : '0';
    let h = parseInt(hStr, 10);
    let m = parseInt(mStr, 10);
    if (h > 23) h = 23;
    if (m > 59) m = 59;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const formatWhileTyping = (val: string) => {
    let v = val.replace(/\D/g, '');
    if (v.length > 4) v = v.substring(0, 4);
    if (v.length >= 3) {
      return v.substring(0, 2) + ':' + v.substring(2);
    } else if (v.length === 2 && val.endsWith(':')) {
      return v + ':';
    }
    return v;
  };

  // Estados del formulario controlados
  const [formData, setFormData] = useState({
    username: '',
    nombre: '',
    apellido: '',
    telefono: '',
    dob: '',
    avatar: '',
    tipoPersona: 'fisica',
    cuit: '',
    storeName: '',
    storeDescription: '',
    calle: '',
    numero: '',
    contactEmail: ''
  });
  
  const defaultHorarios = [
    { day: 'Lunes', closed: false, shifts: [{ open: '09:00', close: '18:00' }] },
    { day: 'Martes', closed: false, shifts: [{ open: '09:00', close: '18:00' }] },
    { day: 'Miércoles', closed: false, shifts: [{ open: '09:00', close: '18:00' }] },
    { day: 'Jueves', closed: false, shifts: [{ open: '09:00', close: '18:00' }] },
    { day: 'Viernes', closed: false, shifts: [{ open: '09:00', close: '18:00' }] },
    { day: 'Sábado', closed: false, shifts: [{ open: '09:00', close: '13:00' }] },
    { day: 'Domingo', closed: true, shifts: [{ open: '09:00', close: '13:00' }] }
  ];
  const [horarios, setHorarios] = useState(defaultHorarios);
  
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [redesSociales, setRedesSociales] = useState<{ red: string, usuario: string }[]>([
    { red: 'Instagram', usuario: '' },
    { red: 'Facebook', usuario: '' },
    { red: 'X', usuario: '' }
  ]);

  const [cuitStatus, setCuitStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [cuitMessage, setCuitMessage] = useState('');

  useEffect(() => {
    if (username || email || personType || cuit) {
      setFormData(prev => ({
        ...prev,
        username: username || '',
        nombre: firstName || '',
        apellido: lastName || '',
        telefono: phone || '',
        dob: birthDate || '',
        avatar: avatar || '',
        tipoPersona: (personType || 'fisica').toLowerCase().includes('jur') ? 'juridica' : 'fisica',
        cuit: cuit || '',
        storeName: storeName || '',
        storeDescription: storeDescription || '',
        calle: street || '',
        numero: streetNumber || '',
        contactEmail: contactEmail || email || ''
      }));
      
      if (province) setSelectedProvincia(province);
      if (locality) setSelectedLocalidad(locality);
      if (schedules && schedules.length > 0) setHorarios(schedules);
      if (branches && branches.length > 0) setSucursales(branches);
      if (socialMedia && socialMedia.length > 0) setRedesSociales(socialMedia);
    }
  }, [
    username, avatar, personType, birthDate, cuit, phone, contactEmail, email,
    firstName, lastName, storeName, storeDescription, street, streetNumber, province, locality,
    schedules, branches, socialMedia
  ]);

  useEffect(() => {
    const cuit = formData.cuit || '';
    const cleanCuit = cuit.replace(/\D/g, '');

    if (cleanCuit.length < 11) {
      setCuitStatus('idle');
      setCuitMessage('');
      return;
    }

    if (cleanCuit.length === 11) {
      if (!isValidCuit(cleanCuit)) {
        setCuitStatus('invalid');
        setCuitMessage('El CUIT es inválido (Falló verificación de dígitos)');
        return;
      }

      setCuitStatus('loading');
      setCuitMessage('Verificando en AFIP...');

      fetch(`/api/cuit?cuit=${cleanCuit}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.razonSocial) {
            setCuitStatus('valid');
            setCuitMessage('');
            setFormData(prev => ({ ...prev, storeName: data.razonSocial }));
          } else if (data.error === 'API_KEY_MISSING') {
            setCuitStatus('valid');
            setCuitMessage('API Key de apicuit.com no configurada. Ingresa tu Razón Social manualmente.');
          } else {
            setCuitStatus('invalid');
            setCuitMessage(data.message || 'Error al validar el CUIT');
          }
        })
        .catch(err => {
          console.error(err);
          // Permite escribirlo a mano en caso de caída total del sistema
          setCuitStatus('valid');
          setCuitMessage('Servicio de validación no disponible. Ingresa tu Razón Social manualmente.');
        });
    }
  }, [formData.cuit]);

  // Estados para la API de Georef
  const [provincias, setProvincias] = useState<SelectOption[]>([]);
  const [localidades, setLocalidades] = useState<SelectOption[]>([]);
  const [selectedProvincia, setSelectedProvincia] = useState<string>('');
  const [selectedLocalidad, setSelectedLocalidad] = useState<string>('');
  const [loadingLocalidades, setLoadingLocalidades] = useState(false);

  // Cargar provincias
  useEffect(() => {
    fetch('https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre&orden=nombre')
      .then(res => {
        if (!res.ok) throw new Error('API request failed');
        return res.json();
      })
      .then(data => {
        const provs = (data.provincias || []).map((p: any) => ({ value: p.nombre, label: p.nombre }));
        if (provs.length === 0) throw new Error('Empty data');
        setProvincias(provs);
      })
      .catch(err => {
        console.warn('Error cargando provincias:', err);
        setProvincias([
          { value: 'Buenos Aires', label: 'Buenos Aires' },
          { value: 'Ciudad Autónoma de Buenos Aires', label: 'Ciudad Autónoma de Buenos Aires' },
          { value: 'Córdoba', label: 'Córdoba' },
          { value: 'Santa Fe', label: 'Santa Fe' },
          { value: 'Mendoza', label: 'Mendoza' }
        ]);
      });
  }, []);

  // Cargar localidades combinando localidades y municipios de Georef API
  useEffect(() => {
    if (selectedProvincia) {
      setLoadingLocalidades(true);
      const provEnc = encodeURIComponent(selectedProvincia);
      Promise.allSettled([
        fetch(`https://apis.datos.gob.ar/georef/api/localidades?provincia=${provEnc}&campos=id,nombre&max=1000&orden=nombre`).then(r => r.json()),
        fetch(`https://apis.datos.gob.ar/georef/api/municipios?provincia=${provEnc}&campos=id,nombre&max=1000&orden=nombre`).then(r => r.json())
      ]).then(([locRes, munRes]) => {
        const locNames = locRes.status === 'fulfilled' ? (locRes.value.localidades || []).map((l: any) => l.nombre) : [];
        const munNames = munRes.status === 'fulfilled' ? (munRes.value.municipios || []).map((l: any) => l.nombre) : [];
        const combined = Array.from(new Set([...locNames, ...munNames])).sort();

        setSelectedLocalidad(prev => {
          const finalNames = Array.from(new Set(prev ? [prev, ...combined] : combined));
          setLocalidades(finalNames.map(name => ({ value: name, label: name })));
          setLoadingLocalidades(false);
          return prev || '';
        });
      }).catch(err => {
        setLoadingLocalidades(false);
      });
    } else {
      setLocalidades([]);
      setSelectedLocalidad('');
    }
  }, [selectedProvincia]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const field = e.target.name || e.target.id;
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // Remover todo lo que no sea numero
    if (val.length > 8) val = val.substring(0, 8);
    
    // Auto-corregir día
    if (val.length >= 1 && parseInt(val[0]) > 3) val = '0' + val[0] + val.substring(1);
    if (val.length >= 2) {
      const day = parseInt(val.substring(0, 2));
      if (day > 31) val = '31' + val.substring(2);
      if (day === 0) val = '01' + val.substring(2);
    }
    
    // Auto-corregir mes
    if (val.length >= 3 && parseInt(val[2]) > 1) val = val.substring(0, 2) + '0' + val[2] + val.substring(3);
    if (val.length >= 4) {
      const month = parseInt(val.substring(2, 4));
      if (month > 12) val = val.substring(0, 2) + '12' + val.substring(4);
      if (month === 0) val = val.substring(0, 2) + '01' + val.substring(4);
    }
    
    let masked = val;
    // Auto agregar barras: DD/MM/AAAA
    if (val.length > 4) {
      masked = val.substring(0, 2) + '/' + val.substring(2, 4) + '/' + val.substring(4, 8);
    } else if (val.length > 2) {
      masked = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    
    setFormData(prev => ({ ...prev, dob: masked }));
  };

  // Sistema de notificaciones Toast premium
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000); // Ocultar después de 4 segundos
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de Persona Jurídica
    if (formData.tipoPersona === 'juridica') {
      if (!formData.cuit || formData.cuit.trim() === '') {
        showToast('Debes ingresar el CUIT obligatoriamente (Persona Jurídica).', 'error');
        return;
      }
      if (cuitStatus === 'invalid') {
        showToast('El CUIT ingresado es inválido. Por favor, corrígelo.', 'error');
        return;
      }
      if (cuitStatus === 'loading') {
        showToast('Espera a que termine la validación del CUIT en AFIP.', 'info');
        return;
      }
    }

    // Validación General: Teléfono obligatorio
    if (!formData.telefono || formData.telefono.trim() === '') {
      showToast('El número de teléfono es obligatorio.', 'error');
      return;
    }

    // Validación de Persona Física
    if (formData.tipoPersona === 'fisica') {
      if (!formData.dob || formData.dob.trim() === '') {
        showToast('Debes ingresar tu edad/fecha de nacimiento obligatoriamente (Persona Física).', 'error');
        return;
      }
    }
    
    // Validar formato fecha de nacimiento si está presente
    if (formData.dob && formData.dob.trim() !== '') {
      const dobRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = formData.dob.match(dobRegex);
      
      if (!match) {
        showToast('Por favor, completa tu fecha de nacimiento en formato DD/MM/AAAA.', 'error');
        return;
      }
      
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      
      // Verificar que la fecha exista (ej: 31 de Febrero es inválido)
      const dateObj = new Date(year, month - 1, day);
      if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
        showToast('La fecha de nacimiento no es válida en el calendario.', 'error');
        return;
      }
      
      // Verificar límites de edad
      const today = new Date();
      let age = today.getFullYear() - year;
      const m = today.getMonth() - dateObj.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dateObj.getDate())) {
        age--;
      }
      
      if (age < 14) {
        showToast('Debes tener al menos 14 años para usar esta plataforma.', 'error');
        return;
      }
      if (age > 110) {
        showToast('Por favor ingresa un año de nacimiento válido.', 'error');
        return;
      }
    }

    updateUser({
      username: formData.username,
      avatar: (formData as any).avatar,
      personType: formData.tipoPersona,
      birthDate: formData.dob,
      cuit: formData.cuit,
      phone: formData.telefono,
      contactEmail: formData.contactEmail,
      firstName: formData.nombre,
      lastName: formData.apellido,
      storeName: formData.storeName,
      storeDescription: formData.storeDescription,
      street: formData.calle,
      streetNumber: formData.numero,
      province: selectedProvincia,
      locality: selectedLocalidad,
      socialMedia: redesSociales,
      branches: sucursales,
      schedules: horarios,
      role: !isVendor ? 'negocio' : undefined
    });

    // Actualizar retroactivamente el nombre de la tienda en los productos ya creados
    const existingStr = localStorage.getItem('cazamarket_my_products');
    if (existingStr) {
      try {
        let existing = JSON.parse(existingStr);
        existing = existing.map((p: any) => {
          if (p.storeId === 1) { // Solo actualizar los productos propios (mockeado como storeId 1)
            p.store = formData.storeName || formData.username || 'Mi Negocio';
            if ((formData as any).avatar) {
              p.avatar = (formData as any).avatar;
            }
          }
          return p;
        });
        localStorage.setItem('cazamarket_my_products', JSON.stringify(existing));
      } catch(e) {}
    }

    showToast('Configuración guardada exitosamente.', 'success');
  };

  const handleDelete = () => {
    const confirm = window.confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.');
    if (confirm) {
      showToast('Cuenta eliminada.', 'info');
      setTimeout(() => window.location.href = '/', 1500);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('La imagen es muy grande (máximo 2MB).', 'error');
        return;
      }
      
      setIsUploading(true);
      showToast('Subiendo imagen...', 'info');

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${username || 'user'}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('MediaCazaMarket')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage.from('MediaCazaMarket').getPublicUrl(filePath);

        if (data && data.publicUrl) {
          setFormData(prev => ({ ...prev, avatar: data.publicUrl }));
          showToast('Foto subida exitosamente (recuerda guardar cambios).', 'success');
        }
      } catch (error: any) {
        showToast(`Error al subir la imagen: ${error.message}`, 'error');
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="config-container compact">
      
      {/* Toast Notification Container */}
      {toast && (
        <div className={`config-toast toast-${toast.type}`}>
          {toast.type === 'error' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          )}
          {toast.type === 'success' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          )}
          {toast.type === 'info' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          )}
          <span>{toast.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="config-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '32px' }}>
        
        {/* Banner de Plan Activo */}
        <div className="banner-cell" style={{ padding: '20px 24px', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: '0 0 4px', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>Plan Actual</h4>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Gestiona tu nivel de suscripción</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {productPlanTier !== 'gratis' && (
              <span style={{ 
                background: 'var(--color-primary)', 
                color: '#fff', 
                padding: '6px 14px', 
                borderRadius: 'var(--radius-full)', 
                fontWeight: 600, 
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Productos {productPlanTier.charAt(0).toUpperCase() + productPlanTier.slice(1)}
              </span>
            )}
            {servicePlanTier !== 'gratis' && (
              <span style={{ 
                background: 'rgba(255, 115, 0, 0.15)', 
                border: '1px solid var(--color-primary)',
                color: '#fff', 
                padding: '6px 14px', 
                borderRadius: 'var(--radius-full)', 
                fontWeight: 600, 
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Servicios {servicePlanTier.charAt(0).toUpperCase() + servicePlanTier.slice(1)}
              </span>
            )}
            {productPlanTier === 'gratis' && servicePlanTier === 'gratis' && (
              <span style={{ 
                background: 'rgba(255,255,255,0.1)', 
                color: 'var(--color-text-main)', 
                padding: '6px 14px', 
                borderRadius: 'var(--radius-full)', 
                fontWeight: 600, 
                fontSize: '0.85rem'
              }}>
                Gratis
              </span>
            )}
            <button type="button" onClick={() => window.location.href = '/planes'} style={{ background: 'transparent', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', padding: '6px 16px', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              Cambiar plan
            </button>
          </div>
        </div>

        {/* Caja Principal: Foto y Nombres */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <div className="avatar-cell" style={{ flexShrink: 0 }}>
            <div className="avatar-upload-circle" onClick={() => fileInputRef.current?.click()} title="Subir nueva foto" style={{ overflow: 'hidden', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isUploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)' }}>
                   <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '8px' }}></div>
                   <span style={{ fontSize: '0.8rem' }}>Subiendo...</span>
                </div>
              ) : (formData as any).avatar ? (
                <img src={(formData as any).avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '50px', height: '50px' }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              )}
              {!isUploading && (
                <div className="avatar-overlay">
                  <span>Cambiar</span>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} disabled={isUploading} className="hidden-file-input" accept="image/png, image/jpeg, image/gif" onChange={handleAvatarChange} />
          </div>
          
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group-config">
              <label htmlFor="username">Nombre de Perfil</label>
              <input type="text" id="username" value={formData.username || ''} onChange={handleInputChange} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="form-group-config">
                <label htmlFor="nombre">Nombre Real</label>
                <input type="text" id="nombre" value={formData.nombre || ''} onChange={handleInputChange} required />
              </div>
              <div className="form-group-config">
                <label htmlFor="apellido">Apellido</label>
                <input type="text" id="apellido" value={formData.apellido || ''} onChange={handleInputChange} required />
              </div>
            </div>
          </div>
        </div>

        {/* Acordeón 1: Datos de Contacto */}
        <details className="config-accordion">
          <summary>
            Datos de Contacto 
            <svg className="accordion-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </summary>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginTop: '24px' }}>
            <div className="form-group-config">
              <label htmlFor="authEmail">Correo de inicio de sesión</label>
              <input type="email" id="authEmail" value={email || ''} readOnly title="No puedes cambiar tu correo electrónico directamente" className="readonly-input" />
            </div>
            <div className="form-group-config">
              <label htmlFor="contactEmail">Correo de Contacto (Público)</label>
              <input type="email" id="contactEmail" value={formData.contactEmail || ''} onChange={handleInputChange} placeholder="tu@correo.com" />
            </div>
            <div className="form-group-config">
              <label htmlFor="telefono">Número de teléfono</label>
              <input type="tel" id="telefono" value={formData.telefono || ''} onChange={handleInputChange} placeholder="+54 9 11 1234-5678" />
            </div>
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px dashed var(--color-border)', paddingTop: '24px' }}>
            <h4 style={{ margin: '0 0 16px', color: 'var(--color-text-main)' }}>Redes Sociales</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {redesSociales.map((red, index) => (
                <div key={index} className="form-group-config" style={{ position: 'relative' }}>
                  <label>{red.red}</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {index > 2 && (
                      <input 
                        type="text" 
                        value={red.red} 
                        onChange={(e) => {
                          const newR = [...redesSociales];
                          newR[index].red = e.target.value;
                          setRedesSociales(newR);
                        }} 
                        placeholder="Nombre red social"
                        style={{ width: '40%' }}
                      />
                    )}
                    <input 
                      type="text" 
                      value={red.usuario} 
                      onChange={(e) => {
                        const newR = [...redesSociales];
                        newR[index].usuario = e.target.value;
                        setRedesSociales(newR);
                      }} 
                      placeholder={`@usuario o enlace`} 
                      style={{ width: index > 2 ? '60%' : '100%' }}
                    />
                    {index > 2 && (
                      <button 
                        type="button" 
                        onClick={() => setRedesSociales(prev => prev.filter((_, i) => i !== index))}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0 8px' }}
                        title="Eliminar red social"
                      >×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button 
              type="button" 
              onClick={() => setRedesSociales([...redesSociales, { red: 'Nueva red', usuario: '' }])}
              style={{ marginTop: '16px', background: 'rgba(255,115,0,0.1)', color: 'var(--color-primary)', border: '1px solid rgba(255,115,0,0.3)', padding: '8px 16px', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}
            >
              + Agregar red social
            </button>
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px dashed var(--color-border)', paddingTop: '24px' }}>
            <h4 style={{ margin: '0 0 16px', color: 'var(--color-text-main)' }}>Horarios de Atención</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {horarios.map((h, dayIndex) => (
                <div key={dayIndex} style={{ display: 'flex', flexWrap: 'nowrap', gap: '16px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ width: '85px', fontWeight: 600, fontSize: '0.9rem', color: h.closed ? 'var(--color-text-muted)' : 'var(--color-text-main)' }}>{h.day}</div>
                  
                  <div 
                    onClick={() => {
                      const newH = [...horarios];
                      newH[dayIndex].closed = !newH[dayIndex].closed;
                      setHorarios(newH);
                    }}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', 
                      opacity: h.closed ? 1 : 0.6, width: '90px' 
                    }}
                  >
                    <div style={{
                      width: '36px', height: '20px', borderRadius: '10px',
                      background: h.closed ? '#ef4444' : 'rgba(255,255,255,0.1)',
                      position: 'relative', transition: '0.2s', flexShrink: 0
                    }}>
                      <div style={{
                        width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: '3px', left: h.closed ? '19px' : '3px', transition: '0.2s'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', color: h.closed ? '#ef4444' : 'var(--color-text-muted)' }}>
                      Cerrado
                    </span>
                  </div>
                  
                  {!h.closed && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1, alignItems: 'center' }}>
                      {h.shifts.length === 1 && h.shifts[0].open === '00:00' && h.shifts[0].close === '23:59' ? (
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,115,0,0.1)', color: 'var(--color-primary)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(255,115,0,0.3)' }}>
                          Abierto 24 Horas
                        </div>
                      ) : (
                        <>
                          {h.shifts.map((shift, shiftIndex) => (
                            <div key={shiftIndex} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <input 
                                type="text" 
                                value={shift.open} 
                                placeholder="09:00"
                                onChange={(e) => {
                                  const newH = [...horarios];
                                  newH[dayIndex].shifts[shiftIndex].open = formatWhileTyping(e.target.value);
                                  setHorarios(newH);
                                }}
                                onBlur={() => {
                                  const newH = [...horarios];
                                  newH[dayIndex].shifts[shiftIndex].open = validateTime(shift.open);
                                  setHorarios(newH);
                                }}
                                className="time-input-styled"
                                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.9rem', outline: 'none', width: '45px', textAlign: 'center' }}
                              />
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: '0 4px' }}>a</span>
                              <input 
                                type="text" 
                                value={shift.close} 
                                placeholder="18:00"
                                onChange={(e) => {
                                  const newH = [...horarios];
                                  newH[dayIndex].shifts[shiftIndex].close = formatWhileTyping(e.target.value);
                                  setHorarios(newH);
                                }}
                                onBlur={() => {
                                  const newH = [...horarios];
                                  newH[dayIndex].shifts[shiftIndex].close = validateTime(shift.close);
                                  setHorarios(newH);
                                }}
                                className="time-input-styled"
                                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.9rem', outline: 'none', width: '45px', textAlign: 'center' }}
                              />
                              {h.shifts.length > 1 && (
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const newH = [...horarios];
                                    newH[dayIndex].shifts.splice(shiftIndex, 1);
                                    setHorarios(newH);
                                  }}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', marginLeft: '4px', display: 'flex', alignItems: 'center' }}
                                  title="Eliminar turno"
                                >×</button>
                              )}
                            </div>
                          ))}
                          {h.shifts.length < 2 && (
                            <button 
                              type="button"
                              onClick={() => {
                                const newH = [...horarios];
                                newH[dayIndex].shifts.push({ open: '16:00', close: '20:00' });
                                setHorarios(newH);
                              }}
                              style={{ background: 'none', border: '1px dashed rgba(255,115,0,0.5)', color: 'var(--color-primary)', padding: '4px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
                            >
                              + Turno
                            </button>
                          )}
                        </>
                      )}
                      <button 
                        type="button"
                        onClick={() => {
                          const newH = [...horarios];
                          const is24 = newH[dayIndex].shifts.length === 1 && newH[dayIndex].shifts[0].open === '00:00' && newH[dayIndex].shifts[0].close === '23:59';
                          if (is24) {
                            newH[dayIndex].shifts = [{ open: '09:00', close: '18:00' }];
                          } else {
                            newH[dayIndex].shifts = [{ open: '00:00', close: '23:59' }];
                          }
                          setHorarios(newH);
                        }}
                        style={{ 
                          background: (h.shifts.length === 1 && h.shifts[0].open === '00:00' && h.shifts[0].close === '23:59') ? 'var(--color-primary)' : 'none', 
                          border: (h.shifts.length === 1 && h.shifts[0].open === '00:00' && h.shifts[0].close === '23:59') ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)', 
                          color: (h.shifts.length === 1 && h.shifts[0].open === '00:00' && h.shifts[0].close === '23:59') ? '#fff' : 'var(--color-text-main)', 
                          padding: '4px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, marginLeft: '4px' 
                        }}
                      >
                        24 hs
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </details>

        {/* Acordeón 2: Ubicación */}
        <details className="config-accordion">
          <summary>
            Ubicación 
            <svg className="accordion-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </summary>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginTop: '24px' }}>
            <div className="form-group-config">
              <label>Provincia Principal</label>
              <CustomSelect
                id="provincia"
                options={provincias}
                value={selectedProvincia}
                onChange={setSelectedProvincia}
                placeholder="Seleccione una provincia"
              />
            </div>
            <div className="form-group-config">
              <label>Localidad Principal</label>
              <CustomSelect
                id="localidad"
                options={localidades}
                value={selectedLocalidad}
                onChange={setSelectedLocalidad}
                placeholder={loadingLocalidades ? 'Cargando...' : 'Seleccione una localidad'}
                disabled={!selectedProvincia || loadingLocalidades}
              />
            </div>
            <div className="form-group-config">
              <label htmlFor="calle">Calle (Principal)</label>
              <input type="text" id="calle" value={formData.calle || ''} onChange={handleInputChange} placeholder="Ej. Av. Siempre Viva" />
            </div>
            <div className="form-group-config">
              <label htmlFor="numero">Número / Altura</label>
              <input type="text" id="numero" value={formData.numero || ''} onChange={handleInputChange} placeholder="Ej. 123" />
            </div>
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px dashed var(--color-border)', paddingTop: '24px' }}>
            <h4 style={{ margin: '0 0 16px', color: 'var(--color-text-main)' }}>Otras Sucursales</h4>
            {sucursales.map((suc, index) => (
              <SucursalEditor 
                key={index}
                index={index}
                sucursal={suc}
                provincias={provincias}
                onChange={(updated) => { const newS = [...sucursales]; newS[index] = updated; setSucursales(newS); }}
                onRemove={() => setSucursales(prev => prev.filter((_, i) => i !== index))}
              />
            ))}
            {sucursales.length < permissions.maxSucursales ? (
              <button type="button" onClick={() => setSucursales([...sucursales, { provincia: '', localidad: '', calle: '', numero: '' }])} style={{ background: 'rgba(255,115,0,0.1)', color: 'var(--color-primary)', border: '1px solid rgba(255,115,0,0.3)', padding: '8px 16px', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                + Añadir otra ubicación
              </button>
            ) : (
              <div style={{ padding: '12px', background: 'rgba(255,115,0,0.05)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-muted)', fontSize: '0.9rem', border: '1px solid rgba(255,115,0,0.2)' }}>
                Has alcanzado el límite de <strong>{permissions.maxSucursales} sucursal{permissions.maxSucursales !== 1 && 'es'}</strong> de tu plan actual.
              </div>
            )}
          </div>
        </details>

        {/* Acordeón 3: Datos Obligatorios */}
        <details className="config-accordion">
          <summary>
            Datos Obligatorios 
            <svg className="accordion-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </summary>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginTop: '24px' }}>
            <div className="form-group-config">
              <label htmlFor="tipoPersona">Tipo de persona</label>
              <CustomSelect
                id="tipoPersona"
                options={[
                  { value: 'fisica', label: 'Persona Física' },
                  { value: 'juridica', label: 'Persona Jurídica (Empresa)' }
                ]}
                value={formData.tipoPersona || 'fisica'}
                onChange={(val) => setFormData(prev => ({ ...prev, tipoPersona: val }))}
                placeholder="Seleccione el tipo"
              />
            </div>

            <div className="form-group-config">
              <label htmlFor="telefonoObligatorio">Número de teléfono <span style={{ color: 'var(--color-primary)' }}>*</span></label>
              <input 
                type="tel" 
                id="telefonoObligatorio" 
                name="telefono"
                value={formData.telefono || ''} 
                onChange={handleInputChange} 
                placeholder="+54 9 11 1234-5678" 
              />
            </div>

            {formData.tipoPersona === 'juridica' && (
              <div className="form-group-config">
                <label htmlFor="cuit">CUIT <span style={{ color: 'var(--color-primary)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    id="cuit" 
                    value={formData.cuit || ''} 
                    onChange={handleInputChange} 
                    placeholder="Ej. 30-12345678-9" 
                    style={{ 
                      borderColor: cuitStatus === 'invalid' ? '#ef4444' : cuitStatus === 'valid' ? '#22c55e' : undefined,
                      paddingRight: cuitStatus === 'loading' ? '40px' : '16px'
                    }}
                  />
                  {cuitStatus === 'loading' && (
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                      <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                        <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                      </svg>
                      <style>{`@keyframes spin { 100% { transform: translateY(-50%) rotate(360deg); } }`}</style>
                    </div>
                  )}
                </div>
                {cuitMessage && (
                  <p style={{ 
                    marginTop: '6px', 
                    fontSize: '0.85rem', 
                    color: cuitStatus === 'invalid' ? '#ef4444' : cuitStatus === 'valid' ? '#22c55e' : 'var(--color-text-muted)' 
                  }}>
                    {cuitMessage}
                  </p>
                )}
              </div>
            )}

            {formData.tipoPersona === 'fisica' && (
              <div className="form-group-config">
                <label htmlFor="dob">Fecha de nacimiento / Edad <span style={{ color: 'var(--color-primary)' }}>*</span></label>
                <input 
                  type="text" 
                  id="dob" 
                  value={formData.dob || ''} 
                  onChange={handleDobChange} 
                  placeholder="DD/MM/AAAA" 
                  maxLength={10}
                  title="Ingresa tu fecha de nacimiento en formato DD/MM/AAAA"
                />
              </div>
            )}
          </div>
        </details>

        {/* Botones Fila 5 */}
        <div className="config-actions-row">
          <button type="button" className="btn-delete" onClick={handleDelete}>
            Borrar cuenta
          </button>
          
          <div className="right-actions">
            <button type="button" className="btn-secondary" onClick={() => alert('Simulación: Cambiar contraseña')}>
              Cambiar contraseña
            </button>
            <button type="submit" className="btn-primary highlight-mode">
              Guardar cambios
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
