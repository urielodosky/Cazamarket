-- ==========================================
-- SCRIPT DE SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- ==========================================
-- Instrucción: Ejecuta este script en el SQL Editor de tu panel de Supabase.
-- Este script activará RLS en todas las tablas clave y establecerá políticas 
-- estrictas para cerrar el acceso público no autorizado.

-- 1. Activación Global de RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- (Añade aquí otras tablas si existen, por ejemplo: products, services, favorites, cart)
-- ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 2. Cierre de Acceso Público Total (Deny-by-default)
-- Al activar RLS sin políticas, NADIE tiene acceso por defecto.
-- A continuación, se definen las excepciones estrictamente necesarias.

-- 3. Políticas para la tabla 'profiles'
-- Lectura: Solo usuarios autenticados pueden ver perfiles (o hacerlo público si tu app lo requiere para ver tiendas)
CREATE POLICY "Permitir lectura pública de perfiles"
ON public.profiles FOR SELECT
USING (true);

-- Inserción/Actualización: Un usuario solo puede modificar su PROPIO perfil
CREATE POLICY "Los usuarios pueden modificar su propio perfil"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Los usuarios pueden insertar su propio perfil"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Eliminación: Solo el mismo usuario puede borrar su perfil
CREATE POLICY "Los usuarios pueden eliminar su propio perfil"
ON public.profiles FOR DELETE
USING (auth.uid() = id);

-- 4. Seguridad de Almacenamiento (Supabase Storage)
-- Asegurar que los buckets de imágenes no permitan subidas anónimas
-- (Esto se maneja desde el panel de Storage > Policies en Supabase)
