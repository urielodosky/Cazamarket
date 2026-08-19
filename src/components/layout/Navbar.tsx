'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import UserMenu from './UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import CustomSelect, { SelectOption } from '../ui/CustomSelect';
import DarkModeToggle from '../ui/DarkModeToggle';
import { CATEGORIES_DATA, PRODUCT_MAIN_CATEGORIES, SERVICE_MAIN_CATEGORIES } from '@/constants/categoriesData';
import './Navbar.css';
import logoPng from '../../../public/logo.png';

const NavLinks = () => (
  <nav className="navbar-links">
    <Link href="/negocios" className="nav-link">Negocios</Link>
    <Link href="/productos" className="nav-link">Productos</Link>
    <Link href="/servicios" className="nav-link">Servicios</Link>
    <Link href="/planes" className="nav-link">Planes</Link>
    <Link href="/comunidad" className="nav-link">Comunidad</Link>
  </nav>
);
export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  // Solo mostrar filtros en las páginas donde tiene sentido buscar/filtrar
  const FILTERABLE_PAGES = ['/productos', '/servicios', '/negocios', '/comunidad'];
  const isFilterablePage = FILTERABLE_PAGES.some(p => pathname.startsWith(p));
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mode, toggleMode } = useTheme();
  const themeColors = useThemeColors();
  const { isLoggedIn, isVendorModeActive, toggleVendorMode } = useAuth();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [rating, setRating] = useState('');
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [isGuestMenuOpen, setIsGuestMenuOpen] = useState(false);
  const guestMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (guestMenuRef.current && !guestMenuRef.current.contains(event.target as Node)) {
        setIsGuestMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtros state
  const [categoria, setCategoria] = useState(searchParams?.get('categoria') || '');
  const [subcategorias, setSubcategorias] = useState<string[]>(
    searchParams?.get('subcategorias') ? searchParams.get('subcategorias')!.split(',') : []
  );
  const [minPrice, setMinPrice] = useState(searchParams?.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams?.get('maxPrice') || '');
  const [minPriceInput, setMinPriceInput] = useState(searchParams?.get('minPrice') || '');
  const [maxPriceInput, setMaxPriceInput] = useState(searchParams?.get('maxPrice') || '');
  const [currency, setCurrency] = useState(searchParams?.get('currency') || '');
  const [businessType, setBusinessType] = useState(searchParams?.get('businessType') || '');

  // Debounce para el precio
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setMinPrice(minPriceInput);
      setMaxPrice(maxPriceInput);
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [minPriceInput, maxPriceInput]);
  const [ofrece, setOfrece] = useState<any>('');
  const [tipo, setTipo] = useState('');
  const [permisos, setPermisos] = useState('');
  
  const [provincia, setProvincia] = useState('');
  const [localidad, setLocalidad] = useState('');
  
  const [provincias, setProvincias] = useState<SelectOption[]>([]);
  const [localidades, setLocalidades] = useState<SelectOption[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cerrar filtros automáticamente al navegar a una página sin filtros
  useEffect(() => {
    setRating('');
  }, [pathname]);

  const filtersCarouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollArrows = () => {
    if (filtersCarouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = filtersCarouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    updateScrollArrows();
    window.addEventListener('resize', updateScrollArrows);
    return () => window.removeEventListener('resize', updateScrollArrows);
  }, []);

  // Update scroll arrows when dynamic items might appear
  useEffect(() => {
    setTimeout(updateScrollArrows, 50);
  }, [provincia, categoria, subcategorias.length]);

  const scrollFilters = (direction: 'left' | 'right') => {
    if (filtersCarouselRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      filtersCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchProvincias = async () => {
      try {
        const res = await fetch('https://apis.datos.gob.ar/georef/api/provincias', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.provincias) {
          const opts = data.provincias.map((p: any) => ({ value: p.nombre, label: p.nombre }));
          opts.sort((a: any, b: any) => a.label.localeCompare(b.label));
          setProvincias([{ value: '', label: 'Todas las Provincias' }, ...opts]);
        }
      } catch (err) {
        // Fallback options in case API fails or is blocked
        setProvincias([
          { value: '', label: 'Todas las Provincias' },
          { value: 'Buenos Aires', label: 'Buenos Aires' },
          { value: 'CABA', label: 'CABA' },
          { value: 'Córdoba', label: 'Córdoba' },
          { value: 'Santa Fe', label: 'Santa Fe' },
        ]);
      }
    };
    fetchProvincias();
  }, []);

  useEffect(() => {
    if (!provincia) {
      setLocalidades([]);
      setLocalidad('');
      return;
    }
    setLocalidad('');
    const fetchLocalidades = async () => {
      try {
        const res = await fetch(`https://apis.datos.gob.ar/georef/api/localidades?provincia=${encodeURIComponent(provincia)}&max=1000`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.localidades) {
          const opts = data.localidades.map((m: any) => ({ value: m.nombre, label: m.nombre }));
          
          // Eliminar duplicados ya que localidades a veces devuelve nombres repetidos por parajes/censos
          const uniqueOpts = Array.from(new Map(opts.map((item: any) => [item.value, item])).values()) as SelectOption[];
          
          uniqueOpts.sort((a: any, b: any) => a.label.localeCompare(b.label));
          setLocalidades([{ value: '', label: 'Localidades' }, ...uniqueOpts]);
        }
      } catch (err) {
        setLocalidades([{ value: '', label: 'Localidades' }]);
      }
    };
    fetchLocalidades();
  }, [provincia]);

  const executeSearch = (overrideQuery?: string) => {
    const q = overrideQuery !== undefined ? overrideQuery : searchQuery;
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (categoria) params.set('categoria', categoria);
    if (subcategorias.length > 0) params.set('subcategorias', subcategorias.join(','));
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (currency) params.set('currency', currency);
    if (businessType) params.set('businessType', businessType);
    if (ofrece) params.set('ofrece', ofrece);
    if (tipo) params.set('tipo', tipo);
    if (provincia) params.set('provincia', provincia);
    if (localidad) params.set('localidad', localidad);
    if (rating) params.set('rating', rating);
    
    let basePath = pathname || '/productos';
    if (basePath === '/' || basePath.includes('mis-tiendas') || basePath.includes('configuracion') || basePath.includes('registro')) {
       basePath = '/productos';
    }
    const queryString = params.toString();
    router.push(queryString ? `${basePath}?${queryString}` : basePath);
  };

  const isInitialMount = useRef(true);

  // Auto-search effect for filters
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    executeSearch();
  }, [categoria, subcategorias, minPrice, maxPrice, currency, businessType, ofrece, tipo, provincia, localidad, rating]);

  const isBusinessProfile = pathname?.startsWith('/negocios/') && pathname !== '/negocios';

  const isSearchablePage = (pathname?.includes('/negocios') || 
                           pathname?.includes('/productos') || 
                           pathname?.includes('/servicios') ||
                           pathname?.includes('/comunidad')) && !isBusinessProfile;

  let searchPlaceholder = "Buscar...";
  if (pathname?.includes('/negocios')) searchPlaceholder = "Buscar negocios...";
  else if (pathname?.includes('/productos')) searchPlaceholder = "Buscar productos...";
  else if (pathname?.includes('/servicios')) searchPlaceholder = "Buscar servicios...";
  else if (pathname?.includes('/planes')) searchPlaceholder = "Buscar planes...";
  else if (pathname?.includes('/comunidad')) searchPlaceholder = "Buscar en comunidad...";

  let navbarModeClass = (!isFilterablePage || isHome || isBusinessProfile) ? 'business-mode' : 'expanded-mode';

  const hasActiveFilters = Boolean(categoria || subcategorias.length > 0 || minPriceInput || maxPriceInput || currency || businessType || ofrece || tipo || provincia || localidad || rating || searchQuery);

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoria('');
    setSubcategorias([]);
    setMinPrice('');
    setMaxPrice('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setCurrency('');
    setBusinessType('');
    setOfrece('');
    setTipo('');
    setProvincia('');
    setLocalidad('');
    setRating('');
    
    let basePath = pathname || '/productos';
    if (basePath === '/' || basePath.includes('mis-tiendas') || basePath.includes('configuracion') || basePath.includes('registro')) {
       basePath = '/productos';
    }
    router.push(basePath);
  };

  const renderFiltersContent = () => (
    <>
      {hasActiveFilters && (
        <div className="filter-wrapper-item" style={{ flex: '0 0 auto', zIndex: 130 }}>
          <button 
            onClick={handleResetFilters}
            style={{ 
              background: 'rgba(255, 115, 0, 0.1)', 
              color: 'var(--color-primary)', 
              border: '1px solid rgba(255, 115, 0, 0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 16px',
              fontWeight: 500,
              height: '36px',
              borderRadius: '18px',
              whiteSpace: 'nowrap',
              width: 'auto',
              outline: 'none'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            Restablecer filtros
          </button>
        </div>
      )}
      {/* 1. Precio (Min/Max) */}
      {!pathname.startsWith('/comunidad') && (
        <>
          <div className="filter-wrapper-item" style={{ flex: '0 0 auto', minWidth: '110px', zIndex: 125 }}>
            <CustomSelect
              options={[
                { value: '', label: 'Moneda' },
                { value: 'USD', label: 'USD' },
                { value: 'ARS', label: 'ARS' }
              ]}
              value={currency}
              onChange={setCurrency}
              placeholder="Moneda"
            />
          </div>
          <div className="filter-wrapper-item" style={{ flex: '0 0 auto', display: 'flex', gap: '4px', alignItems: 'center', minWidth: '170px' }}>
            <input 
              type="number" 
              placeholder="Mín ($)" 
              value={minPriceInput} 
              onChange={(e) => setMinPriceInput(e.target.value)} 
              className="filter-input-pill"
            />
            <span style={{ color: 'var(--color-text-muted)' }}>-</span>
            <input 
              type="number" 
              placeholder="Máx ($)" 
              value={maxPriceInput} 
              onChange={(e) => setMaxPriceInput(e.target.value)} 
              className="filter-input-pill"
            />
          </div>
        </>
      )}

      {/* 2. Categoría */}
      <div className="filter-wrapper-item" style={{ flex: '1 1 calc(33.333% - 8px)', minWidth: '130px', zIndex: 120 }}>
        <CustomSelect 
          options={(() => {
            const isProd = pathname.startsWith('/productos');
            const isServ = pathname.startsWith('/servicios');
            const source = isProd ? PRODUCT_MAIN_CATEGORIES : (isServ ? SERVICE_MAIN_CATEGORIES : CATEGORIES_DATA);
            
            const opts: SelectOption[] = [
              { value: '', label: 'Categoría (Todas)' }
            ];

            source.forEach(mainCat => {
              opts.push({ value: mainCat.name, label: mainCat.name });
            });

            return opts;
          })()} 
          value={categoria} 
          onChange={(val) => {
            setCategoria(val);
            setSubcategorias([]);
          }} 
          placeholder="Categoría" 
          searchable
        />
      </div>

      {/* 3. Subcategorías dinámicas */}
      {categoria && (
        <div className="filter-wrapper-item" style={{ flex: '1 1 calc(33.333% - 8px)', minWidth: '180px', zIndex: 119 }}>
          <CustomSelect 
            options={(() => {
              const isProd = pathname.startsWith('/productos');
              const isServ = pathname.startsWith('/servicios');
              const source = isProd ? PRODUCT_MAIN_CATEGORIES : (isServ ? SERVICE_MAIN_CATEGORIES : CATEGORIES_DATA);
              
              const selectedMainCat = source.find(m => m.name.toLowerCase() === categoria.toLowerCase());
              
              const opts: SelectOption[] = [
                { value: '', label: 'Subcategorías (Todas)' }
              ];
              
              if (selectedMainCat && selectedMainCat.subcategories) {
                selectedMainCat.subcategories.forEach(sub => {
                  opts.push({ value: sub, label: sub });
                });
              }
              
              return opts;
            })()} 
            value={subcategorias} 
            onChange={(val) => {
              if (!val || val.length === 0 || val.includes('')) {
                setSubcategorias([]);
              } else if (val.length <= 2) {
                setSubcategorias(val);
              }
            }} 
            placeholder="Subcategorías (Hasta 2)" 
            searchable
            multiple
          />
        </div>
      )}

      {/* Filtros adicionales (solo para secciones fuera de comunidad) */}
      {!pathname.startsWith('/comunidad') && (
        <>
          {/* Tipo de Vendedor (solo productos) */}
          {pathname.startsWith('/productos') && (
            <div className="filter-wrapper-item" style={{ flex: '1 1 calc(33.333% - 8px)', minWidth: '150px', zIndex: 115 }}>
              <CustomSelect 
                options={[
                  { value: '', label: 'Vendedor (Todos)' },
                  { value: 'minorista', label: 'Minorista' },
                  { value: 'mayorista', label: 'Mayorista' },
                  { value: 'mixto', label: 'Mixto' },
                ]} 
                value={businessType} 
                onChange={setBusinessType} 
                placeholder="Tipo Vendedor" 
              />
            </div>
          )}

          {/* Envío / Extras / Ofrece */}
          <div className="filter-wrapper-item" style={{ flex: '1 1 calc(33.333% - 8px)', minWidth: '130px', zIndex: 120 }}>
            <CustomSelect 
              options={
                pathname.startsWith('/productos')
                  ? [
                      { value: '', label: 'Envío (Todos)' },
                      { value: 'envio', label: 'Envío' },
                      { value: 'envio_gratis', label: 'Envío Gratis' },
                      { value: 'retiro', label: 'Retiro en sucursal' },
                    ]
                  : pathname.startsWith('/servicios')
                  ? [
                      { value: 'equipamiento', label: 'Equipamiento' },
                      { value: 'transporte', label: 'Transporte' },
                      { value: 'comida', label: 'Comida/Bebida' },
                      { value: 'seguro', label: 'Seguro' },
                    ]
                  : [
                      { value: '', label: 'Ofrece (Ambos)' },
                      { value: 'productos', label: 'Productos' },
                      { value: 'servicios', label: 'Servicios' },
                    ]
              } 
              value={ofrece} 
              onChange={setOfrece} 
              placeholder={pathname.startsWith('/productos') ? "Envío" : (pathname.startsWith('/servicios') ? "Extras" : "Ofrece")} 
              multiple={pathname.startsWith('/servicios')} 
            />
          </div>

          {/* Condición / Duración / Tipo */}
          <div className="filter-wrapper-item" style={{ flex: '1 1 calc(33.333% - 8px)', minWidth: '130px', zIndex: 110 }}>
            <CustomSelect 
              options={
                pathname.startsWith('/productos')
                  ? [
                      { value: '', label: 'Condición (Todas)' },
                      { value: 'nuevo', label: 'Nuevo' },
                      { value: 'usado', label: 'Usado' },
                    ]
                  : pathname.startsWith('/servicios')
                  ? [
                      { value: '', label: 'Duración (Todas)' },
                      { value: '1-4', label: '1-4 horas' },
                      { value: '5-8', label: '5-8 hs' },
                      { value: '9-12', label: '9-12 hs' },
                      { value: '+12', label: '+12 horas' },
                    ]
                  : [
                      { value: '', label: 'Tipo (Todos)' },
                      { value: 'mayorista', label: 'Mayorista' },
                      { value: 'minorista', label: 'Minorista' },
                      { value: 'mixto', label: 'Mixto' },
                    ]
              } 
              value={tipo} 
              onChange={setTipo} 
              placeholder={pathname.startsWith('/productos') ? "Condición" : (pathname.startsWith('/servicios') ? "Duración" : "Tipo")} 
            />
          </div>

          {/* Rating */}
          <div className="filter-wrapper-item" style={{ flex: '1 1 calc(33.333% - 8px)', minWidth: '140px', zIndex: 105 }}>
            <CustomSelect 
              options={[
                { value: '', label: 'Rating (Todos)' },
                { value: '5', label: '★★★★★ (5)' },
                { value: '4', label: '★★★★☆ (4 o más)' },
                { value: '3', label: '★★★☆☆ (3 o más)' },
                { value: 'menos_3', label: 'Menos de 3' },
                { value: 'nuevo', label: 'Nuevos' },
              ]} 
              value={rating} 
              onChange={setRating} 
              placeholder="Rating" 
            />
          </div>

          {/* Provincia (API) */}
          <div className="filter-wrapper-item" style={{ flex: '1 1 calc(33.333% - 8px)', minWidth: '130px', zIndex: 100 }}>
            <CustomSelect 
              options={provincias.length > 0 ? provincias : [{ value: '', label: 'Cargando...' }]} 
              value={provincia} 
              onChange={setProvincia} 
              placeholder="Provincia" 
              searchable={true}
            />
          </div>
          
          {/* Localidad (dinámica: aparece solo si hay provincia) */}
          {provincia && (
            <div className="filter-wrapper-item" style={{ flex: '1 1 calc(33.333% - 8px)', minWidth: '130px', zIndex: 99 }}>
              <CustomSelect 
                options={localidades.length > 0 ? localidades : [{ value: '', label: 'Cargando...' }]} 
                value={localidad} 
                onChange={setLocalidad} 
                placeholder="Localidades" 
                searchable={true}
              />
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <header className="navbar-header" suppressHydrationWarning>
      <div className={`navbar-container ${isHome ? 'is-home-mobile' : ''} ${isSearchFocused ? 'search-focused' : ''}`}>
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menú"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '28px', height: '28px' }}>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div className="navbar-logo">
          <Link href="/">
            <img 
              src={logoPng.src}
              alt="CazaMarket Logo" 
              className="navbar-logo-img"
            />
          </Link>
        </div>

        
        <div 
          className={`navbar-middle-area ${!(isFilterablePage && !isHome && !isBusinessProfile) ? 'mobile-hidden' : ''}`}
          style={{ 
            display: 'flex', 
            gap: '12px', 
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)', 
            alignItems: 'stretch'
          }}
        >
          <div className={`navbar-center glass-panel ${navbarModeClass}`}>
            <div className="search-bar-animated" style={{ 
              zIndex: 10, 
              display: (isFilterablePage && !isHome && !isBusinessProfile) ? 'flex' : 'none'
            }}>
                <button 
                  className="search-icon-btn" 
                  onClick={() => executeSearch()} 
                  title="Buscar"
                  style={{ 
                    border: 'none', 
                    width: '48px',
                    height: '44px',
                    borderRadius: '100px 0 0 100px',
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: 'var(--color-primary)',
                    color: 'white',
                    transition: 'transform 0.2s, background-color 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)';
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
                <input 
                  suppressHydrationWarning
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setIsSearchFocused(false), 200);
                  }}
                  placeholder={searchPlaceholder} 
                  onKeyDown={(e) => { if (e.key === 'Enter') executeSearch(); }}
                  style={{ marginLeft: '12px', color: themeColors.textWhite, width: '100%', background: 'transparent', border: 'none', outline: 'none', height: '100%' }}
                />

              </div>
            {!isHome && <div className="divider-vertical-animated" style={{ display: 'none' }}></div>}
  
  
            <div className={`links-wrapper ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
              <NavLinks />
            </div>
          </div>


        </div>

        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className={`theme-toggle-wrapper ${(isFilterablePage && !isHome && !isBusinessProfile) ? 'has-searchbar' : ''}`}>
            <DarkModeToggle />
          </div>
          {!isClient ? (
            <div style={{ width: '120px', height: '40px' }} />
          ) : isLoggedIn ? (
            <UserMenu />
          ) : (
            <div className="guest-menu-container" ref={guestMenuRef} style={{ position: 'relative' }}>
              {/* Desktop: Botón CTA "Empezar ahora" */}
              <Link href="/registro" className={`guest-cta-desktop ${isHome ? 'show-on-mobile' : ''}`} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(220,100,0,0.3)',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
              }}>
                Empezar ahora
              </Link>

              {/* Mobile: Ícono de usuario con dropdown */}
              <button 
                className={`guest-icon-mobile ${isHome ? 'hide-on-mobile' : ''}`}
                onClick={() => setIsGuestMenuOpen(!isGuestMenuOpen)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--color-bg-surface-elevated)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  outline: 'none',
                  color: 'var(--color-text-muted)'
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </button>

              {isGuestMenuOpen && (
                <div className="user-dropdown-menu" style={{ 
                  position: 'absolute', 
                  right: 0, 
                  top: '100%', 
                  marginTop: '12px',
                  background: 'var(--color-bg-surface-elevated)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '8px 0',
                  minWidth: '200px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  zIndex: 1000,
                  overflow: 'hidden'
                }}>
                  <Link href="/registro" onClick={() => setIsGuestMenuOpen(false)} style={{ display: 'block', padding: '12px 16px', color: 'white', textDecoration: 'none', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    Registrarse
                  </Link>
                  <Link href="/registro?mode=login" onClick={() => setIsGuestMenuOpen(false)} style={{ display: 'block', padding: '12px 16px', color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 500 }}>
                    Iniciar sesión
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global Filters Horizontal Strip (debajo del navbar) */}
      {(isFilterablePage && !isBusinessProfile) && (
        <div className="filters-carousel-wrapper">
          {canScrollLeft && (
            <button className="filter-scroll-btn left" onClick={() => scrollFilters('left')} aria-label="Scroll left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
          )}
          <div className="global-filters-panel" ref={filtersCarouselRef} onScroll={updateScrollArrows}>
            {renderFiltersContent()}
          </div>
          {canScrollRight && (
            <button className="filter-scroll-btn right" onClick={() => scrollFilters('right')} aria-label="Scroll right">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
