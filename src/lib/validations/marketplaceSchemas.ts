import { z } from 'zod';

const sanitizeString = (val: string) => val.replace(/[<>]/g, '').trim();

// 1. Esquema para la actualización de Perfil / Tienda
export const profileUpdateSchema = z.object({
  full_name: z.string()
    .max(100, 'El nombre es demasiado largo')
    .optional()
    .transform(val => val ? sanitizeString(val) : undefined),
  phone: z.string()
    .max(20, 'El teléfono es demasiado largo')
    .optional()
    .transform(val => val ? sanitizeString(val) : undefined),
  avatar_url: z.string()
    .url('La URL del avatar no es válida')
    .optional()
    .nullable(),
  store_name: z.string()
    .max(100, 'El nombre de la tienda es demasiado largo')
    .optional()
    .transform(val => val ? sanitizeString(val) : undefined),
  store_description: z.string()
    .max(1000, 'La descripción es demasiado larga')
    .optional()
    .transform(val => val ? sanitizeString(val) : undefined),
});

// 2. Esquema estricto para Productos
export const productSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(150, 'El nombre es demasiado largo')
    .transform(sanitizeString),
  description: z.string()
    .max(5000, 'La descripción es demasiado larga')
    .optional()
    .nullable()
    .transform(val => val ? sanitizeString(val) : null),
  price: z.number()
    .min(0, 'El precio no puede ser negativo')
    .max(99999999, 'El precio no puede exceder las 8 cifras'),
  currency: z.enum(['ARS', 'USD', 'USDT']),
  category: z.string().transform(sanitizeString),
  subcategory: z.string().optional().nullable().transform(val => val ? sanitizeString(val) : null),
  condition: z.enum(['nuevo', 'usado']),
  image_urls: z.array(z.string().url('URL de imagen inválida')).max(10, 'Máximo 10 imágenes'),
  video_url: z.string().url('URL de video inválida').optional().nullable(),
  stock_mode: z.enum(['ilimitado', 'definido']).optional().default('ilimitado'),
  stock: z.number().int().min(0, 'El stock no puede ser negativo').optional().nullable(),
  shipping_mode: z.enum(['acordar', 'gratis', 'costo_extra']).optional().default('acordar'),
  shipping_cost: z.string().optional().nullable().transform(val => val ? sanitizeString(val) : null),
  pickup_available: z.enum(['si', 'no']).optional().default('no'),
  pickup_branches: z.array(z.string()).optional().nullable(),
  has_discount: z.boolean().optional().default(false),
  discount_name: z.string().max(50).optional().nullable().transform(val => val ? sanitizeString(val) : null),
  discount_type: z.enum(['porcentaje', 'monto', '2x1']).optional().nullable(),
  discount_value: z.string().max(20).optional().nullable().transform(val => val ? sanitizeString(val) : null),
  features: z.any().optional(), // Puede ser validado más estrictamente dependiendo de su estructura
});

// 3. Esquema estricto para Servicios
export const serviceSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(150, 'El nombre es demasiado largo')
    .transform(sanitizeString),
  description: z.string()
    .max(5000, 'La descripción es demasiado larga')
    .optional()
    .nullable()
    .transform(val => val ? sanitizeString(val) : null),
  price: z.number()
    .min(0, 'El precio no puede ser negativo')
    .max(99999999, 'El precio no puede exceder las 8 cifras'),
  currency: z.enum(['ARS', 'USD', 'USDT']),
  category: z.string().transform(sanitizeString),
  subcategory: z.string().optional().nullable().transform(val => val ? sanitizeString(val) : null),
  location: z.string().max(200).optional().nullable().transform(val => val ? sanitizeString(val) : null),
  image_urls: z.array(z.string().url('URL de imagen inválida')).max(10, 'Máximo 10 imágenes'),
  video_url: z.string().url('URL de video inválida').optional().nullable(),
  has_discount: z.boolean().optional().default(false),
  discount_name: z.string().max(50).optional().nullable().transform(val => val ? sanitizeString(val) : null),
  discount_type: z.enum(['porcentaje', 'monto', '2x1']).optional().nullable(),
  discount_value: z.string().max(20).optional().nullable().transform(val => val ? sanitizeString(val) : null),
});
