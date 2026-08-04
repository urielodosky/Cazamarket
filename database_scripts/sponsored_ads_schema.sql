-- ==============================================================================
-- CazaMarket - Sponsored Ads System (Block 1)
-- ==============================================================================

-- 1. Create the sponsored_ads table
CREATE TABLE IF NOT EXISTS public.sponsored_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL, -- Referencia al ID del negocio/tienda a promocionar
    plan_type TEXT NOT NULL CHECK (plan_type IN ('weekly', 'monthly')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE, -- Reserva temporal de 15 minutos para evitar Race Conditions
    
    -- Control de visualizaciones
    shown_this_week BOOLEAN NOT NULL DEFAULT false,
    total_shows INTEGER NOT NULL DEFAULT 0,
    
    -- Trazabilidad de Mercado Pago
    mp_preference_id TEXT,
    mp_payment_id TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Add RLS (Row Level Security) Policies
ALTER TABLE public.sponsored_ads ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propios anuncios
CREATE POLICY "Users can view their own sponsored ads"
    ON public.sponsored_ads
    FOR SELECT
    USING (auth.uid() = user_id);

-- El público general necesita poder leer los anuncios activos para renderizar el PromoSlider
CREATE POLICY "Anyone can view active sponsored ads"
    ON public.sponsored_ads
    FOR SELECT
    USING (status = 'active');

-- 3. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_sponsored_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sponsored_ads_modtime
    BEFORE UPDATE ON public.sponsored_ads
    FOR EACH ROW
    EXECUTE FUNCTION update_sponsored_ads_updated_at();

-- 4. Index for performance on the daily selection (Block 2 optimization)
CREATE INDEX IF NOT EXISTS idx_sponsored_ads_active 
    ON public.sponsored_ads (status, shown_this_week) 
    WHERE status = 'active';
