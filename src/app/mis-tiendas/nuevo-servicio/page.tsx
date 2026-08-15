'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import CustomSelect from '@/components/ui/CustomSelect';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { usePlan } from '@/contexts/PlanContext';
import VirtualAdvisorModal from '@/components/chat/VirtualAdvisorModal';
import { SERVICE_MAIN_CATEGORIES, getSubcategoriesForCategory } from '@/constants/categoriesData';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import ImageCropperModal from '@/components/ImageCropperModal';
import getCroppedImg from '@/utils/cropImage';
import BookingCalendar from '@/components/ui/BookingCalendar';

const LocationMap = dynamic(() => import('@/components/ui/LocationMap'), { ssr: false, loading: () => <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)'}}>Cargando satélite...</div> });
const AreaMap = dynamic(() => import('@/components/ui/AreaMap'), { ssr: false, loading: () => <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)'}}>Cargando mapa de cobertura...</div> });

const DateMaskInput = ({ value, onChange, placeholder }: { value: string, onChange: (v: string) => void, placeholder?: string }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, ''); // keep only numbers
    if (input.length > 8) input = input.slice(0, 8);

    let dd = input.slice(0, 2);
    if (dd.length === 2 && parseInt(dd, 10) > 31) dd = '31';
    if (dd.length === 2 && parseInt(dd, 10) === 0) dd = '01';

    let mm = input.slice(2, 4);
    if (mm.length === 2 && parseInt(mm, 10) > 12) mm = '12';
    if (mm.length === 2 && parseInt(mm, 10) === 0) mm = '01';

    let yyyy = input.slice(4, 8);

    let res = dd;
    if (input.length >= 3) res += '/' + mm;
    if (input.length >= 5) res += '/' + yyyy;

    onChange(res);
  };
  return (
    <input 
      type="text" 
      placeholder={placeholder || "DD/MM/AAAA"} 
      value={value} 
      onChange={handleChange}
      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }} 
      onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'} 
      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
      maxLength={10}
    />
  );
};

function NuevoServicioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('editId');
  const { username, avatar: userAvatar, supabaseUser } = useAuth();
  const { hasFeature, permissions } = usePlan();
  
  const canUseBot = hasFeature('botAsesor');
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
  
  const [stockMode, setStockMode] = useState<'definido' | 'no_necesario'>('no_necesario');
  const [mediaPreview, setMediaPreview] = useState<{url: string, type: string, file: File | null}[]>([]);
  const [pendingCropQueue, setPendingCropQueue] = useState<{file: File, type: string, src: string}[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [storeCategories, setStoreCategories] = useState<string[]>([]);
  
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('nuevo');
  const [stock, setStock] = useState('1');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [pricePeriod, setPricePeriod] = useState('único');
  const [usesCalendar, setUsesCalendar] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  
  const [serviceLocation, setServiceLocation] = useState('');
  const [showServiceArea, setShowServiceArea] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [areaPoints, setAreaPoints] = useState<any[]>([]);
  const [serviceLocationCoords, setServiceLocationCoords] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState(1);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const searchTimeout = useRef<any>(null);

  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');

  const addFeature = () => {
    if (featureInput.trim()) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput('');
    }
  };
  const removeFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const [hasDiscount, setHasDiscount] = useState(false);
  const [hasBaseDiscount, setHasBaseDiscount] = useState(false);
  const [discountName, setDiscountName] = useState('');
  const [discountType, setDiscountType] = useState<'porcentaje' | 'fijo'>('porcentaje');
  const [discountValue, setDiscountValue] = useState('');
  
  const [timeDiscounts, setTimeDiscounts] = useState<{minTime: string, type: 'porcentaje' | 'fijo', value: string}[]>([]);
  const [earlyBirdDiscounts, setEarlyBirdDiscounts] = useState<{minDays: string, type: 'porcentaje' | 'fijo', value: string}[]>([]);
  const [seasonRules, setSeasonRules] = useState<{name: string, startDate: string, endDate: string, adjustmentType: 'aumento' | 'descuento', type: 'porcentaje' | 'fijo', value: string}[]>([]);
  const [volumeDiscounts, setVolumeDiscounts] = useState<{minTime: string, type: 'porcentaje' | 'fijo', value: string}[]>([]);

  const [vendorLocations, setVendorLocations] = useState<any[]>([]);

  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cazamarket_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.locations && Array.isArray(parsed.locations)) {
          setVendorLocations(parsed.locations);
        }
        if (parsed.categories && Array.isArray(parsed.categories)) {
          setStoreCategories(parsed.categories.filter((c: any) => typeof c === 'string' && c.trim() !== ''));
        }
      } catch(e) {}
    }
    
    if (editId) {
      // In a real app, fetch from supabase
    }
  }, [editId]);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      let errorMsg: string | null = null;
      
      let imageCount = mediaPreview.filter(m => m.type === 'image').length;
      let videoCount = mediaPreview.filter(m => m.type === 'video').length;

      for (const file of newFiles) {
        if (mediaPreview.some(m => m.file?.name === file.name && m.file?.size === file.size)) {
          errorMsg = 'El archivo ya fue subido.';
          continue;
        }

        const isVideo = file.type.startsWith('video/');
        
        // --- 1. Seguridad: Validación de Tipo ---
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
        if (!validTypes.includes(file.type)) {
          errorMsg = `El tipo de archivo ${file.type} no es seguro o no está soportado.`;
          continue;
        }

        const maxSize = isVideo ? 25 * 1024 * 1024 : 10 * 1024 * 1024; // 25MB video, 10MB imagen
        if (file.size > maxSize) {
          errorMsg = `El archivo ${file.name} excede el límite de tamaño permitido (${isVideo ? '25MB' : '10MB'}).`;
          continue;
        }
        
        if (isVideo) {
          if (videoCount >= 2) {
            errorMsg = 'Máximo de 2 videos alcanzado.';
            continue;
          }
          videoCount++;
          const blobUrl = URL.createObjectURL(file);
          setMediaPreview(prev => [...prev, { url: blobUrl, type: 'video', file: file }]);
        } else {
          if (imageCount >= 8) {
            errorMsg = 'Máximo de 8 imágenes alcanzado.';
            continue;
          }
          imageCount++;
          const blobUrl = URL.createObjectURL(file);
          setPendingCropQueue(prev => [...prev, { file, type: 'image', src: blobUrl }]);
        }
      }
      
      if (errorMsg) {
        setUploadError(errorMsg);
        setTimeout(() => setUploadError(null), 3000);
      }
      
      e.target.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setMediaPreview(prev => {
      const newPreview = [...prev];
      if (newPreview[index].url.startsWith('blob:')) {
        URL.revokeObjectURL(newPreview[index].url);
      }
      newPreview.splice(index, 1);
      return newPreview;
    });
  };

  const handleCropComplete = async (croppedAreaPixels: any) => {
    if (pendingCropQueue.length === 0) return;
    const currentItem = pendingCropQueue[0];
    
    try {
      const blob = await getCroppedImg(currentItem.src, croppedAreaPixels, 0);
      if (blob) {
        const croppedFile = new File([blob], currentItem.file.name, { type: 'image/jpeg' });
        const croppedUrl = URL.createObjectURL(croppedFile);
        setMediaPreview(prev => [...prev, { url: croppedUrl, type: 'image', file: croppedFile }]);
      }
    } catch (err) {
      console.error("Error cropping image:", err);
      alert("Hubo un error al recortar la imagen.");
    }
    
    setPendingCropQueue(prev => prev.slice(1));
  };

  const [currentStep, setCurrentStep] = useState(1);

  const validateStep1 = () => {
    if (mediaPreview.length === 0) return 'Debes subir al menos una foto o video.';
    if (!mediaPreview.some(m => m.type === 'image')) return 'Debes subir al menos una imagen para que sirva de portada.';
    if (!title || title.trim().length < 6) return 'El nombre del servicio debe tener al menos 6 caracteres.';
    if (!category) return 'Debes seleccionar una categoría.';
    return null;
  };

  const validateStep2 = () => {
    if (!price || parseFloat(price) <= 0) return 'Debes ingresar un precio válido.';
    return null;
  };

  const validateStep3 = () => {
    if (hasDiscount) {
      const hasPromo = discountName.trim() !== '' || discountValue.trim() !== '';
      if (hasPromo && (!discountName.trim() || !discountValue.trim())) {
        return 'Para el descuento promocional, debes completar tanto el nombre como el valor.';
      }

      let hasTimeError = false;
      timeDiscounts.forEach(rule => {
        if (!rule.value || rule.value.trim() === '') hasTimeError = true;
      });

      let hasEarlyBirdError = false;
      earlyBirdDiscounts.forEach(rule => {
        if (!rule.minDays || parseInt(rule.minDays) < 1 || !rule.value || rule.value.trim() === '') hasEarlyBirdError = true;
      });

      let hasSeasonError = false;
      seasonRules.forEach(rule => {
        if (!rule.value || rule.value.trim() === '') hasSeasonError = true;
      });

      let hasVolumeError = false;
      volumeDiscounts.forEach(rule => {
        if (!rule.minTime || parseInt(rule.minTime) < 2 || !rule.value || rule.value.trim() === '') hasVolumeError = true;
      });

      if (hasTimeError || hasEarlyBirdError || hasSeasonError || hasVolumeError) {
        return 'Todas las reglas de descuento que agregues deben tener los valores completos.';
      }

      if (!hasPromo && timeDiscounts.length === 0 && earlyBirdDiscounts.length === 0 && seasonRules.length === 0 && volumeDiscounts.length === 0) {
        return 'Activaste la opción de descuentos, pero no ingresaste ninguno. Por favor completa algún descuento o desactiva la opción.';
      }
    }
    return null;
  };

  const handleNext = () => {
    setFormError(null);
    let error: string | null = null;
    if (currentStep === 1) error = validateStep1();
    else if (currentStep === 2) error = validateStep2();

    if (error) {
      setFormError(error);
    } else {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setFormError(null);
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setFormError(null);

    if (!supabaseUser) {
      setFormError('Debes iniciar sesión para publicar un servicio.');
      return;
    }

    const step3Error = validateStep3();
    if (step3Error) {
      setFormError(step3Error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedMedia = [];
      for (const m of mediaPreview) {
        if (m.file) {
          const fileExt = m.file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${supabaseUser.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('MediaCazaMarket')
            .upload(filePath, m.file);
            
          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }
          
          const { data } = supabase.storage.from('MediaCazaMarket').getPublicUrl(filePath);
          uploadedMedia.push({ url: data.publicUrl, type: m.type });
        } else {
          uploadedMedia.push({ url: m.url, type: m.type });
        }
      }

      const newService = {
        user_id: supabaseUser.id,
        name: title,
        price: `${currency} ${price}`,
        category: category,
        subcategory: subcategory,
        description: description,
        image: uploadedMedia.find(m => m.type === 'image')?.url || 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?q=80&w=1200&auto=format&fit=crop',
        media: uploadedMedia,
        service_location: serviceLocation,
        location_radius: showServiceArea ? (areaPoints.length > 0 ? JSON.stringify(areaPoints) : null) : null,
        features: features,
        has_discount: hasDiscount,
        discount_name: hasDiscount && discountName.trim() !== '' && discountValue.trim() !== '' ? discountName : null,
        discount_type: hasDiscount && discountName.trim() !== '' && discountValue.trim() !== '' ? discountType : null,
        discount_value: hasDiscount && discountName.trim() !== '' && discountValue.trim() !== '' ? discountValue : null,
        time_discounts: hasDiscount && timeDiscounts.length > 0 ? timeDiscounts : [],
        early_bird_discounts: hasDiscount && earlyBirdDiscounts.length > 0 ? earlyBirdDiscounts : [],
        season_rules: hasDiscount && seasonRules.length > 0 ? seasonRules : [],
        volume_discounts: hasDiscount && volumeDiscounts.length > 0 ? volumeDiscounts : []
      };

      if (editId) {
        const { error } = await supabase.from('services').update(newService).eq('id', editId).eq('user_id', supabaseUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('services').insert([newService]);
        if (error) throw error;
      }
      
      router.push('/mis-tiendas');
    } catch (error: any) {
      console.error('DB error:', error);
      setFormError('Ocurrió un error al guardar el servicio. Inténtalo de nuevo.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-8) var(--spacing-4)', maxWidth: '1000px', margin: '0 auto', minHeight: '80vh' }}>
      
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link href="/mis-tiendas" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Mi Negocio
        </Link>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>/</span>
        <span style={{ color: 'var(--color-text-main)', fontSize: '0.9rem', fontWeight: 600 }}>{editId ? 'Editar Producto' : 'Nuevo Servicio'}</span>
      </div>

      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', color: 'var(--color-text-main)' }}>{editId ? 'Editar Producto' : 'Publicar Nuevo Servicio'}</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', margin: 0 }}>{editId ? 'Modifica los detalles de tu artículo.' : 'Completa los detalles de tu artículo para publicarlo en la tienda.'}</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {[1, 2, 3].map(step => (
          <div key={step} style={{ flex: 1, height: '4px', background: currentStep >= step ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'background 0.3s' }} />
        ))}
      </div>

      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', borderRadius: 'var(--radius-lg)' }}>
        <div className="grid grid-cols-1 gap-8">

          {currentStep === 1 && (
            <>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ display: 'block', color: 'var(--color-text-main)', fontWeight: 600, margin: 0 }}>
                Imágenes y Videos *
              </label>
              {uploadError && (
                <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 500 }}>
                  {uploadError}
                </span>
              )}
            </div>
            {mediaPreview.length > 0 ? (
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {mediaPreview.map((media, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '120px', height: '120px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                    {media.type === 'image' ? (
                      <img src={media.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <>
                        <video src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', pointerEvents: 'none' }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="var(--color-primary)" strokeWidth="1" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        </div>
                      </>
                    )}
                    <button 
                      onClick={() => removeMedia(idx)}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))}
                {mediaPreview.length < 10 && (
                  <label 
                    htmlFor="media-upload"
                    style={{
                      width: '120px', height: '120px', borderRadius: 'var(--radius-md)',
                      background: 'rgba(0,0,0,0.2)', border: '2px dashed rgba(255, 115, 0, 0.3)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </label>
                )}
              </div>
            ) : (
              <label 
                htmlFor="media-upload"
                style={{
                  width: '100%', height: '240px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(0,0,0,0.2)', border: '2px dashed rgba(255, 115, 0, 0.3)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span style={{ color: 'var(--color-text-main)', fontWeight: 600, fontSize: '1rem' }}>Sube contenido multimedia</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Hasta 8 imágenes y 2 videos (Máx. 25MB)</span>
              </label>
            )}
            <input 
              id="media-upload"
              type="file" 
              multiple 
              onChange={handleMediaUpload}
              accept="image/png, image/jpeg, image/webp, video/mp4, video/quicktime" 
              style={{ display: 'none' }} 
            />
          </div>

            {/* Title */}
            <div>
              <label style={{ display: 'block', color: 'var(--color-text-main)', fontWeight: 600, marginBottom: '8px' }}>
                Título del Servicio *
              </label>
              <input
                type="text"
                placeholder="Ej: Guía de caza mayor..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text-main)', fontSize: '1rem', outline: 'none'
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', color: 'var(--color-text-main)', fontWeight: 600, marginBottom: '8px' }}>
                Descripción Detallada
              </label>
              <textarea
                placeholder="Describe en qué consiste el servicio, horarios, itinerario, requisitos, etc..."
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text-main)', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none'
                }}
              />
            </div>
            
            {/* Características */}
            <div>
              <label style={{ display: 'block', color: 'var(--color-text-main)', fontWeight: 600, marginBottom: '8px' }}>
                Características (Features)
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Ej: Material de Acero, Color Negro..."
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                  style={{
                    flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-md)',
                    background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)',
                    color: 'var(--color-text-main)', fontSize: '1rem', outline: 'none'
                  }}
                />
                <button type="button" onClick={addFeature} className="btn btn-outline w-full md:w-auto" style={{ padding: '0 24px', borderRadius: 'var(--radius-md)' }}>Agregar</button>
              </div>
              {features.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {features.map((feat, i) => (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ color: 'var(--color-text-main)', overflowWrap: 'break-word', wordBreak: 'break-word', flex: 1, marginRight: '8px' }}>• {feat}</span>
                      <button type="button" onClick={() => removeFeature(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', flexShrink: 0 }}>✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={{ display: 'block', color: 'var(--color-text-main)', fontWeight: 600, marginBottom: '8px' }}>
                  Categoría Principal *
                </label>
                <CustomSelect
                  options={(SERVICE_MAIN_CATEGORIES.filter(c => storeCategories.length === 0 || storeCategories.includes(c.name)).length > 0
                    ? SERVICE_MAIN_CATEGORIES.filter(c => storeCategories.length === 0 || storeCategories.includes(c.name))
                    : SERVICE_MAIN_CATEGORIES
                  ).map(c => ({ value: c.name, label: c.name }))}
                  value={category}
                  onChange={(val) => {
                    setCategory(val);
                    setSubcategory('');
                  }}
                  placeholder="Selecciona categoría principal"
                />
              </div>

              {category && (
                <div>
                  <label style={{ display: 'block', color: 'var(--color-text-main)', fontWeight: 600, marginBottom: '8px' }}>
                    Subcategoría
                  </label>
                  <CustomSelect
                    options={getSubcategoriesForCategory(category).map(sub => ({ value: sub, label: sub }))}
                    value={subcategory}
                    onChange={setSubcategory}
                    placeholder="Selecciona una subcategoría"
                  />
                </div>
              )}
            </div>
            </>
          )}

          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Price */}
            <div className="col-span-full">
              <label style={{ display: 'block', color: 'var(--color-text-main)', fontWeight: 600, marginBottom: '8px' }}>
                Precio *
              </label>
              <div style={{ position: 'relative', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 250px' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    style={{
                      width: '100%', padding: '14px 80px 14px 32px', borderRadius: 'var(--radius-md)',
                      background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)',
                      color: 'var(--color-text-main)', fontSize: '1rem', outline: 'none'
                    }}
                  />
                  <div style={{ position: 'absolute', right: '4px', top: '4px', bottom: '4px', width: '90px', zIndex: 10 }}>
                    <CustomSelect 
                      options={[
                        { value: 'USD', label: 'USD' },
                        { value: 'ARS', label: 'ARS' }
                      ]}
                      value={currency}
                      onChange={setCurrency}
                    />
                  </div>
                </div>
                
                {/* Price Period */}
                <div style={{ width: '200px', minWidth: '150px', zIndex: 10 }}>
                  <CustomSelect 
                    options={[
                      { value: 'único', label: 'Cobro Único' },
                      { value: 'por hora', label: 'Por Hora' },
                      { value: 'por día', label: 'Por Día' },
                      { value: 'por noche', label: 'Por Noche' },
                      { value: 'por semana', label: 'Por Semana' },
                      { value: 'por mes', label: 'Por Mes' },
                      { value: 'por temporada', label: 'Por Temporada' },
                    ]}
                    value={pricePeriod}
                    onChange={setPricePeriod}
                  />
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div style={{ gridColumn: "1 / -1" /* col-span-full */, background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: 'var(--color-text-main)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    Usa Calendario de Reservas
                  </h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    Permite a los clientes elegir los días disponibles directamente.
                  </p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                  <input
                    type="checkbox"
                    checked={usesCalendar}
                    onChange={(e) => {
                      if (!permissions.calendario) {
                         alert('Tu plan no incluye el uso de calendario.');
                         e.preventDefault();
                         return;
                      }
                      setUsesCalendar(e.target.checked);
                    }}
                    style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }}
                  />
                  <div style={{
                    width: '44px', height: '24px', borderRadius: '12px',
                    background: usesCalendar ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: 'background 0.3s'
                  }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: '2px', left: usesCalendar ? '22px' : '2px',
                      transition: 'left 0.3s'
                    }} />
                  </div>
                </label>
              </div>

              {usesCalendar && (
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
                  <h4 style={{ color: 'var(--color-text-main)', margin: '0 0 16px 0', fontSize: '1.05rem' }}>Fechas Ocupadas / Bloqueadas</h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>Selecciona los días en los que no podrás brindar el servicio para que los clientes no puedan reservarlos.</p>
                  <BookingCalendar 
                    mode="admin" 
                    value={blockedDates} 
                    onChange={setBlockedDates} 
                  />
                </div>
              )}
            </div>

            {/* Cupos */}
            <div className="col-span-full">
              <label style={{ display: 'block', color: 'var(--color-text-main)', fontWeight: 600, marginBottom: '8px' }}>
                Cupos Disponibles
              </label>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="stockMode" 
                    checked={stockMode === 'definido'} 
                    onChange={() => setStockMode('definido')}
                    style={{ accentColor: 'var(--color-primary)', width: '18px', height: '18px' }} 
                  />
                  <span style={{ color: 'var(--color-text-main)' }}>Cupo limitado</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="stockMode" 
                    checked={stockMode === 'no_necesario'}
                    onChange={() => setStockMode('no_necesario')}
                    style={{ accentColor: 'var(--color-primary)', width: '18px', height: '18px' }} 
                  />
                  <span style={{ color: 'var(--color-text-main)' }}>No hay límite</span>
                </label>
              </div>
              {stockMode === 'definido' && (
                <input
                  type="number"
                  placeholder="Ej: 10 (capacidad máxima de personas o reservas)"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  min={1}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)',
                    background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)',
                    color: 'var(--color-text-main)', fontSize: '1rem', outline: 'none'
                  }}
                />
              )}
            </div>

            </div>
          )}

          {currentStep === 3 && (
            <div className="grid grid-cols-1 gap-8">
            {/* Ubicación del Servicio */}
            <div className="col-span-full">
              <label style={{ display: 'block', color: 'var(--color-text-main)', fontWeight: 600, marginBottom: '8px' }}>
                Ubicación del Servicio *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </span>
                <input
                  type="text"
                  placeholder="Escribe la dirección exacta o localidad..."
                  value={serviceLocation}
                  onChange={(e) => {
                    const val = e.target.value;
                    setServiceLocation(val);
                    
                    if (searchTimeout.current) clearTimeout(searchTimeout.current);
                    
                    if (val.length > 2) {
                      // Indicador temporal opcional si queremos mostrar "Buscando..."
                      // setLocationSuggestions(['Buscando...']); 
                      
                      searchTimeout.current = setTimeout(async () => {
                        try {
                          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=4&addressdetails=1`);
                          const data = await res.json();
                          const suggestions: string[] = data.map((item: any) => String(item.display_name));
                          
                          // Evitamos duplicados y añadimos la opción de forzar nombre exacto
                          setLocationSuggestions([...Array.from(new Set(suggestions)), `${val} (Ubicación exacta ingresada)`]);
                        } catch (err) {
                          setLocationSuggestions([`${val} (Ubicación exacta ingresada)`]);
                        }
                      }, 500); // Debounce de medio segundo
                    } else {
                      setLocationSuggestions([]);
                    }
                  }}
                  onBlur={() => setTimeout(() => setLocationSuggestions([]), 200)}
                  style={{
                    width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-md)',
                    background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)',
                    color: 'var(--color-text-main)', fontSize: '1rem', outline: 'none'
                  }}
                />
                
                {/* Autocomplete Dropdown */}
                {locationSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginTop: '4px', zIndex: 50, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                    {locationSuggestions.map((sugg, idx) => {
                      const isExact = sugg.includes('(Ubicación exacta ingresada)');
                      return (
                        <div 
                          key={idx}
                          onClick={() => {
                            setServiceLocation(isExact ? serviceLocation : sugg);
                            setLocationSuggestions([]);
                          }}
                          style={{ 
                            padding: '12px 16px', cursor: 'pointer', 
                            borderBottom: idx < locationSuggestions.length - 1 ? '1px solid var(--color-border)' : 'none', 
                            color: isExact ? 'var(--color-primary)' : 'var(--color-text-main)',
                            fontWeight: isExact ? 600 : 400
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {sugg}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Mapa Real - Leaflet & OSM */}
              {permissions.googleMaps ? (
                <div style={{ marginTop: '16px', height: '300px', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                  <LocationMap locationText={serviceLocation} setLocationText={setServiceLocation} onPositionChange={setServiceLocationCoords} />
                </div>
              ) : (
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,115,0,0.1)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '0.9rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <span>Sube de plan para habilitar la visualización del mapa interactivo de ubicación.</span>
                </div>
              )}
            </div>

            {/* Área de Cobertura */}
            <div style={{ gridColumn: "1 / -1" /* col-span-full */, background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showServiceArea ? '20px' : '0' }}>
                <div>
                  <h4 style={{ color: 'var(--color-text-main)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                    Área de Cobertura (MyMaps)
                  </h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    Haz clic en el mapa para delimitar tu área de trabajo o zona de influencia.
                  </p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                  <input
                    type="checkbox"
                    checked={showServiceArea}
                    onChange={(e) => {
                      if (!permissions.mapasTerritorio) {
                         alert('Tu plan actual no te permite dibujar áreas de territorio. Considera subir de nivel para acceder a la herramienta MyMaps.');
                         e.preventDefault();
                         return;
                      }
                      if (!serviceLocation) {
                         alert('Por favor ingresa primero la Ubicación del Servicio para poder delimitar su área.');
                         e.preventDefault();
                         return;
                      }
                      setShowServiceArea(e.target.checked);
                    }}
                    style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }}
                  />
                  <div style={{
                    width: '44px', height: '24px', borderRadius: '12px',
                    background: showServiceArea ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: 'background 0.3s'
                  }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: '2px', left: showServiceArea ? '22px' : '2px',
                      transition: 'left 0.3s'
                    }} />
                  </div>
                </label>
              </div>

              {showServiceArea && permissions.mapasTerritorio && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                      type="button"
                      onClick={(e) => { e.preventDefault(); setIsDrawingMode(!isDrawingMode); }} 
                      style={{ background: isDrawingMode ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', border: 'none', color: isDrawingMode ? '#000' : '#fff', padding: '8px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center', transition: 'all 0.2s' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
                      {isDrawingMode ? 'Modo Dibujo: ENCENDIDO' : 'Modo Dibujo: APAGADO'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setAreaPoints([])} 
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                      Limpiar Área
                    </button>
                  </div>
                  <div style={{ position: 'relative', height: '350px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    
                    <AreaMap isDrawingMode={isDrawingMode} points={areaPoints} setPoints={setAreaPoints} locationText={serviceLocation} />
                     
                    {!isDrawingMode && (
                      <div style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 1000, pointerEvents: 'none' }}>
                        <div style={{ background: 'rgba(0,0,0,0.8)', padding: '10px 14px', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.9rem', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3-3 3M2 12h20M12 2v20"></path></svg>
                          Navegación libre: Enciende el Modo Dibujo para marcar áreas.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Descuentos Promocionales */}
            <div style={{ gridColumn: "1 / -1" /* col-span-full */, background: 'rgba(255, 115, 0, 0.05)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255, 115, 0, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasDiscount ? '16px' : '0' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>Descuentos Promocionales</h3>
                  <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>¿Quieres agregar un descuento a este producto?</p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={hasDiscount} onChange={(e) => setHasDiscount(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }} />
                </label>
              </div>
              
              {hasDiscount && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.4s ease-out' }}>
                  
                  {/* Descuento Base */}
                  <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', position: 'relative', zIndex: 40 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <label style={{ color: 'var(--color-text-main)', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                        Descuento Base del Servicio
                      </label>
                      {!hasBaseDiscount ? (
                        <button type="button" onClick={() => setHasBaseDiscount(true)} style={{ background: 'rgba(255,115,0,0.1)', border: '1px solid rgba(255,115,0,0.3)', color: 'var(--color-primary)', padding: '8px 16px', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,115,0,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,115,0,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                          + Añadir Descuento
                        </button>
                      ) : (
                        <button type="button" onClick={() => { setHasBaseDiscount(false); setDiscountName(''); setDiscountValue(''); }} style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; e.currentTarget.style.transform = 'scale(1)'; }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg></button>
                      )}
                    </div>
                    {hasBaseDiscount && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="col-span-full">
                          <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>Nombre del Descuento Principal</label>
                          <input type="text" placeholder="Ej: Promoción de Lanzamiento" value={discountName} onChange={(e) => setDiscountName(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', transition: 'all 0.2s', fontSize: '0.95rem' }} onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>Tipo de Descuento</label>
                          <CustomSelect options={[{ value: 'porcentaje', label: 'Porcentaje (%)' }, { value: 'fijo', label: 'Monto Fijo ($)' }]} value={discountType} onChange={(val) => setDiscountType(val as any)} />
                        </div>
                        <div>
                          <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>Valor del Descuento</label>
                          <input type="number" placeholder={discountType === 'porcentaje' ? 'Ej: 15' : 'Ej: 500'} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', transition: 'all 0.2s', fontSize: '0.95rem' }} onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }} />
                        </div>
                      </div>
                    )}
                    {!hasBaseDiscount && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: 0, padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>Aplica un descuento general a todo el servicio (Ej: 10% OFF en todos los precios).</p>}
                  </div>

                  {/* Descuentos por Cantidad / Tiempo */}
                  <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', position: 'relative', zIndex: 30 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <label style={{ color: 'var(--color-text-main)', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Estadía Prolongada
                      </label>
                      <button type="button" onClick={() => setTimeDiscounts([...timeDiscounts, { minTime: '2', type: 'porcentaje', value: '' }])} style={{ background: 'rgba(255,115,0,0.1)', border: '1px solid rgba(255,115,0,0.3)', color: 'var(--color-primary)', padding: '8px 16px', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,115,0,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,115,0,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                        + Añadir Regla
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {timeDiscounts.map((rule, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s, transform 0.2s', position: 'relative', zIndex: 10 - idx }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateX(4px)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                          <div>
                            <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 500 }}>Mínimo de Períodos</label>
                            <input type="number" min="2" value={rule.minTime} onChange={(e) => { const r = [...timeDiscounts]; r[idx].minTime = e.target.value; setTimeDiscounts(r); }} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                          </div>
                          <div>
                            <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 500 }}>Tipo</label>
                            <CustomSelect options={[{ value: 'porcentaje', label: 'Porcentaje (%)' }, { value: 'fijo', label: 'Monto Fijo ($)' }]} value={rule.type} onChange={(val) => { const r = [...timeDiscounts]; r[idx].type = val as any; setTimeDiscounts(r); }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 500 }}>Valor</label>
                            <input type="number" placeholder="Ej: 10" value={rule.value} onChange={(e) => { const r = [...timeDiscounts]; r[idx].value = e.target.value; setTimeDiscounts(r); }} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                          </div>
                          <button type="button" onClick={() => setTimeDiscounts(timeDiscounts.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', width: '42px', height: '42px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; e.currentTarget.style.transform = 'scale(1)'; }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg></button>
                        </div>
                      ))}
                    </div>
                    {timeDiscounts.length === 0 && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: 0, padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>Fomenta reservas más largas ofreciendo un descuento escalonado.</p>}
                  </div>

                  {/* Descuentos por Antelación (Early Bird) */}
                  <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', position: 'relative', zIndex: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <label style={{ color: 'var(--color-text-main)', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        Antelación (Early Bird)
                      </label>
                      <button type="button" onClick={() => setEarlyBirdDiscounts([...earlyBirdDiscounts, { minDays: '30', type: 'porcentaje', value: '' }])} style={{ background: 'rgba(255,115,0,0.1)', border: '1px solid rgba(255,115,0,0.3)', color: 'var(--color-primary)', padding: '8px 16px', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,115,0,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,115,0,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                        + Añadir Regla
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {earlyBirdDiscounts.map((rule, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s, transform 0.2s', position: 'relative', zIndex: 10 - idx }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateX(4px)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                          <div>
                            <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 500 }}>Días de Anticipación</label>
                            <input type="number" min="1" value={rule.minDays} onChange={(e) => { const r = [...earlyBirdDiscounts]; r[idx].minDays = e.target.value; setEarlyBirdDiscounts(r); }} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                          </div>
                          <div>
                            <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 500 }}>Tipo</label>
                            <CustomSelect options={[{ value: 'porcentaje', label: 'Porcentaje (%)' }, { value: 'fijo', label: 'Monto Fijo ($)' }]} value={rule.type} onChange={(val) => { const r = [...earlyBirdDiscounts]; r[idx].type = val as any; setEarlyBirdDiscounts(r); }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 500 }}>Valor</label>
                            <input type="number" placeholder="Ej: 5" value={rule.value} onChange={(e) => { const r = [...earlyBirdDiscounts]; r[idx].value = e.target.value; setEarlyBirdDiscounts(r); }} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                          </div>
                          <button type="button" onClick={() => setEarlyBirdDiscounts(earlyBirdDiscounts.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', width: '42px', height: '42px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; e.currentTarget.style.transform = 'scale(1)'; }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg></button>
                        </div>
                      ))}
                    </div>
                    {earlyBirdDiscounts.length === 0 && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: 0, padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>Premia a los clientes que reservan con mucha anticipación.</p>}
                  </div>

                  {/* Reglas de Temporada (Fechas) */}
                  <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <label style={{ color: 'var(--color-text-main)', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        Reglas de Temporada
                      </label>
                      <button type="button" onClick={() => setSeasonRules([...seasonRules, { name: '', startDate: '', endDate: '', adjustmentType: 'aumento', type: 'porcentaje', value: '' }])} style={{ background: 'rgba(255,115,0,0.1)', border: '1px solid rgba(255,115,0,0.3)', color: 'var(--color-primary)', padding: '8px 16px', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,115,0,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,115,0,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                        + Añadir Temporada
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {seasonRules.map((rule, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', position: 'relative', zIndex: 10 - idx }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center' }}>
                            <div style={{ width: '100%' }}>
                              <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 500 }}>Nombre del Evento / Temporada</label>
                              <input type="text" placeholder="Ej: Vacaciones de Invierno" value={rule.name} onChange={(e) => { const r = [...seasonRules]; r[idx].name = e.target.value; setSeasonRules(r); }} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            </div>
                            <button type="button" onClick={() => setSeasonRules(seasonRules.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', width: '42px', height: '42px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', alignSelf: 'flex-end' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; e.currentTarget.style.transform = 'scale(1)'; }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg></button>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
                            <div>
                              <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 500 }}>Fecha Inicio</label>
                              <DateMaskInput value={rule.startDate} onChange={(val) => { const r = [...seasonRules]; r[idx].startDate = val; setSeasonRules(r); }} />
                            </div>
                            <div>
                              <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 500 }}>Fecha Fin</label>
                              <DateMaskInput value={rule.endDate} onChange={(val) => { const r = [...seasonRules]; r[idx].endDate = val; setSeasonRules(r); }} />
                            </div>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '4px' }}>
                            <div>
                              <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 500 }}>Ajuste de Precio</label>
                              <CustomSelect options={[{ value: 'aumento', label: 'Aumento (+)' }, { value: 'descuento', label: 'Descuento (-)' }]} value={rule.adjustmentType} onChange={(val) => { const r = [...seasonRules]; r[idx].adjustmentType = val as any; setSeasonRules(r); }} />
                            </div>
                            <div>
                              <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 500 }}>Formato</label>
                              <CustomSelect options={[{ value: 'porcentaje', label: 'Porcentaje (%)' }, { value: 'fijo', label: 'Monto Fijo ($)' }]} value={rule.type} onChange={(val) => { const r = [...seasonRules]; r[idx].type = val as any; setSeasonRules(r); }} />
                            </div>
                            <div>
                              <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 500 }}>Valor</label>
                              <input type="number" placeholder="Ej: 20" value={rule.value} onChange={(e) => { const r = [...seasonRules]; r[idx].value = e.target.value; setSeasonRules(r); }} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {seasonRules.length === 0 && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: 0, padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>Cobra más o menos según fechas específicas (ej: +20% en vacaciones de verano).</p>}
                  </div>
                </div>
              )}
            </div>

            </div>
          )}

          {canUseBot && editId && currentStep === 3 && (
            <div style={{ marginTop: '24px', padding: '24px', background: 'rgba(255,115,0,0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,115,0,0.2)' }}>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-primary)', fontSize: '1.2rem' }}>Asesor Virtual Personalizado</h3>
              <p style={{ margin: '0 0 16px 0', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Configura un bot exclusivo que responderá solo a las consultas relacionadas con este producto.</p>
              <button
                type="button"
                onClick={() => setIsAdvisorModalOpen(true)}
                style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}
              >
                Configurar Asesor Personalizado
              </button>
            </div>
          )}

          {canUseBot && !editId && currentStep === 3 && (
            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <LightBulbIcon style={{ width: '24px', height: '24px', color: 'var(--color-primary)' }} />
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Podrás configurar el Asesor Virtual Personalizado para este producto una vez que lo hayas guardado.</p>
            </div>
          )}

          {formError && (
            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', color: '#ef4444', borderRadius: '4px', fontWeight: 500 }}>
              {formError}
            </div>
          )}

          <div className="border-t border-[var(--color-border)] pt-6 flex flex-col md:flex-row justify-end gap-4">
            {currentStep > 1 ? (
              <button 
                type="button" 
                className="btn btn-outline w-full md:w-auto"
                onClick={handlePrev}
                style={{ padding: '12px 24px', borderRadius: 'var(--radius-full)' }}
              >
                Atrás
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-outline w-full md:w-auto"
                onClick={() => router.push('/mis-tiendas')}
                style={{ padding: '12px 24px', borderRadius: 'var(--radius-full)' }}
              >
                Cancelar
              </button>
            )}

            {currentStep < 3 ? (
              <button 
                type="button" 
                className="btn btn-primary w-full md:w-auto"
                onClick={handleNext}
                style={{ padding: '12px 32px', borderRadius: 'var(--radius-full)' }}
              >
                Siguiente
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-primary w-full md:w-auto"
                onClick={handleSubmit}
                style={{ padding: '12px 32px', borderRadius: 'var(--radius-full)' }}
              >
                {editId ? 'Guardar Servicio' : 'Publicar Servicio'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {isAdvisorModalOpen && editId && (
        <VirtualAdvisorModal 
          onClose={() => setIsAdvisorModalOpen(false)} 
          productId={editId}
        />
      )}
      
      {pendingCropQueue.length > 0 && (
        <ImageCropperModal
          imageSrc={pendingCropQueue[0].src}
          aspect={4 / 3}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setPendingCropQueue(prev => prev.slice(1));
          }}
          title={`Ajustar Imagen de Servicio (${pendingCropQueue.length} pendiente${pendingCropQueue.length > 1 ? 's' : ''})`}
        />
      )}
    </div>
  );
}

export default function NuevoProductoPage() {
  return (
    <React.Suspense fallback={<div style={{ padding: '100px', textAlign: 'center', color: 'white' }}>Cargando editor...</div>}>
      <NuevoServicioContent />
    </React.Suspense>
  );
}
