// ==========================================
// Plan Types, Constants & Permissions Engine
// ==========================================

export type PlanTier = 'gratis' | 'basico' | 'emprendedor' | 'comercial' | 'empresarial';
export type PlanCategory = 'productos' | 'servicios' | 'mixto';

export interface PlanPermissions {
  // Productos
  maxProductos: number;
  // Servicios
  maxServicios: number;
  // Categorías permitidas para el negocio
  maxCategorias: number;
  // Límite de sucursales adicionales
  maxSucursales: number;
  // Features comunes
  tiendaVirtual: boolean;
  insigniaVerificada: boolean;
  banner: boolean;
  categorias: boolean;
  whatsappBtn: boolean;
  carritoWhatsApp: boolean;
  chatInterno: boolean;
  botAsesor: boolean;
  coloresPersonalizados: boolean;
  contactoBasico: boolean;
  // Features exclusivas de servicios
  mapasTerritorio: boolean;
  googleMaps: boolean;
  calendario: boolean;
  promociones: boolean;
}

// ==========================================
// Permission Matrices
// ==========================================

const PRODUCT_PERMISSIONS: Record<PlanTier, PlanPermissions> = {
  gratis: {
    maxProductos: 3, maxServicios: 0, maxCategorias: 3, maxSucursales: 0,
    tiendaVirtual: false, insigniaVerificada: false, banner: false, categorias: false,
    whatsappBtn: true, carritoWhatsApp: false, chatInterno: false, botAsesor: false,
    coloresPersonalizados: false, contactoBasico: true,
    mapasTerritorio: false, googleMaps: false, calendario: false, promociones: false,
  },
  basico: {
    maxProductos: 15, maxServicios: 0, maxCategorias: 3, maxSucursales: 1,
    tiendaVirtual: true, insigniaVerificada: true, banner: false, categorias: false,
    whatsappBtn: true, carritoWhatsApp: true, chatInterno: false, botAsesor: false,
    coloresPersonalizados: false, contactoBasico: true,
    mapasTerritorio: false, googleMaps: false, calendario: false, promociones: false,
  },
  emprendedor: {
    maxProductos: 40, maxServicios: 0, maxCategorias: 4, maxSucursales: 2,
    tiendaVirtual: true, insigniaVerificada: true, banner: true, categorias: true,
    whatsappBtn: true, carritoWhatsApp: true, chatInterno: false, botAsesor: false,
    coloresPersonalizados: false, contactoBasico: true,
    mapasTerritorio: false, googleMaps: false, calendario: false, promociones: false,
  },
  comercial: {
    maxProductos: 100, maxServicios: 0, maxCategorias: 5, maxSucursales: 5,
    tiendaVirtual: true, insigniaVerificada: true, banner: true, categorias: true,
    whatsappBtn: true, carritoWhatsApp: true, chatInterno: true, botAsesor: false,
    coloresPersonalizados: false, contactoBasico: true,
    mapasTerritorio: false, googleMaps: false, calendario: false, promociones: false,
  },
  empresarial: {
    maxProductos: Infinity, maxServicios: 0, maxCategorias: 7, maxSucursales: 10,
    tiendaVirtual: true, insigniaVerificada: true, banner: true, categorias: true,
    whatsappBtn: true, carritoWhatsApp: true, chatInterno: true, botAsesor: true,
    coloresPersonalizados: true, contactoBasico: true,
    mapasTerritorio: false, googleMaps: false, calendario: false, promociones: false,
  },
};

const SERVICE_PERMISSIONS: Record<Exclude<PlanTier, 'gratis'>, PlanPermissions> = {
  basico: {
    maxProductos: 0, maxServicios: 2, maxCategorias: 3, maxSucursales: 5,
    tiendaVirtual: true, insigniaVerificada: true, banner: false, categorias: false,
    whatsappBtn: true, carritoWhatsApp: true, chatInterno: false, botAsesor: false,
    coloresPersonalizados: false, contactoBasico: true,
    mapasTerritorio: false, googleMaps: false, calendario: false, promociones: false,
  },
  emprendedor: {
    maxProductos: 0, maxServicios: 5, maxCategorias: 4, maxSucursales: 5,
    tiendaVirtual: true, insigniaVerificada: true, banner: true, categorias: true,
    whatsappBtn: true, carritoWhatsApp: true, chatInterno: false, botAsesor: false,
    coloresPersonalizados: false, contactoBasico: true,
    mapasTerritorio: false, googleMaps: false, calendario: false, promociones: false,
  },
  comercial: {
    maxProductos: 0, maxServicios: 10, maxCategorias: 5, maxSucursales: 5,
    tiendaVirtual: true, insigniaVerificada: true, banner: true, categorias: true,
    whatsappBtn: true, carritoWhatsApp: true, chatInterno: false, botAsesor: false,
    coloresPersonalizados: false, contactoBasico: true,
    mapasTerritorio: true, googleMaps: true, calendario: false, promociones: false,
  },
  empresarial: {
    maxProductos: 0, maxServicios: 20, maxCategorias: 7, maxSucursales: 15,
    tiendaVirtual: true, insigniaVerificada: true, banner: true, categorias: true,
    whatsappBtn: true, carritoWhatsApp: true, chatInterno: true, botAsesor: false,
    coloresPersonalizados: true, contactoBasico: true,
    mapasTerritorio: true, googleMaps: true, calendario: true, promociones: true,
  },
};

