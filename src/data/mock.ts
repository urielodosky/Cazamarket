import { PlanTier } from '@/types/planTypes';

export const NEGOCIOS_DATA: any[] = [
  {
    id: 101,
    name: 'Caza & Pesca Total',
    rating: 4.8,
    reviews: 124,
    image: '/promo_cta_background.png',
    avatar: 'https://ui-avatars.com/api/?name=Caza+Pesca&background=ff7300&color=fff',
    planTier: 'empresarial',
    description: 'La tienda líder en equipamiento para caza mayor y pesca deportiva en la región.',
    businessType: 'Tienda',
    categories: ['Armas', 'Pesca', 'Indumentaria'],
    locations: [{ province: 'Buenos Aires', city: 'Capital Federal' }],
    productsCount: 45,
    servicesCount: 2,
    theme: null,
  },
  {
    id: 102,
    name: 'Aventuras Outdoor',
    rating: 4.5,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?q=80&w=1200&auto=format&fit=crop',
    avatar: 'https://ui-avatars.com/api/?name=Aventuras+Outdoor&background=222&color=fff',
    planTier: 'comercial',
    description: 'Equipamiento táctico, óptica y supervivencia para los más exigentes.',
    businessType: 'Distribuidor',
    categories: ['Óptica', 'Supervivencia', 'Accesorios'],
    locations: [{ province: 'Córdoba', city: 'Córdoba Capital' }],
    productsCount: 120,
    servicesCount: 0,
    theme: null,
  },
  {
    id: 103,
    name: 'Guías del Sur',
    rating: 5.0,
    reviews: 32,
    image: 'https://images.unsplash.com/photo-1559825481-12a05cc00344?q=80&w=1200&auto=format&fit=crop',
    avatar: 'https://ui-avatars.com/api/?name=Guías+del+Sur&background=006400&color=fff',
    planTier: 'basico',
    description: 'Servicios de guías de pesca con mosca en la Patagonia.',
    businessType: 'Servicio',
    categories: ['Pesca con mosca', 'Guías', 'Turismo'],
    locations: [{ province: 'Neuquén', city: 'San Martín de los Andes' }],
    productsCount: 0,
    servicesCount: 5,
    theme: null,
  }
];

export const PRODUCTOS_DATA: any[] = [];
export const SERVICIOS_DATA: any[] = [];
