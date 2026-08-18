import { z } from 'zod';

// Expresión regular básica para bloquear scripts o etiquetas HTML
const sanitizeString = (val: string) => val.replace(/[<>]/g, '').trim();

export const registerSchema = z.object({
  email: z.string().email('Debe ser un email válido').trim().toLowerCase(),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña es demasiado larga'),
  username: z.string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(30, 'El nombre de usuario es demasiado largo')
    .transform(sanitizeString),
  person_type: z.enum(['fisica', 'juridica']).optional().default('fisica'),
  birth_date: z.string().optional().nullable(),
  cuit: z.string()
    .max(11, 'El CUIT no puede tener más de 11 caracteres')
    .optional()
    .nullable()
    .transform((val) => val ? sanitizeString(val) : null),
  phone: z.string()
    .max(20, 'El teléfono es demasiado largo')
    .optional()
    .nullable()
    .transform((val) => val ? sanitizeString(val) : null),
  contact_email: z.string()
    .email('El email de contacto no es válido')
    .optional()
    .nullable()
});

// También podemos tener un esquema general de login
export const loginSchema = z.object({
  email: z.string().email('Debe ser un email válido').trim().toLowerCase(),
  password: z.string().min(1, 'La contraseña es obligatoria')
});