// Mixed = merge product + service permissions at same tier
function mergeMixedPermissions(prodTier: PlanTier, servTier: Exclude<PlanTier, 'gratis'>): PlanPermissions {
  const p = PRODUCT_PERMISSIONS[prodTier];
  const s = SERVICE_PERMISSIONS[servTier];
  return {
    maxProductos: p.maxProductos,
    maxServicios: s.maxServicios,
    maxCategorias: Math.max(p.maxCategorias, s.maxCategorias) + 2,
    maxSucursales: Math.max(p.maxSucursales, s.maxSucursales),
    tiendaVirtual: p.tiendaVirtual || s.tiendaVirtual,
    insigniaVerificada: p.insigniaVerificada || s.insigniaVerificada,
    banner: p.banner || s.banner,
    categorias: p.categorias || s.categorias,
    whatsappBtn: p.whatsappBtn || s.whatsappBtn,
    carritoWhatsApp: p.carritoWhatsApp,
    chatInterno: p.chatInterno || s.chatInterno,
    botAsesor: p.botAsesor,
    coloresPersonalizados: p.coloresPersonalizados,
    contactoBasico: p.contactoBasico || s.contactoBasico,
    mapasTerritorio: s.mapasTerritorio,
    googleMaps: s.googleMaps,
    calendario: s.calendario,
    promociones: s.promociones,
  };
}

export function getPlanPermissions(productTier: PlanTier, serviceTier: PlanTier): PlanPermissions {
  if (productTier === 'gratis' && serviceTier === 'gratis') {
    return PRODUCT_PERMISSIONS['gratis'];
  }
  
  if (productTier !== 'gratis' && serviceTier !== 'gratis') {
    return mergeMixedPermissions(productTier, serviceTier as Exclude<PlanTier, 'gratis'>);
  }
  
  if (productTier !== 'gratis') {
    return PRODUCT_PERMISSIONS[productTier];
  }
  
  // Si solo hay servicios
  return SERVICE_PERMISSIONS[serviceTier as Exclude<PlanTier, 'gratis'>] || PRODUCT_PERMISSIONS['gratis'];
}

// ==========================================
// Plan Card Data (for UI)
// ==========================================

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanCardData {
  tier: PlanTier;
  name: string;
  price: number;
  originalPrice?: number;
  features: PlanFeature[];
  recommended: boolean;
}

