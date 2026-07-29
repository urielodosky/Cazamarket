-- Eliminar la columna phone_verified de la tabla profiles si ya no la usamos
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone_verified;
