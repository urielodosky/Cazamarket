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
  const isFilterablePage = isHome || FILTERABLE_PAGES.some(p => pathname.startsWith(p));
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mode, toggleMode } = useTheme();
  const themeColors = useThemeColors();
  const { isLoggedIn, isVendorModeActive, toggleVendorMode } = useAuth();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');

  // Filtros state
  const [categoria, setCategoria] = useState('');
  const [ofrece, setOfrece] = useState<any>('');
  const [tipo, setTipo] = useState('');
  const [permisos, setPermisos] = useState('');
  
  const [provincia, setProvincia] = useState('');
  const [localidad, setLocalidad] = useState('');
  
  const [provincias, setProvincias] = useState<SelectOption[]>([]);
  const [localidades, setLocalidades] = useState<SelectOption[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cerrar filtros automáticamente al navegar a una página sin filtros
  useEffect(() => {
    if (!isFilterablePage) {
      setIsFiltersOpen(false);
    }
  }, [pathname, isFilterablePage]);

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
        const res = await fetch(`https://apis.datos.gob.ar/georef/api/municipios?provincia=${encodeURIComponent(provincia)}&max=1000`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.municipios) {
          const opts = data.municipios.map((m: any) => ({ value: m.nombre, label: m.nombre }));
          opts.sort((a: any, b: any) => a.label.localeCompare(b.label));
          setLocalidades([{ value: '', label: 'Localidades' }, ...opts]);
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
    if (ofrece) params.set('ofrece', ofrece);
    if (tipo) params.set('tipo', tipo);
    if (provincia) params.set('provincia', provincia);
    if (localidad) params.set('localidad', localidad);
    
    let basePath = pathname || '/productos';
    if (basePath === '/' || basePath.includes('mis-tiendas') || basePath.includes('configuracion') || basePath.includes('registro')) {
       basePath = '/productos';
    }
    router.push(`${basePath}?${params.toString()}`);
  };

  const isInitialMount = useRef(true);

  // Auto-search effect for filters
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    executeSearch();
  }, [categoria, ofrece, tipo, provincia, localidad, ratingFilter]);

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

  return (
    <header className="navbar-header" suppressHydrationWarning>
      <div className={`navbar-container ${isHome ? 'is-home-mobile' : ''}`}>
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
              display: (isFilterablePage && !isHome && !isBusinessProfile) ? 'flex' : 'none',
              background: '#1A1D17'
            }}>
                <input 
                  suppressHydrationWarning
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder} 
                  onKeyDown={(e) => { if (e.key === 'Enter') executeSearch(); }}
                  style={{ marginLeft: '12px', color: themeColors.textWhite, width: '100%', background: 'transparent', border: 'none', outline: 'none' }}
                />
                <button 
                  className="search-icon-btn" 
                  onClick={() => executeSearch()} 
                  title="Buscar"
                  style={{ 
                    background: 'var(--color-primary)', 
                    color: 'white',
                    border: 'none', 
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginRight: '4px',
                    transition: 'transform 0.2s, background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
                {isFilterablePage && <button 
                  suppressHydrationWarning
                  type="button"
                  className="filter-btn-premium"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsFiltersOpen(!isFiltersOpen);
                  }}
                  style={{ 
                    borderRadius: '100px', 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '6px 16px',
                    marginLeft: 'auto',
                    background: isFiltersOpen ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
                    border: isFiltersOpen ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                    color: isFiltersOpen ? 'white' : themeColors.textWhite,
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    if (isFiltersOpen) return;
                    e.currentTarget.style.background = themeColors.bgSubtle4;
                    e.currentTarget.style.borderColor = themeColors.borderSubtle;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    if (isFiltersOpen) return;
                    e.currentTarget.style.background = themeColors.bgSubtle3;
                    e.currentTarget.style.borderColor = themeColors.borderSubtle3;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <svg 
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
                    style={{ 
                      color: isFiltersOpen ? 'white' : 'var(--color-primary)',
                      transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isFiltersOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      pointerEvents: 'none'
                    }}
                  >
                    <circle cx="6" cy="14" r="3"></circle>
                    <line x1="6" y1="3" x2="6" y2="11"></line>
                    <line x1="6" y1="17" x2="6" y2="21"></line>

                    <circle cx="12" cy="8" r="3"></circle>
                    <line x1="12" y1="3" x2="12" y2="5"></line>
                    <line x1="12" y1="11" x2="12" y2="21"></line>

                    <circle cx="18" cy="16" r="3"></circle>
                    <line x1="18" y1="3" x2="18" y2="13"></line>
                    <line x1="18" y1="19" x2="18" y2="21"></line>
                  </svg>
                  <span className="filter-text-mobile">Filtros</span>
                </button>}
              </div>
            {!isHome && <div className="divider-vertical-animated" style={{ display: 'none' }}></div>}
  
  
            <div className={`links-wrapper ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
              <NavLinks />
            </div>
          </div>

        {/* Panel de Filtros Animado */}
        {isFilterablePage && (
          <div 
            className="filters-panel"
          style={{
            width: isFiltersOpen ? (pathname.startsWith('/comunidad') ? '240px' : '580px') : '0px',
            opacity: isFiltersOpen ? 1 : 0,
            visibility: isFiltersOpen ? 'visible' : 'hidden',
            overflow: isFiltersOpen ? 'visible' : 'hidden',
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s',
            borderRadius: '20px',
            padding: isFiltersOpen ? '14px 20px' : '0px',
            height: '112px',
            minHeight: '112px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            marginLeft: isFiltersOpen ? '0px' : '-16px',
            zIndex: 5,
            backgroundColor: 'var(--color-bg-surface-elevated)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '12px', 
            width: '100%', 
            opacity: isFiltersOpen ? 1 : 0, 
            transition: 'opacity 0.3s ease 0.2s' 
          }}>
            
            {/* Categoría */}
            <div style={{ flex: '1 1 calc(33.333% - 8px)', minWidth: '130px', zIndex: 120 }}>
              <CustomSelect 
                options={(() => {
                  const isProd = pathname.startsWith('/productos');
                  const isServ = pathname.startsWith('/servicios');
                  const source = isProd ? PRODUCT_MAIN_CATEGORIES : (isServ ? SERVICE_MAIN_CATEGORIES : CATEGORIES_DATA);
                  
                  const selectedMainCat = source.find(m => 
                    m.name.toLowerCase() === categoria.toLowerCase() || 
                    m.subcategories.some(s => s.toLowerCase() === categoria.toLowerCase())
                  );

                  const opts: SelectOption[] = [
                    { value: '', label: 'Categoría (Todas)' }
                  ];

                  source.forEach(mainCat => {
                    opts.push({ value: mainCat.name, label: mainCat.name });
                    
                    if (selectedMainCat && selectedMainCat.id === mainCat.id) {
                      mainCat.subcategories.forEach(sub => {
                        opts.push({ value: sub, label: `• ${sub}` });
                      });
                    }
                  });

                  return opts;
                })()} 
                value={categoria} 
                onChange={setCategoria} 
                placeholder="Categoría" 
                searchable
              />
            </div>
            
            {/* Filtros adicionales (solo para secciones fuera de comunidad) */}
            {!pathname.startsWith('/comunidad') && (
              <>
                <div style={{ flex: '1 1 calc(33.333% - 8px)', minWidth: '130px', zIndex: 120 }}>
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

                <div style={{ flex: '1 1 calc(33.333% - 8px)', minWidth: '130px', zIndex: 110 }}>
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
              </>
            )}


            
            {/* Provincia (API) */}
            {!pathname.startsWith('/comunidad') && (
              <div style={{ flex: '1 1 calc(50% - 6px)', minWidth: '130px', zIndex: 100 }}>
                <CustomSelect 
                  options={provincias.length > 0 ? provincias : [{ value: '', label: 'Cargando...' }]} 
                  value={provincia} 
                  onChange={setProvincia} 
                  placeholder="Provincia" 
                  searchable={true}
                />
              </div>
            )}
            
            {/* Localidad (API) */}
            {!pathname.startsWith('/comunidad') && (
              <div style={{ flex: '1 1 calc(50% - 6px)', minWidth: '130px', zIndex: 100 }}>
                <CustomSelect 
                  options={provincia ? (localidades.length > 0 ? localidades : [{ value: '', label: 'Cargando...' }]) : []} 
                  value={localidad} 
                  onChange={setLocalidad} 
                  placeholder="Localidades" 
                  searchable={true}
                  disabled={!provincia}
                />
              </div>
            )}

          </div>
        </div>
        )}
        </div>

        <div className="navbar-actions">
          {!isClient ? (
            <div style={{ width: '120px', height: '40px' }} />
          ) : isLoggedIn ? (
            <UserMenu />
          ) : (
            <Link href="/registro" style={{ padding: '8px 24px', fontSize: '0.95rem', borderRadius: '100px', display: 'flex', alignItems: 'center', height: '40px', background: 'var(--color-primary)', color: 'white', fontWeight: 600, textDecoration: 'none' }}>
              Empezar ahora
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