// --- PLANES DE PRODUCTOS ---
export const PRODUCT_PLANS: PlanCardData[] = [
  {
    tier: 'gratis',
    name: 'Gratis',
    price: 0,
    recommended: false,
    features: [
      { text: 'Hasta 3 publicaciones de productos', included: true },
      { text: 'Hasta 3 categorías para tu negocio', included: true },
      { text: 'Sucursales físicas', included: false },
      { text: 'Botón directo a WhatsApp', included: true },
      { text: 'Carrito a WhatsApp integrado', included: false },
      { text: 'Tienda virtual propia', included: false },
      { text: 'Insignia de verificado', included: false },
      { text: 'Banner propio en tienda', included: false },
      { text: 'Chat privado interno', included: false },
      { text: 'Bot asesor automático', included: false },
      { text: 'Colores personalizados de tienda', included: false },
      { text: 'Sin restricciones de herramientas', included: false },
    ],
  },
  {
    tier: 'basico',
    name: 'Básico',
    price: 14,
    recommended: false,
    features: [
      { text: 'Hasta 15 productos publicados', included: true },
      { text: 'Hasta 3 categorías para tu negocio', included: true },
      { text: '1 sucursal en total', included: true },
      { text: 'Tienda virtual en la plataforma', included: true },
      { text: 'Insignia de tienda verificada', included: true },
      { text: 'Contacto y carrito a WhatsApp', included: true },
      { text: 'Banner propio en tienda', included: false },
      { text: 'Chat privado interno', included: false },
      { text: 'Bot asesor automático', included: false },
      { text: 'Colores personalizados de tienda', included: false },
      { text: 'Sin restricciones de herramientas', included: false },
    ],
  },
  {
    tier: 'emprendedor',
    name: 'Emprendedor',
    price: 30,
    recommended: false,
    features: [
      { text: 'Hasta 40 productos publicados', included: true },
      { text: 'Hasta 4 categorías para tu negocio', included: true },
      { text: 'Hasta 2 sucursales en total', included: true },
      { text: 'Todo lo del plan Básico', included: true },
      { text: 'Banner propio de tienda', included: true },
      { text: 'Chat privado interno', included: false },
      { text: 'Bot asesor automático', included: false },
      { text: 'Colores personalizados de tienda', included: false },
      { text: 'Sin restricciones de herramientas', included: false },
    ],
  },
  {
    tier: 'comercial',
    name: 'Comercial',
    price: 52,
    recommended: true,
    features: [
      { text: 'Hasta 100 productos publicados', included: true },
      { text: 'Hasta 5 categorías para tu negocio', included: true },
      { text: 'Hasta 5 sucursales en total', included: true },
      { text: 'Todo lo del plan Emprendedor', included: true },
      { text: 'Chat privado con clientes', included: true },
      { text: 'Bot asesor automático', included: false },
      { text: 'Colores personalizados de tienda', included: false },
      { text: 'Sin restricciones de herramientas', included: false },
    ],
  },
  {
    tier: 'empresarial',
    name: 'Empresarial',
    price: 80,
    recommended: false,
    features: [
      { text: 'Productos ilimitados', included: true },
      { text: 'Hasta 7 categorías para tu negocio', included: true },
      { text: 'Hasta 10 sucursales en total', included: true },
      { text: 'Todo lo del plan Comercial', included: true },
      { text: 'Bot asesor con respuestas preconfiguradas', included: true },
      { text: 'Colores personalizados de tienda', included: true },
      { text: 'Sin restricciones de herramientas', included: true },
    ],
  },
];

// --- PLANES DE SERVICIOS ---
export const SERVICE_PLANS: PlanCardData[] = [
  {
    tier: 'basico',
    name: 'Básico',
    price: 14,
    recommended: false,
    features: [
      { text: 'Hasta 2 servicios publicados', included: true },
      { text: 'Hasta 5 sucursales en total', included: true },
      { text: 'Tienda virtual en la plataforma', included: true },
      { text: 'Insignia de cuenta verificada', included: true },
      { text: 'Contacto y carrito a WhatsApp', included: true },
      { text: 'Banner propio en tienda', included: false },
      { text: 'Mapas de ubicación', included: false },
      { text: 'Calendario de reservas', included: false },
      { text: 'Chat privado interno', included: false },
      { text: 'Promociones de varios días', included: false },
    ],
  },
  {
    tier: 'emprendedor',
    name: 'Emprendedor',
    price: 30,
    recommended: false,
    features: [
      { text: 'Hasta 5 servicios publicados', included: true },
      { text: 'Hasta 5 sucursales en total', included: true },
      { text: 'Todo lo del plan Básico', included: true },
      { text: 'Banner propio de tienda', included: true },
      { text: 'Mapas de territorio / Google Maps', included: false },
      { text: 'Calendario de reservas', included: false },
      { text: 'Chat privado interno', included: false },
      { text: 'Promociones de varios días', included: false },
    ],
  },
  {
    tier: 'comercial',
    name: 'Comercial',
    price: 52,
    recommended: true,
    features: [
      { text: 'Hasta 10 servicios publicados', included: true },
      { text: 'Hasta 5 sucursales en total', included: true },
      { text: 'Todo lo del plan Emprendedor', included: true },
      { text: 'Mapa de territorio (hectáreas)', included: true },
      { text: 'Ubicación en Google Maps', included: true },
      { text: 'Calendario de reservas', included: false },
      { text: 'Chat privado interno', included: false },
      { text: 'Promociones de varios días', included: false },
    ],
  },
  {
    tier: 'empresarial',
    name: 'Empresarial',
    price: 80,
    recommended: false,
    features: [
      { text: 'Hasta 20 servicios publicados', included: true },
      { text: 'Hasta 15 sucursales en total', included: true },
      { text: 'Todo lo del plan Comercial', included: true },
      { text: 'Chat privado con clientes', included: true },
      { text: 'Calendario interactivo de disponibilidad', included: true },
      { text: 'Promociones de varios días', included: true },
    ],
  },
];

