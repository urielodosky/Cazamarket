'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAtLeast } from '@/types/planTypes';
import CustomSelect from '@/components/ui/CustomSelect';
import type { SelectOption } from '@/components/ui/CustomSelect';
import { CATEGORIES_DATA } from '@/constants/categoriesData';
import { createClient } from '@/lib/supabase/client';
import ImageCropperModal from '@/components/ImageCropperModal';
import getCroppedImg from '@/utils/cropImage';

const PROVINCES_MAP: Record<string, string> = {
  "02": "Ciudad Autónoma de Buenos Aires",
  "06": "Buenos Aires",
  "10": "Catamarca",
  "14": "Córdoba",
  "18": "Corrientes",
  "22": "Chaco",
  "26": "Chubut",
  "30": "Entre Ríos",
  "34": "Formosa",
  "38": "Jujuy",
  "42": "La Pampa",
  "46": "La Rioja",
  "50": "Mendoza",
  "54": "Misiones",
  "58": "Neuquén",
  "62": "Río Negro",
  "66": "Salta",
  "70": "San Juan",
  "74": "San Luis",
  "78": "Santa Cruz",
  "82": "Santa Fe",
  "86": "Santiago del Estero",
  "90": "Tucumán",
  "94": "Tierra del Fuego"
};

function getProvinceName(prov: string) {
  if (!prov) return '';
  return PROVINCES_MAP[prov] || prov;
}

function getSocialUrl(platform: string, handle: string) {
  if (handle.startsWith('http') || handle.startsWith('www')) {
    return handle.startsWith('www') ? `https://${handle}` : handle;
  }
  const cleanHandle = handle.replace(/^@/, '');
  switch (platform.toLowerCase()) {
    case 'instagram': return `https://instagram.com/${cleanHandle}`;
    case 'facebook': return `https://facebook.com/${cleanHandle}`;
    case 'x':
    case 'twitter': return `https://x.com/${cleanHandle}`;
    case 'tiktok': return `https://tiktok.com/@${cleanHandle}`;
    case 'youtube': return `https://youtube.com/@${cleanHandle}`;
    case 'linkedin': return `https://linkedin.com/in/${cleanHandle}`;
    case 'snapchat': return `https://snapchat.com/add/${cleanHandle}`;
    default: return null;
  }
}

function EditButton({ onClick, style, label }: { onClick: () => void, style?: React.CSSProperties, label?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute', zIndex: 20,
        background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
        color: '#fff', borderRadius: 'var(--radius-full)', padding: '6px 12px',
        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500,
        cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'all 0.2s',
        ...style
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      {label && <span>{label}</span>}
    </button>
  );
}

const ensureCategoriesArray = (raw: any, targetLen: number = 3): string[] => {
  const result: string[] = [];
  if (Array.isArray(raw)) {
    for (let i = 0; i < targetLen; i++) {
      result.push(String(raw[i] || ''));
    }
  } else if (typeof raw === 'string' && raw.trim()) {
    result.push(raw.trim());
    for (let i = 1; i < targetLen; i++) {
      result.push('');
    }
  } else {
    for (let i = 0; i < targetLen; i++) {
      result.push('');
    }
  }
  return result;
};

