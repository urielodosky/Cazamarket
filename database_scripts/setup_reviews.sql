-- 1. Tabla de Interacciones (Clics en "Contactar")
CREATE TABLE public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_time' CHECK (status IN ('pending_time', 'ready_to_review', 'reviewed', 'published', 'rejected_by_seller', 'archived'))
);

-- Habilitar RLS en interacciones
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Políticas para interacciones
-- Comprador puede ver sus interacciones
CREATE POLICY "Comprador puede ver sus interacciones" ON public.interactions FOR SELECT USING (auth.uid() = buyer_id);
-- Comprador puede crear interacciones
CREATE POLICY "Comprador puede crear interacciones" ON public.interactions FOR INSERT WITH CHECK (auth.uid() = buyer_id);
-- Comprador puede actualizar estado (ej. pasar a archived o reviewed)
CREATE POLICY "Comprador puede actualizar sus interacciones" ON public.interactions FOR UPDATE USING (auth.uid() = buyer_id);
-- Vendedor puede ver las interacciones donde él es el seller
CREATE POLICY "Vendedor puede ver sus interacciones" ON public.interactions FOR SELECT USING (auth.uid() = seller_id);
-- Vendedor puede actualizar estado (ej. aceptar o rechazar)
CREATE POLICY "Vendedor puede validar sus interacciones" ON public.interactions FOR UPDATE USING (auth.uid() = seller_id);


-- 2. Tabla de Reseñas (Reviews)
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
    review_type TEXT NOT NULL CHECK (review_type IN ('compra_concretada', 'compra_no_concretada')),
    product_rating INT CHECK (product_rating >= 1 AND product_rating <= 5),
    service_rating INT CHECK (service_rating >= 1 AND service_rating <= 5),
    seller_rating INT NOT NULL CHECK (seller_rating >= 1 AND seller_rating <= 5),
    comment TEXT,
    non_completion_reason TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en reseñas
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Políticas para reseñas
-- Todos pueden ver reseñas publicadas
CREATE POLICY "Todos pueden ver reseñas publicadas" ON public.reviews FOR SELECT USING (is_published = true);

-- Comprador puede ver sus propias reseñas siempre (incluso si no están publicadas)
CREATE POLICY "Comprador puede ver sus propias reseñas" ON public.reviews FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.interactions
        WHERE interactions.id = reviews.interaction_id AND interactions.buyer_id = auth.uid()
    )
);

-- Comprador puede insertar reseñas
CREATE POLICY "Comprador puede crear reseñas" ON public.reviews FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.interactions
        WHERE interactions.id = interaction_id AND interactions.buyer_id = auth.uid()
    )
);

-- Vendedor puede modificar is_published (cuando acepta la interacción mediante Trigger o App Logic)
CREATE POLICY "Vendedor puede validar reseñas" ON public.reviews FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.interactions
        WHERE interactions.id = reviews.interaction_id AND interactions.seller_id = auth.uid()
    )
);

-- OJO: La magia de la Validación Ciega radica en la UI del Dashboard del vendedor. 
-- Por seguridad a nivel BD, el vendedor NO debería poder hacer SELECT de la reseña si no está publicada.
CREATE POLICY "Vendedor NO puede leer reseñas antes de validar" ON public.reviews FOR SELECT USING (
    is_published = true
);
-- Nota: La política "Todos pueden ver..." ya permite leer si is_published = true. 
-- El vendedor no necesita una política especial de lectura si no queremos que lo lea antes.