// --- PLANES MIXTOS ---
export const MIXED_PLANS: PlanCardData[] = [
  {
    tier: 'basico',
    name: 'Básico Mixto',
    price: 24,
    originalPrice: 28,
    recommended: false,
    features: [
      { text: '15 Productos + 2 Servicios', included: true },
      { text: 'Hasta 5 sucursales en total', included: true },
      { text: 'Tienda virtual en la plataforma', included: true },
      { text: 'Insignia de cuenta verificada', included: true },
      { text: 'Contacto y carrito a WhatsApp', included: true },
      { text: 'Banner propio en tienda', included: false },
      { text: 'Mapas de territorio y Google Maps', included: false },
      { text: 'Chat privado con clientes', included: false },
      { text: 'Calendario de reservas', included: false },
      { text: 'Bot asesor automático', included: false },
      { text: 'Colores personalizados de tienda', included: false },
    ],
  },
  {
    tier: 'emprendedor',
    name: 'Emprendedor Mixto',
    price: 52,
    originalPrice: 60,
    recommended: false,
    features: [
      { text: '40 Productos + 5 Servicios', included: true },
      { text: 'Hasta 5 sucursales en total', included: true },
      { text: 'Todo lo del Básico Mixto', included: true },
      { text: 'Banner propio de tienda', included: true },
      { text: 'Mapas de territorio y Google Maps', included: false },
      { text: 'Chat privado con clientes', included: false },
      { text: 'Calendario de reservas', included: false },
      { text: 'Bot asesor automático', included: false },
      { text: 'Colores personalizados de tienda', included: false },
    ],
  },
  {
    tier: 'comercial',
    name: 'Comercial Mixto',
    price: 96,
    originalPrice: 104,
    recommended: true,
    features: [
      { text: '100 Productos + 10 Servicios', included: true },
      { text: 'Hasta 5 sucursales en total', included: true },
      { text: 'Todo lo del Emprendedor Mixto', included: true },
      { text: 'Chat privado con clientes', included: true },
      { text: 'Mapas de territorio + Google Maps', included: true },
      { text: 'Calendario de reservas', included: false },
      { text: 'Bot asesor automático', included: false },
      { text: 'Colores personalizados de tienda', included: false },
    ],
  },
  {
    tier: 'empresarial',
    name: 'Empresarial Mixto',
    price: 136,
    originalPrice: 160,
    recommended: false,
    features: [
      { text: 'Prods ilimitados + 20 Servicios', included: true },
      { text: 'Hasta 9 categorías para tu negocio', included: true },
      { text: 'Hasta 15 sucursales en total', included: true },
      { text: 'Todo lo del Comercial Mixto', included: true },
      { text: 'Bot asesor automático', included: true },
      { text: 'Calendario interactivo', included: true },
      { text: 'Colores personalizados', included: true },
    ],
  },
];

// ==========================================
// Helpers
// ==========================================

export const PLAN_TIER_ORDER: PlanTier[] = ['gratis', 'basico', 'emprendedor', 'comercial', 'empresarial'];

export function getPlanDisplayName(productTier: PlanTier, serviceTier: PlanTier): string {
  if (productTier === 'gratis' && serviceTier === 'gratis') return 'Gratis';
  
  const tierNames: Record<PlanTier, string> = {
    gratis: 'Gratis',
    basico: 'Básico',
    emprendedor: 'Emprendedor',
    comercial: 'Comercial',
    empresarial: 'Empresarial',
  };
  
  if (productTier !== 'gratis' && serviceTier !== 'gratis') {
    if (productTier === serviceTier) {
      return `${tierNames[productTier]} Mixto`;
    }
    return `Productos ${tierNames[productTier]} + Servicios ${tierNames[serviceTier]}`;
  }
  
  if (productTier !== 'gratis') return `Productos ${tierNames[productTier]}`;
  return `Servicios ${tierNames[serviceTier]}`;
}

export function getTierLevel(tier: PlanTier): number {
  return PLAN_TIER_ORDER.indexOf(tier);
}

export function isAtLeast(current: PlanTier, required: PlanTier): boolean {
  return getTierLevel(current) >= getTierLevel(required);
}
