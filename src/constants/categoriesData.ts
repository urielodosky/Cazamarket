export interface MainCategory {
  id: string;
  name: string;
  type: 'producto' | 'servicio';
  subcategories: string[];
}

export const CATEGORIES_DATA: MainCategory[] = [
  // --- CATEGORÍAS DE PRODUCTOS ---
  {
    id: 'armas_de_fuego',
    name: 'Armas de Fuego',
    type: 'producto',
    subcategories: [
      'Fusiles y Carabinas',
      'Escopetas',
      'Pistolas y Revólveres',
      'Fusiles Tácticos',
      'Armas de Colección y Avancarga',
      'Municiones',
      'Repuestos y Cargadores',
    ],
  },
  {
    id: 'optica',
    name: 'Óptica, Visión y Fototrampeo',
    type: 'producto',
    subcategories: [
      'Binoculares y Monoculares',
      'Telescopios Terrestres (Spotting Scopes)',
      'Telémetros Láser (Rangefinders)',
      'Visores Nocturnos y Térmicos',
      'Cámaras de Fototrampeo (Trail Cams) y Cajas de Seguridad',
      'Adaptadores de Digiscoping (para conectar celulares a la óptica)',
    ],
  },
  {
    id: 'cuchilleria',
    name: 'Cuchillería y Procesamiento',
    type: 'producto',
    subcategories: [
      'Cuchillos de Desuello (Skinners) y Remate',
      'Navajas de Bolsillo y EDC (Everyday Carry)',
      'Hachas, Machetes y Sierras Plegables de Campo',
      'Kits de Procesamiento de Carne',
      'Piedras, Afiladores y Kits de Mantenimiento',
    ],
  },
  {
    id: 'indumentaria',
    name: 'Indumentaria y Calzado Técnico',
    type: 'producto',
    subcategories: [
      'Ropa de Camuflaje (Chaquetas, Pantalones, Ponchos)',
      'Indumentaria de Alta Visibilidad (Blaze Orange)',
      'Ropa Térmica y Primera Piel (Control de olor)',
      'Calzado Técnico y Botas Impermeables',
      'Accesorios de Protección (Guantes térmicos, Polainas, Pasamontañas)',
    ],
  },
  {
    id: 'equipamiento',
    name: 'Equipamiento y Apostaderos',
    type: 'producto',
    subcategories: [
      'Apostaderos Portátiles y Carpas de Caza (Ground Blinds)',
      'Sillas de Árbol y Escaladoras (Treestands)',
      'Reclamos Sonoros (Silbatos manuales y electrónicos para aves, ciervos, etc.)',
      'Señuelos Visuales (Decoys)',
      'Atrayentes Olfativos y Neutralizadores de Olores',
      'Redes y Telas de Camuflaje',
    ],
  },
  {
    id: 'transporte',
    name: 'Transporte y Conservación',
    type: 'producto',
    subcategories: [
      'Mochilas Tácticas y de Carga Pesada (Meat haulers)',
      'Bolsas Transpirables para Carne (Game bags)',
      'Polipastos, Ganchos y Balanzas (Gambrels)',
      'Conservadoras Térmicas de Alto Rendimiento',
      'Envasadoras al Vacío y Embutidoras (Uso doméstico/campo)',
    ],
  },
  {
    id: 'supervivencia',
    name: 'Supervivencia, Orientación y Campamento',
    type: 'producto',
    subcategories: [
      'Sistemas GPS, Brújulas y Radios VHF',
      'Linternas (Frontales, Tácticas y luces UV/Rojas para rastreo de sangre)',
      'Kits de Primeros Auxilios (Trauma) y Supervivencia',
      'Iniciadores de Fuego y Purificadores de Agua portátiles',
      'Carpas Tácticas, Bivys y Bolsas de Dormir de Alta Montaña',
    ],
  },
  {
    id: 'perros',
    name: 'Perros de Caza y Adiestramiento',
    type: 'producto',
    subcategories: [
      'Collares GPS y Sistemas Beeper',
      'Collares y Sistemas de Adiestramiento a distancia',
      'Chalecos Protectores (Kevlar/Cordura anti-jabalí)',
      'Señuelos y Dummies de Cobro',
      'Silbatos, Correas y Cajas Transportadoras',
    ],
  },
  {
    id: 'aire_comprimido',
    name: 'Caza de Aire Comprimido y Deportiva',
    type: 'producto',
    subcategories: [
      'Rifles y Pistolas de Aire Comprimido (PCP, Resorte, Nitropistón)',
      'Balines y Munición de Aleación/Plomo',
      'Accesorios PCP (Infladores, Compresores, Válvulas)',
      'Miras Telescópicas para Aire Comprimido',
    ],
  },

  // --- CATEGORÍAS DE SERVICIOS ---
  {
    id: 'guias_cotos',
    name: 'Guías, Cotos y Expediciones',
    type: 'servicio',
    subcategories: [
      'Alquiler de Cotos y Estancias Privadas',
      'Guías y Outfitters Profesionales (Caza mayor y menor)',
      'Safaris Fotográficos y Expediciones de Avistamiento',
    ],
  },
  {
    id: 'formacion',
    name: 'Formación y Entrenamiento',
    type: 'servicio',
    subcategories: [
      'Cursos de Arquería y Tiro Deportivo',
      'Cursos de Supervivencia y Bushcraft',
      'Clínicas de Rastreo y Reconocimiento de Huellas',
      'Cursos de Adiestramiento Canino Especializado',
    ],
  },
  {
    id: 'servicios_especiales',
    name: 'Servicios Especializados',
    type: 'servicio',
    subcategories: [
      'Taxidermia y Curtido de Pieles',
      'Procesamiento de Carne (Frigoríficos y carnicerías especializadas)',
      'Mantenimiento, Set-up y Calibración de Arcos',
    ],
  },
];

export const PRODUCT_MAIN_CATEGORIES = CATEGORIES_DATA.filter(c => c.type === 'producto');
export const SERVICE_MAIN_CATEGORIES = CATEGORIES_DATA.filter(c => c.type === 'servicio');

export function getSubcategoriesForCategory(catName: string): string[] {
  const matched = CATEGORIES_DATA.find(c => c.name.toLowerCase() === catName.toLowerCase() || c.id === catName);
  return matched ? matched.subcategories : [];
}
