-- Agrega las columnas 'providers' y 'distributors' a la tabla 'profiles'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS providers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS distributors JSONB DEFAULT '[]'::jsonb;