export default function MiNegocioPage() {
  const { isVendorModeActive, username, email, avatar, coverUrl, updateUser, storeDescription, businessType: authBusinessType, storeCategories, storeTheme, phone, province, locality, street, streetNumber, branches, socialMedia, supabaseUser } = useAuth();
  const { permissions, planTier, planDisplayName } = usePlan();
  const themeColors = useThemeColors();
  const [activeTab, setActiveTab] = useState<'productos' | 'servicios' | 'informacion' | 'apariencia'>('productos');
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

  // Appearance State
  const [theme, setTheme] = useState({ primaryColor: '#ff7300', textColor: '#ffffff', bgColor: '#111310' });

  // Editable States
  const [name, setName] = useState(username || 'Mi Negocio');
  const [description, setDescription] = useState(storeDescription || '');
  const [businessType, setBusinessType] = useState(authBusinessType || '');
  const [categories, setCategories] = useState(storeCategories?.length > 0 ? storeCategories : ['', '', '']);
  const [storeBanner, setStoreBanner] = useState(coverUrl || null);

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'avatar' | 'banner' | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [myServices, setMyServices] = useState<any[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Contact and Location states
  const [telefono, setTelefono] = useState(phone || '');
  const [ubicacionPrincipal, setUbicacionPrincipal] = useState<any>({ provincia: province, localidad: locality, calle: street, numero: streetNumber });
  const [sucursales, setSucursales] = useState<any[]>(branches || []);
  const [redesSociales, setRedesSociales] = useState<{ red: string, usuario: string }[]>(socialMedia || []);

  const supabase = createClient();

  React.useEffect(() => {
    const fetchProductsAndServices = async () => {
      if (supabaseUser) {
        try {
          const { data: prods } = await supabase.from('products').select('*').eq('user_id', supabaseUser.id);
          const { data: servs } = await supabase.from('services').select('*').eq('user_id', supabaseUser.id);

          if (prods) setMyProducts(prods);
          if (servs) setMyServices(servs);
        } catch (error) {
          console.error('Error fetching catalog:', error);
        }
      }
    };
    fetchProductsAndServices();
    
    // Sync state if context changes after initial mount
    if (storeTheme) setTheme(storeTheme);
    if (storeDescription) setDescription(storeDescription);
    if (username) setName(username);
    if (authBusinessType) setBusinessType(authBusinessType);
    if (storeCategories?.length > 0) setCategories(storeCategories);
    if (phone) setTelefono(phone);
    if (socialMedia?.length > 0) setRedesSociales(socialMedia);
    if (branches?.length > 0) setSucursales(branches);
    if (coverUrl) setStoreBanner(coverUrl);
  }, [storeTheme, storeDescription, username, authBusinessType, storeCategories, phone, socialMedia, branches, coverUrl]);

  React.useEffect(() => {
    // Auto-select first available tab if default is not available
    if (permissions.maxProductos === 0 && activeTab === 'productos') {
      setActiveTab(permissions.maxServicios > 0 ? 'servicios' : 'informacion');
    } else if (permissions.maxServicios === 0 && activeTab === 'servicios') {
      setActiveTab(permissions.maxProductos > 0 ? 'productos' : 'informacion');
    }
  }, [permissions.maxProductos, permissions.maxServicios, activeTab]);

  const handleDescChange = (newDesc: string) => {
    setDescription(newDesc);
    updateUser({ storeDescription: newDesc });
  };

  const handleThemeChange = (field: string, value: string) => {
    const newTheme = { ...theme, [field]: value };
    setTheme(newTheme);
    updateUser({ storeTheme: newTheme });
  };

  const handleResetTheme = () => {
    const defaultTheme = { primaryColor: '#ff7300', textColor: '#ffffff', bgColor: '#111310' };
    setTheme(defaultTheme);
    updateUser({ storeTheme: defaultTheme });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo excede el límite de 10 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCropImageSrc(event.target.result as string);
          setCropType('avatar');
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo excede el límite de 10 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCropImageSrc(event.target.result as string);
          setCropType('banner');
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropComplete = async (croppedAreaPixels: any) => {
    if (!cropImageSrc || !cropType || !supabaseUser) return;
    setIsUploadingImage(true);
    
    try {
      const blob = await getCroppedImg(cropImageSrc, croppedAreaPixels, 0);
      if (!blob) throw new Error('Error al recortar la imagen');

      const fileExt = 'jpg';
      const fileName = `${cropType}_${Date.now()}.${fileExt}`;
      const filePath = `${supabaseUser.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('MediaCazaMarket')
        .upload(filePath, blob, { contentType: 'image/jpeg', cacheControl: '3600', upsert: true });
        
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('MediaCazaMarket').getPublicUrl(filePath);
      
      if (cropType === 'avatar') {
        updateUser({ avatar: data.publicUrl });
      } else {
        setStoreBanner(data.publicUrl);
        updateUser({ coverUrl: data.publicUrl });
      }
      
      setCropImageSrc(null);
      setCropType(null);
    } catch (err: any) {
      console.error('Error procesando imagen:', err);
      alert('Hubo un error al subir la imagen. Por favor, intenta de nuevo.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteProduct = async (e: React.MouseEvent, id: any) => {
    e.stopPropagation();
    if (supabaseUser) {
      await supabase.from('products').delete().eq('id', id).eq('user_id', supabaseUser.id);
      const updated = myProducts.filter(p => String(p.id) !== String(id));
      setMyProducts(updated);
    }
  };

  const handleDeleteService = async (e: React.MouseEvent, id: any) => {
    e.stopPropagation();
    if (supabaseUser) {
      await supabase.from('services').delete().eq('id', id).eq('user_id', supabaseUser.id);
      const updated = myServices.filter(p => String(p.id) !== String(id));
      setMyServices(updated);
    }
  };

  const handleEdit = (section: string) => {
    alert(`Modo Demo: Acá se abriría el modal para editar: ${section}`);
  };

  if (!isVendorModeActive) {
    return (
      <div style={{ paddingTop: '100px', paddingBottom: 'var(--spacing-8)', paddingLeft: 'var(--spacing-4)', paddingRight: 'var(--spacing-4)', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--color-text-main)' }}>Acceso Denegado</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Debes cambiar al Modo Vendedor para acceder a esta sección.</p>
      </div>
    );
  }

  const customStyles: React.CSSProperties = {
    paddingTop: '40px',
    paddingBottom: '40px',
    ...(permissions.coloresPersonalizados ? {
      '--color-primary': theme.primaryColor,
      '--color-text-main': theme.textColor,
      '--color-bg-base': theme.bgColor
    } as any : {})
  };

  return (
    <div className="container-page" style={customStyles}>

      {/* Limits indicator */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: 'var(--radius-full)', background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
          <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem' }}>Plan: {planDisplayName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: 'var(--radius-full)', background: 'var(--color-bg-surface-elevated)', border: '1px solid var(--color-border)' }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Productos:</span>
          <span style={{ color: themeColors.textWhite, fontWeight: 600, fontSize: '0.85rem' }}>{myProducts.length} / {permissions.maxProductos === Infinity ? '∞' : permissions.maxProductos}</span>
        </div>
        {permissions.maxServicios > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: 'var(--radius-full)', background: 'var(--color-bg-surface-elevated)', border: '1px solid var(--color-border)' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Servicios:</span>
            <span style={{ color: themeColors.textWhite, fontWeight: 600, fontSize: '0.85rem' }}>{myServices.length} / {permissions.maxServicios}</span>
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: 0, position: 'relative' }}>

        {/* Banner */}
        {isAtLeast(planTier, 'emprendedor') ? (
          storeBanner ? (
            <div style={{
              height: '280px',
              backgroundImage: `url(${storeBanner})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              borderTopLeftRadius: 'var(--radius-lg)',
              borderTopRightRadius: 'var(--radius-lg)'
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.8))', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }} />
              <input
                type="file"
                ref={bannerInputRef}
                onChange={handleBannerChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <EditButton onClick={() => bannerInputRef.current?.click()} style={{ top: '16px', right: '16px' }} label="Cambiar Portada" />
              <div style={{ position: 'absolute', top: '64px', right: '16px', color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', pointerEvents: 'none' }}>Recomendado: 1200x400 px</div>
            </div>
          ) : (
            <div style={{ height: '80px', position: 'relative', background: 'var(--color-bg-surface-elevated)', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }}>
              <input
                type="file"
                ref={bannerInputRef}
                onChange={handleBannerChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <EditButton onClick={() => bannerInputRef.current?.click()} style={{ top: '24px', right: '16px' }} label="Añadir Portada" />
            </div>
          )
        ) : (
          <div style={{ height: '80px', position: 'relative', background: 'var(--color-bg-surface-elevated)', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }}>
            <Link href="/planes" style={{ position: 'absolute', top: '16px', right: '16px', padding: '6px 12px', background: 'rgba(255,115,0,0.1)', color: 'var(--color-primary)', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,115,0,0.2)' }}>
              Mejorar plan para Banner
            </Link>
          </div>
        )}

        <div style={{ padding: '0 var(--spacing-5) var(--spacing-5) var(--spacing-5)', position: 'relative' }}>

          {/* Header Info (Avatar & Title) */}
          <div style={{
            display: 'flex',
            gap: '32px',
            alignItems: 'flex-end',
            marginTop: (isAtLeast(planTier, 'emprendedor') && storeBanner) ? '-60px' : '-40px',
            marginBottom: '32px',
            position: 'relative',
            zIndex: 10
          }}>
            {/* Avatar */}
            <div
              style={{ position: 'relative', cursor: 'pointer' }}
              onMouseEnter={() => setIsAvatarHovered(true)}
              onMouseLeave={() => setIsAvatarHovered(false)}
            >
              <div style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                border: '6px solid var(--color-bg-surface)',
                backgroundImage: `url(${avatar || 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=200&auto=format&fit=crop'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: 'var(--color-bg-surface-elevated)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                flexShrink: 0,
                position: 'relative'
              }}>
                {permissions.insigniaVerificada && (
                  <div title="Negocio Verificado" style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'var(--color-bg-surface)', borderRadius: '50%', padding: '4px', display: 'flex', border: '2px solid var(--color-bg-surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="var(--color-bg-surface)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                  </div>
                )}
              </div>
              {isAvatarHovered && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                  <EditButton onClick={() => fileInputRef.current?.click()} style={{ bottom: '24px', left: '50%', transform: 'translateX(-50%)', padding: '8px', background: 'rgba(0,0,0,0.8)' }} />
                  <div style={{ position: 'absolute', bottom: '-28px', left: '50%', transform: 'translateX(-50%)', width: '150px', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: '4px', zIndex: 30, pointerEvents: 'none', whiteSpace: 'nowrap' }}>Recomendado: 400x400 px</div>
                </>
              )}
            </div>

            {/* Title & Key Stats */}
            <div style={{ flex: 1, paddingBottom: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: '100%', maxWidth: '600px' }}>
                  {isEditingName ? (
                    <input
                      autoFocus
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => {
                        setIsEditingName(false);
                        updateUser({ username: name, avatar });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setIsEditingName(false);
                          updateUser({ username: name, avatar });
                        }
                      }}
                      style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 12px 0', color: '#fff', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--color-primary)', borderRadius: 'var(--radius-md)', padding: '4px 12px', width: '100%', outline: 'none', lineHeight: 1.1 }}
                    />
                  ) : (
                    <h1
                      onClick={() => setIsEditingName(true)}
                      style={{ fontSize: '2.5rem', margin: '0 0 12px 0', color: '#fff', lineHeight: 1.1, cursor: 'pointer', display: 'inline-block', borderBottom: '1px dashed rgba(255,255,255,0.2)' }}
                      title="Clic para editar el nombre"
                    >
                      {name}
                    </h1>
                  )}
                  {/* Rating block removed */}
                </div>
              </div>
            </div>
          </div>

          {/* Description & Tags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px', position: 'relative', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', position: 'relative', zIndex: 15 }}>
              <div style={{ minWidth: '200px' }}>
                <CustomSelect
                  options={[
                    { value: '', label: 'Tipo de Negocio' },
                    { value: 'Mayorista', label: 'Mayorista' },
                    { value: 'Minorista', label: 'Minorista' },
                    { value: 'Mixto', label: 'Mixto' }
                  ]}
                  value={businessType || ''}
                  onChange={(val) => {
                    setBusinessType(val);
                    updateUser({ businessType: val });
                  }}
                  placeholder="Tipo de Negocio"
                />
              </div>

              {Array.from({ length: permissions.maxCategorias || 3 }).map((_, index) => {
                const selectedOthers = categories.filter((cat, idx) => idx !== index && cat && cat.trim() !== '');
                const availableCategories = CATEGORIES_DATA.filter(c => !selectedOthers.includes(c.name));

                return (
                  <div key={index} style={{ minWidth: '220px', flex: 1 }}>
                    <CustomSelect
                      options={[
                        { value: '', label: `Categoría ${index + 1}` },
                        ...availableCategories.map(c => ({ value: c.name, label: c.name }))
                      ]}
                      value={categories[index] || ''}
                      onChange={(val) => {
                        const newCats = ensureCategoriesArray(categories, permissions.maxCategorias || 3);
                        newCats[index] = val;
                        setCategories(newCats);
                        updateUser({ storeCategories: newCats });
                      }}
                      placeholder={`Categoría ${index + 1}`}
                    />
                  </div>
                );
              })}
            </div>

            {isEditingDesc ? (
              <textarea
                autoFocus
                value={description}
                onChange={(e) => handleDescChange(e.target.value)}
                onBlur={() => setIsEditingDesc(false)}
                rows={3}
                placeholder="Describe tu negocio en pocas palabras..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-main)', fontSize: '1.05rem', lineHeight: 1.6, padding: '12px', border: '1px dashed var(--color-primary)', borderRadius: 'var(--radius-md)', outline: 'none', resize: 'vertical' }}
              />
            ) : (
              <p
                onClick={() => setIsEditingDesc(true)}
                title="Clic para editar la descripción"
                style={{ color: description ? 'var(--color-text-muted)' : 'var(--color-text-muted)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '900px', margin: 0, cursor: 'pointer', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '4px', display: 'inline-block', opacity: description ? 1 : 0.6 }}
              >
                {description || 'Haz clic aquí para añadir una descripción a tu tienda...'}
              </p>
            )}
          </div>

          {/* Tabs Navigation */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '32px' }}>
            {['productos', 'servicios', 'informacion', ...(permissions.coloresPersonalizados ? ['apariencia'] : [])].map(tab => {
              if (tab === 'servicios' && permissions.maxServicios === 0) return null;
              if (tab === 'productos' && permissions.maxProductos === 0) return null;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  style={{
                    padding: '16px 32px',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: activeTab === tab ? '3px solid var(--color-primary)' : '3px solid transparent',
                    background: 'none',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab === 'informacion' ? 'Información De Contacto' : tab === 'apariencia' ? 'Apariencia' : `Mis ${tab}`}
                </button>
              );
            })}
          </div>

          {/* Tab Content Area */}
          <div style={{ minHeight: '400px' }}>

            {/* APARIENCIA TAB */}
            {activeTab === 'apariencia' && permissions.coloresPersonalizados && (
              <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.8rem', margin: 0 }}>Colores Personalizados</h3>
                  <button
                    onClick={handleResetTheme}
                    style={{
                      background: themeColors.bgSubtle2,
                      border: `1px solid ${themeColors.borderSubtle2}`,
                      color: themeColors.textWhite,
                      padding: '6px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = themeColors.bgSubtle3; e.currentTarget.style.borderColor = themeColors.borderSubtle3; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = themeColors.bgSubtle2; e.currentTarget.style.borderColor = themeColors.borderSubtle2; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
                    Restablecer
                  </button>
                </div>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
                  Ajusta los colores de tu tienda pública. Estos cambios se aplicarán automáticamente.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: themeColors.bgSubtle2, padding: '20px', borderRadius: 'var(--radius-md)', border: `1px solid ${themeColors.borderSubtle2}` }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>Color Principal</h4>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Botones, íconos y detalles destacados</div>
                    </div>
                    <input
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: themeColors.bgSubtle2, padding: '20px', borderRadius: 'var(--radius-md)', border: `1px solid ${themeColors.borderSubtle2}` }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>Color de Texto</h4>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>El color de los textos principales</div>
                    </div>
                    <input
                      type="color"
                      value={theme.textColor}
                      onChange={(e) => handleThemeChange('textColor', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: themeColors.bgSubtle2, padding: '20px', borderRadius: 'var(--radius-md)', border: `1px solid ${themeColors.borderSubtle2}` }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>Color de Fondo</h4>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Fondo general de tu página de negocio</div>
                    </div>
                    <input
                      type="color"
                      value={theme.bgColor}
                      onChange={(e) => handleThemeChange('bgColor', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '40px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--color-text-main)' }}>Vista Previa de Tarjeta Pública</h4>
                  <div style={{ 
                    maxWidth: '400px', 
                    margin: '0 auto',
                    '--color-primary': theme.primaryColor,
                    '--color-text-main': theme.textColor,
                    '--color-bg-base': theme.bgColor
                  } as any}>
                    <div className="glass-panel" style={{ backgroundColor: theme.bgColor, position: 'relative', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', textAlign: 'left', padding: 0 }}>
                      
                      {(isAtLeast(planTier, 'emprendedor') && storeBanner) && (
                        <div className="aspect-image-16-9" style={{ minHeight: '120px', height: '120px', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', position: 'relative', overflow: 'hidden' }}>
                          <img src={storeBanner} alt="Banner" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6))' }} />
                        </div>
                      )}

                      <div className="card-content-fluid" style={{ paddingTop: (isAtLeast(planTier, 'emprendedor') && storeBanner) ? '0px' : '24px', display: 'flex', flexDirection: 'column', flex: 1, padding: '0 24px 24px 24px' }}>
                        
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', position: 'relative', zIndex: 20, alignItems: 'center' }}>
                          <div style={{ 
                            width: (isAtLeast(planTier, 'emprendedor') && storeBanner) ? '64px' : '48px', 
                            height: (isAtLeast(planTier, 'emprendedor') && storeBanner) ? '64px' : '48px', 
                            borderRadius: '50%',
                            border: '3px solid var(--color-bg-base)',
                            backgroundImage: `url(${avatar || 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=200&auto=format&fit=crop'})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundColor: 'var(--color-bg-surface-elevated)',
                            flexShrink: 0,
                            position: 'relative',
                            marginTop: (isAtLeast(planTier, 'emprendedor') && storeBanner) ? '-32px' : '0'
                          }}>
                            {permissions.insigniaVerificada && (
                              <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-bg-base)' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              </span>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0, marginTop: (isAtLeast(planTier, 'emprendedor') && storeBanner) ? '8px' : '0' }}>
                            <h3 style={{ fontSize: '1.25rem', margin: '0 0 4px 0', color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</h3>
                            {businessType && <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>{businessType}</span>}
                          </div>
                        </div>

                        <p style={{ color: 'var(--color-text-main)', opacity: 0.8, fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {description || 'Sin descripción'}
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                          {categories.filter(c => c).map((cat, idx) => (
                            <span key={idx} style={{ background: 'rgba(255,115,0,0.1)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600 }}>
                              {cat}
                            </span>
                          ))}
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <button style={{ width: '100%', background: 'transparent', border: '1px solid var(--color-primary)', color: 'var(--color-text-main)', padding: '8px', borderRadius: 'var(--radius-full)', fontSize: '0.9rem', fontWeight: 600 }}>
                            Visitar Tienda
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PRODUCTOS TAB */}
            {activeTab === 'productos' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Catálogo de Productos</h3>
                  <Link href="/mis-tiendas/nuevo-producto" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 600, borderRadius: 'var(--radius-full)', background: 'var(--color-primary)', color: '#fff', border: 'none', textDecoration: 'none' }}>
                    + Nuevo Producto
                  </Link>
                </div>

                {myProducts.length === 0 ? (
                  <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '100px 20px', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ color: 'var(--color-text-main)', marginBottom: '8px' }}>Aún no has creado ningún producto</h3>
                    <p>Haz clic en el botón de "+ Nuevo Producto" para comenzar a poblar tu catálogo.</p>
                  </div>
                ) : (
                  <div className="responsive-grid-250">
                    {myProducts.slice(0, permissions.maxProductos).map(producto => (
                      <div key={producto.id} className="glass-panel"
                        onClick={() => router.push(`/productos/${producto.id}`)}
                        style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>

                        <div className="aspect-image-4-3" style={{ backgroundImage: `url(${producto.image})` }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === producto.id ? null : producto.id); }}
                            style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 20, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'}
                            title="Opciones"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                          </button>

                          {openMenuId === producto.id && (
                            <div style={{ position: 'absolute', top: '46px', right: '10px', zIndex: 30, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', minWidth: '120px' }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); router.push(`/mis-tiendas/nuevo-producto?editId=${producto.id}`); }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-main)', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                Editar
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleDeleteProduct(e, producto.id); }}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="card-content-fluid" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '16px' }}>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ color: 'var(--color-primary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              {producto.store}
                            </span>
                            <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                              {producto.category}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-main)', margin: '0 0 var(--spacing-2) 0' }}>{producto.name}</h3>

                          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.4, margin: '0 0 var(--spacing-4) 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {producto.description}
                          </p>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                            <div>
                              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{producto.condition}</span>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                {producto.price.includes(' ') ? (
                                  <>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#a8b87c' }}>{producto.price.split(' ').slice(1).join(' ')}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#a8b87c' }}>{producto.price.split(' ')[0]}</span>
                                  </>
                                ) : (
                                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#a8b87c' }}>{producto.price}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SERVICIOS TAB */}
            {activeTab === 'servicios' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Catálogo de Servicios</h3>
                  <Link href="/mis-tiendas/nuevo-servicio" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 600, borderRadius: 'var(--radius-full)', background: 'var(--color-primary)', color: '#fff', border: 'none', textDecoration: 'none' }}>
                    + Nuevo Servicio
                  </Link>
                </div>

                {myServices.length === 0 ? (
                  <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '100px 20px', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--color-primary)', opacity: 0.8 }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                    </div>
                    <h3 style={{ color: 'var(--color-text-main)', marginBottom: '8px' }}>Aún no has creado ningún servicio</h3>
                    <p>Haz clic en el botón de "+ Nuevo Servicio" para ofrecer tus experiencias.</p>
                  </div>
                ) : (
                  <div className="responsive-grid-250">
                    {myServices.slice(0, permissions.maxServicios).map(servicio => (
                      <div key={servicio.id} className="glass-panel"
                        onClick={() => router.push(`/servicios/${servicio.id}`)}
                        style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>

                        <div className="aspect-image-4-3" style={{ backgroundImage: `url(${servicio.image})` }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === servicio.id ? null : servicio.id); }}
                            style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 20, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'}
                            title="Opciones"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                          </button>

                          {openMenuId === servicio.id && (
                            <div style={{ position: 'absolute', top: '46px', right: '10px', zIndex: 30, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', minWidth: '120px' }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); router.push(`/mis-tiendas/nuevo-servicio?editId=${servicio.id}`); }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-main)', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                Editar
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleDeleteService(e, servicio.id); }}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="card-content-fluid" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '16px' }}>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ color: 'var(--color-primary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              {servicio.store}
                            </span>
                            <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                              {servicio.category}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-main)', margin: '0 0 var(--spacing-2) 0' }}>{servicio.name}</h3>

                          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.4, margin: '0 0 var(--spacing-4) 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {servicio.description}
                          </p>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                            <div>
                              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{servicio.condition}</span>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                {servicio.price.includes(' ') ? (
                                  <>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#a8b87c' }}>{servicio.price.split(' ').slice(1).join(' ')}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#a8b87c' }}>{servicio.price.split(' ')[0]}</span>
                                  </>
                                ) : (
                                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#a8b87c' }}>{servicio.price}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* INFORMACION TAB */}
            {activeTab === 'informacion' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px', position: 'relative', padding: '24px', background: themeColors.bgSubtle3, borderRadius: 'var(--radius-md)' }}>
                <EditButton onClick={() => router.push('/configuracion')} style={{ top: '24px', right: '24px' }} label="Editar en Configuración" />

                <div>
                  <h3 style={{ margin: '0 0 24px 0', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    Contacto Directo
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: themeColors.textWhite, fontSize: '1.05rem', maxWidth: '600px' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${themeColors.borderSubtle2}`, paddingBottom: '12px' }}>
                      <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Horarios
                      </span>
                      <strong>Lunes a Viernes - 09:00 a 18:00</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${themeColors.borderSubtle2}`, paddingBottom: '12px' }}>
                      <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        Teléfono
                      </span>
                      {isAtLeast(planTier, 'emprendedor') && telefono ? (
                        <a
                          href={`https://wa.me/${telefono.replace(/\\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 'bold' }}
                        >
                          {telefono}
                        </a>
                      ) : (
                        <strong style={{ color: 'var(--color-primary)' }}>{telefono || 'No especificado'}</strong>
                      )}
                    </div>

                    {redesSociales.filter(r => r.usuario).map((red, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${themeColors.borderSubtle2}`, paddingBottom: '12px' }}>
                        <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                          {red.red}
                        </span>
                        {isAtLeast(planTier, 'emprendedor') ? (
                          <a
                            href={getSocialUrl(red.red, red.usuario) || '#'}
                            target={getSocialUrl(red.red, red.usuario) ? "_blank" : "_self"}
                            rel="noopener noreferrer"
                            style={{ color: themeColors.textWhite, textDecoration: 'none', fontWeight: 'bold' }}
                          >
                            {red.usuario.startsWith('@') || red.usuario.startsWith('http') || red.usuario.startsWith('www') ? red.usuario : `@${red.usuario}`}
                          </a>
                        ) : (
                          <strong style={{ color: themeColors.textWhite }}>
                            {red.usuario.startsWith('@') || red.usuario.startsWith('http') || red.usuario.startsWith('www') ? red.usuario : `@${red.usuario}`}
                          </strong>
                        )}
                      </div>
                    ))}

                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <h3 style={{ margin: '0 0 24px 0', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    Ubicaciones y Sucursales
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>

                    {/* Sede Principal */}
                    {ubicacionPrincipal && (ubicacionPrincipal.provincia || ubicacionPrincipal.calle) && (
                      <div style={{ background: themeColors.bgSubtle2, padding: '20px', borderRadius: 'var(--radius-lg)', border: `1px solid ${themeColors.borderSubtle2}` }}>
                        <div style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Sede Principal</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px', color: themeColors.textWhite }}>{ubicacionPrincipal.calle} {ubicacionPrincipal.numero}</div>
                        <div style={{ color: 'var(--color-text-muted)' }}>{ubicacionPrincipal.localidad}{ubicacionPrincipal.localidad && ubicacionPrincipal.provincia ? ', ' : ''}{ubicacionPrincipal.provincia}</div>
                      </div>
                    )}

                    {/* Otras Sucursales */}
                    {sucursales.map((suc, idx) => (
                      <div key={idx} style={{ background: themeColors.bgSubtle2, padding: '20px', borderRadius: 'var(--radius-lg)', border: `1px solid ${themeColors.borderSubtle2}` }}>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Sucursal {idx + 1}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px', color: themeColors.textWhite }}>{suc.calle} {suc.numero}</div>
                        <div style={{ color: 'var(--color-text-muted)' }}>{suc.localidad}{suc.localidad && suc.provincia ? ', ' : ''}{suc.provincia}</div>
                      </div>
                    ))}

                    {(!ubicacionPrincipal || (!ubicacionPrincipal.provincia && !ubicacionPrincipal.calle)) && sucursales.length === 0 && (
                      <div style={{ color: 'var(--color-text-muted)', padding: '20px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)' }}>
                        No has configurado ninguna ubicación. <a href="/configuracion" style={{ color: 'var(--color-primary)' }}>Configurar ahora</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {cropImageSrc && cropType && (
        <ImageCropperModal
          imageSrc={cropImageSrc}
          aspect={cropType === 'avatar' ? 1 : 3 / 1}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setCropImageSrc(null);
            setCropType(null);
          }}
          title={cropType === 'avatar' ? 'Ajustar Foto de Perfil' : 'Ajustar Portada'}
        />
      )}
      
      {isUploadingImage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem' }}>
          Subiendo imagen...
        </div>
      )}
    </div>
  );
}
