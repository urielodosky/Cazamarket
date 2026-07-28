'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomSelect from '@/components/ui/CustomSelect';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { usePlan } from '@/contexts/PlanContext';
import VirtualAdvisorModal from '@/components/chat/VirtualAdvisorModal';
import { PRODUCT_MAIN_CATEGORIES, getSubcategoriesForCategory } from '@/constants/categoriesData';

function NuevoProductoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('editId');
  const { username, avatar: userAvatar, supabaseUser } = useAuth();
  const { hasFeature, permissions } = usePlan();
  
  const canUseBot = hasFeature('botAsesor');
  
  const supabase = createClient();
  
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
  
  const [stockMode, setStockMode] = useState<'definido' | 'no_necesario'>('no_necesario');
  const [mediaPreview, setMediaPreview] = useState<{url: string, type: string, file?: File}[]>([]);
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

  const [shippingMode, setShippingMode] = useState<'gratis' | 'sin_envio' | 'costo_extra'>('gratis');
  const [shippingCost, setShippingCost] = useState('');
  const [shippingCurrency, setShippingCurrency] = useState('USD');

  const [pickupAvailable, setPickupAvailable] = useState<'no' | 'si'>('no');
  const [pickupBranches, setPickupBranches] = useState('');

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
  const [discountName, setDiscountName] = useState('');
  const [discountType, setDiscountType] = useState<'porcentaje' | 'fijo'>('porcentaje');
  const [discountValue, setDiscountValue] = useState('');
  const [volumeDiscounts, setVolumeDiscounts] = useState<{minQty: string, type: 'porcentaje' | 'fijo', value: string}[]>([]);

  const [vendorLocations, setVendorLocations] = useState<any[]>([]);

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
    
    // Load existing product if editId is present
    if (editId) {
      const fetchProduct = async () => {
        const { data: product, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', editId)
          .single();
          
        if (product) {
          setTitle(product.name || '');
          if (product.price) {
            const priceParts = product.price.split(' ');
            if (priceParts.length > 1) {
              setCurrency(priceParts[0]);
              setPrice(priceParts.slice(1).join(' '));
            } else {
              setPrice(product.price);
            }
          }
          setCategory(product.category || '');
          setSubcategory(product.subcategory || '');
          setDescription(product.description || '');
          if (product.condition) setCondition(product.condition.toLowerCase());
          
          if (product.media && product.media.length > 0) {
            setMediaPreview(product.media.map((m: any) => ({ url: m.url, type: m.type, file: undefined })));
          } else if (product.image) {
            setMediaPreview([{ url: product.image, type: 'image', file: undefined }]);
          }
          
          if (product.shipping_cost === 'Envío gratis') {
            setShippingMode('gratis');
          } else if (product.shipping_cost && product.shipping_cost !== 'Envío gratis') {
            setShippingMode('costo_extra');
            if (product.shipping_cost !== 'A acordar') {
              const sParts = product.shipping_cost.split(' ');
              if (sParts.length > 1) {
                setShippingCurrency(sParts[0]);
                setShippingCost(sParts.slice(1).join(' '));
              }
            }
          } else if (product.shipping_cost === undefined || product.shipping_cost === null) {
            setShippingMode('sin_envio');
          }
          
          if (product.pickup_available === 'si' && product.pickup_branches) {
            setPickupAvailable('si');
            setPickupBranches(product.pickup_branches);
          }
          
          if (product.features) {
            setFeatures(product.features);
          }
          
          if (product.has_discount) {
            setHasDiscount(true);
            setDiscountName(product.discount_name || '');
            setDiscountType(product.discount_type || 'porcentaje');
            setDiscountValue(product.discount_value || '');
          }
          
          if (product.volume_discounts) {
            setVolumeDiscounts(product.volume_discounts);
          }
        }
      };
      fetchProduct();
    }
  }, [editId]);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      let errorMsg: string | null = null;
      
      let imageCount = mediaPreview.filter(m => m.type === 'image').length;
      let videoCount = mediaPreview.filter(m => m.type === 'video').length;
      const newPreviews: {url: string, type: string, file: File}[] = [];

      for (const file of newFiles) {
        // Prevent duplicates
        if (mediaPreview.some(m => m.file?.name === file.name && m.file?.size === file.size) ||
            newPreviews.some(m => m.file?.name === file.name && m.file?.size === file.size)) {
          errorMsg = 'El archivo ya fue subido.';
          continue;
        }

        const isVideo = file.type.startsWith('video/');
        
        if (isVideo) {
          if (videoCount >= 2) {
            errorMsg = 'Máximo de 2 videos alcanzado.';
            continue;
          }
          videoCount++;
        } else {
          if (imageCount >= 8) {
            errorMsg = 'Máximo de 8 imágenes alcanzado.';
            continue;
          }
          imageCount++;
        }

        // Usar URL.createObjectURL para saltarse completamente el límite de localStorage
        // ya que esto solo genera un string corto (blob:http...) en lugar de un base64 gigante.
        // NOTA: Las imágenes subidas así se verán rotas si el usuario recarga la página, 
        // pero permite probar la creación de miles de productos.
        const blobUrl = URL.createObjectURL(file);
        
        setMediaPreview(prev => [...prev, {
          url: blobUrl,
          type: isVideo ? 'video' : 'image',
          file: file
        }]);
      }
      
      if (errorMsg) {
        setUploadError(errorMsg);
        setTimeout(() => setUploadError(null), 3000);
      }
      
      // Reset input to allow selecting the same file after removing it
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

  const [currentStep, setCurrentStep] = useState(1);

  const validateStep1 = () => {
    if (storeCategories.length === 0) return 'Debes definir al menos una categoría para tu negocio en "Mis Tiendas" antes de publicar.';
    if (mediaPreview.length === 0) return 'Debes subir al menos una foto o video.';
    if (!mediaPreview.some(m => m.type === 'image')) return 'Debes subir al menos una imagen para que sirva de portada.';
    if (!title || title.trim().length < 6) return 'El nombre del producto debe tener al menos 6 caracteres.';
    if (!category) return 'Debes seleccionar una categoría.';
    return null;
  };

  const validateStep2 = () => {
    if (!price || parseFloat(price) <= 0) return 'Debes ingresar un precio válido.';
    if (stockMode === 'definido' && (!stock || parseInt(stock) < 1)) return 'Debes ingresar una cantidad de stock válida.';
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setFormError(null);

    if (!supabaseUser) {
      setFormError('Debes iniciar sesión para publicar un producto.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Subir archivos nuevos a Supabase Storage
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
          // Ya estaba subido o es de mockup
          uploadedMedia.push({ url: m.url, type: m.type });
        }
      }

      const newProduct = {
        user_id: supabaseUser.id,
        name: title,
        price: `${currency} ${price}`,
        category: category,
        subcategory: subcategory,
        description: description,
        condition: condition.charAt(0).toUpperCase() + condition.slice(1),
        image: uploadedMedia.find(m => m.type === 'image')?.url || 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?q=80&w=1200&auto=format&fit=crop',
        media: uploadedMedia,
        shipping_mode: shippingMode,
        shipping_cost: shippingMode === 'gratis' ? 'Envío gratis' : shippingMode === 'costo_extra' ? (!shippingCost || parseFloat(shippingCost) <= 0 ? 'A acordar' : `${shippingCurrency} ${shippingCost}`) : null,
        pickup_available: pickupAvailable,
        pickup_branches: pickupAvailable === 'si' ? pickupBranches : null,
        features: features,
        has_discount: hasDiscount,
        discount_name: hasDiscount ? discountName : null,
        discount_type: hasDiscount ? discountType : null,
        discount_value: hasDiscount ? discountValue : null,
        volume_discounts: hasDiscount && volumeDiscounts.length > 0 ? volumeDiscounts : []
      };

      if (editId) {
        const { error } = await supabase.from('products').update(newProduct).eq('id', editId).eq('user_id', supabaseUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([newProduct]);
        if (error) throw error;
      }
      
      router.push('/mis-tiendas');
    } catch (error: any) {
      console.error('DB error:', error);
      setFormError('Ocurrió un error al guardar el producto. Inténtalo de nuevo.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-8) var(--spacing-4)', maxWidth: '1000px', margin: '0 auto', minHeight: '80vh' }}>
      
      {/* Breadcrumbs */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link href="/mis-tiendas" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Mi Negocio
        </Link>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>/</span>
        <span style={{ color: 'var(--color-text-main)', fontSize: '0.9rem', fontWeight: 600 }}>{editId ? 'Editar Producto' : 'Nuevo Producto'}</span>
      </div>

      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', color: 'var(--color-text-main)' }}>{editId ? 'Editar Producto' : 'Publicar Nuevo Producto'}</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', margin: 0 }}>{editId ? 'Modifica los detalles de tu artículo.' : 'Completa los detalles de tu artículo para publicarlo en la tienda.'}</p>
      </div>

      {/* Progress Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {[1, 2, 3].map(step => (
          <div key={step} style={{ flex: 1, height: '4px', background: currentStep >= step ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'background 0.3s' }} />
        ))}
      </div>

      {storeCategories.length === 0 && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          color: '#f87171',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>
              Categorías de negocio no definidas
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Debes seleccionar las categorías de tu negocio en "Mis Tiendas" para poder crear publicaciones.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => router.push('/mis-tiendas')}
            style={{
              padding: '8px 16px',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}
          >
            Configurar en Mis Tiendas
          </button>
        </div>
      )}

      <div className="glass-panel" style={{ padding: 'var(--spacing-6)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>

          {currentStep === 1 && (
            <>
              {/* Image/Video Upload Area */}
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
                Título del Producto *
              </label>
              <input
                type="text"
                placeholder="Ej: Cuchillo Táctico de Supervivencia"
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
                placeholder="Describe las características técnicas, dimensiones, material, y estado general..."
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
                <button type="button" onClick={addFeature} className="btn btn-outline" style={{ padding: '0 24px', borderRadius: 'var(--radius-md)' }}>Agregar</button>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--color-text-main)', fontWeight: 600, marginBottom: '8px' }}>
                  Categoría Principal *
                </label>
                <CustomSelect
                  options={(PRODUCT_MAIN_CATEGORIES.filter(c => storeCategories.length === 0 || storeCategories.includes(c.name)).length > 0
                    ? PRODUCT_MAIN_CATEGORIES.filter(c => storeCategories.length === 0 || storeCategories.includes(c.name))
                    : PRODUCT_MAIN_CATEGORIES
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

            {/* Price */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', color: 'var(--color-text-main)', fontWeight: 600, marginBottom: '8px' }}>
                Precio *
              </label>
              <div style={{ position: 'relative', display: 'flex' }}>
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
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--color-text-main)', fontWeight: 600, marginBottom: '8px' }}>
                Condición *
              </label>
              <div style={{ display: 'flex', gap: '16px', padding: '14px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="condition" value="nuevo" checked={condition === 'nuevo'} onChange={(e) => setCondition(e.target.value)} style={{ accentColor: 'var(--color-primary)', width: '18px', height: '18px' }} />
                  <span style={{ color: 'var(--color-text-main)' }}>Nuevo</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="condition" value="usado" checked={condition === 'usado'} onChange={(e) => setCondition(e.target.value)} style={{ accentColor: 'var(--color-primary)', width: '18px', height: '18px' }} />
                  <span style={{ color: 'var(--color-text-main)' }}>Usado</span>
                </label>
              </div>
            </div>
            
            {/* Stock */}
            <div>
              <label style={{ display: 'block', color: 'var(--color-text-main)', fontWeight: 600, marginBottom: '8px' }}>
                Stock disponible
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
                  <span style={{ color: 'var(--color-text-main)' }}>Stock definido</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="stockMode" 
                    checked={stockMode === 'no_necesario'}
                    onChange={() => setStockMode('no_necesario')}
                    style={{ accentColor: 'var(--color-primary)', width: '18px', height: '18px' }} 
                  />
                  <span style={{ color: 'var(--color-text-main)' }}>No es necesario</span>
                </label>
              </div>
              {stockMode === 'definido' && (
                <input
                  type="number"
                  placeholder="Ej: 10"
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
              {/* Opciones de Envío */}
            <div>
              <label style={{ display: 'block', color: 'var(--color-text-main)', fontWeight: 600, marginBottom: '8px' }}>
                Opciones de Envío
              </label>
              <CustomSelect
                options={[
                  { value: 'gratis', label: 'Envío gratis' },
                  { value: 'sin_envio', label: 'Sin envío' },
                  { value: 'costo_extra', label: 'Costo extra de envío' }
                ]}
                value={shippingMode}
                onChange={(val) => setShippingMode(val as any)}
              />
              {shippingMode === 'costo_extra' && (
                <div style={{ marginTop: '12px', position: 'relative', display: 'flex' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>$</span>
                  <input
                    type="number"
                    placeholder="Ej: 5000 (vacío o 0 = a acordar)"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
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
                      value={shippingCurrency}
                      onChange={setShippingCurrency}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Retiro en Sucursal */}
            <div>
              <label style={{ display: 'block', color: 'var(--color-text-main)', fontWeight: 600, marginBottom: '8px' }}>
                Retiro en Sucursales
              </label>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="pickup" checked={pickupAvailable === 'no'} onChange={() => setPickupAvailable('no')} style={{ accentColor: 'var(--color-primary)' }} />
                  <span style={{ color: 'var(--color-text-main)' }}>No</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="pickup" checked={pickupAvailable === 'si'} onChange={() => setPickupAvailable('si')} style={{ accentColor: 'var(--color-primary)' }} />
                  <span style={{ color: 'var(--color-text-main)' }}>Sí</span>
                </label>
              </div>
              {pickupAvailable === 'si' && (
                <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  {vendorLocations.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ margin: '0 0 8px 0', color: 'var(--color-text-main)', fontSize: '0.9rem', fontWeight: 500 }}>Selecciona las sucursales habilitadas:</p>
                      {vendorLocations.map((loc, idx) => (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" style={{ accentColor: 'var(--color-primary)', width: '18px', height: '18px' }} />
                          <span style={{ color: 'var(--color-text-main)', fontSize: '0.95rem' }}>
                            {loc.street}, {loc.city}, {loc.province} {loc.cp && `(CP: ${loc.cp})`}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      <span style={{ fontWeight: 500 }}>No tienes sucursales registradas en tu Perfil Comercial.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Descuentos Promocionales */}
            <div style={{ gridColumn: '1 / -1', background: 'rgba(255, 115, 0, 0.05)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255, 115, 0, 0.2)' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', color: 'var(--color-text-main)', fontSize: '0.9rem', marginBottom: '6px' }}>Nombre del Descuento</label>
                    <input type="text" placeholder="Ej: Especial Día del Padre" value={discountName} onChange={(e) => setDiscountName(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--color-text-main)', fontSize: '0.9rem', marginBottom: '6px' }}>Tipo de Descuento</label>
                    <CustomSelect options={[{ value: 'porcentaje', label: 'Porcentaje (%)' }, { value: 'fijo', label: 'Monto Fijo ($)' }]} value={discountType} onChange={(val) => setDiscountType(val as any)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--color-text-main)', fontSize: '0.9rem', marginBottom: '6px' }}>Valor del Descuento</label>
                    <input type="number" placeholder={discountType === 'porcentaje' ? 'Ej: 15' : 'Ej: 500'} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', outline: 'none' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(255,115,0,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <label style={{ color: 'var(--color-text-main)', fontSize: '0.95rem', fontWeight: 600 }}>Descuentos por Cantidad (Mayorista)</label>
                      <button 
                        type="button" 
                        onClick={() => setVolumeDiscounts([...volumeDiscounts, { minQty: '2', type: 'porcentaje', value: '' }])}
                        style={{ background: 'transparent', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', padding: '4px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        + Agregar Regla
                      </button>
                    </div>
                    
                    {volumeDiscounts.map((rule, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end', marginBottom: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                        <div>
                          <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Mínimo de Unidades</label>
                          <input type="number" min="2" value={rule.minQty} onChange={(e) => {
                            const newRules = [...volumeDiscounts];
                            newRules[idx].minQty = e.target.value;
                            setVolumeDiscounts(newRules);
                          }} style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', outline: 'none' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Tipo de Descuento</label>
                          <select 
                            value={rule.type} 
                            onChange={(e) => {
                              const newRules = [...volumeDiscounts];
                              newRules[idx].type = e.target.value as any;
                              setVolumeDiscounts(newRules);
                            }}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', outline: 'none', cursor: 'pointer' }}
                          >
                            <option value="porcentaje">Porcentaje (%)</option>
                            <option value="fijo">Monto Fijo ($)</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Valor del Descuento</label>
                          <input type="number" placeholder={rule.type === 'porcentaje' ? 'Ej: 10' : 'Ej: 500'} value={rule.value} onChange={(e) => {
                            const newRules = [...volumeDiscounts];
                            newRules[idx].value = e.target.value;
                            setVolumeDiscounts(newRules);
                          }} style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', outline: 'none' }} />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setVolumeDiscounts(volumeDiscounts.filter((_, i) => i !== idx))}
                          style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '8px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', height: '37.5px' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    ))}
                    {volumeDiscounts.length === 0 && (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0, fontStyle: 'italic' }}>
                        No hay descuentos por cantidad. Agrega una regla para incentivar compras mayores.
                      </p>
                    )}
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
            <div style={{ marginTop: '24px', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>💡 Podrás configurar el Asesor Virtual Personalizado para este producto una vez que lo hayas guardado.</p>
            </div>
          )}

          {formError && (
            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', color: '#ef4444', borderRadius: '4px', fontWeight: 500 }}>
              {formError}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            {currentStep > 1 ? (
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={handlePrev}
                style={{ padding: '12px 24px', borderRadius: 'var(--radius-full)' }}
              >
                Atrás
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => router.push('/mis-tiendas')}
                style={{ padding: '12px 24px', borderRadius: 'var(--radius-full)' }}
              >
                Cancelar
              </button>
            )}

            {currentStep < 3 ? (
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleNext}
                style={{ padding: '12px 32px', borderRadius: 'var(--radius-full)' }}
              >
                Siguiente
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleSubmit}
                style={{ padding: '12px 32px', borderRadius: 'var(--radius-full)' }}
              >
                {editId ? 'Guardar Cambios' : 'Publicar Producto'}
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
    </div>
  );
}

export default function NuevoProductoPage() {
  return (
    <React.Suspense fallback={<div style={{ padding: '100px', textAlign: 'center', color: 'white' }}>Cargando editor...</div>}>
      <NuevoProductoContent />
    </React.Suspense>
  );
}
