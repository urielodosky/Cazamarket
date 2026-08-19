'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitBuyerReviewAction(
  interactionId: string, 
  outcome: string, 
  comment: string, 
  rating: number,
  productId: string | null
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Debes iniciar sesión para dejar una reseña.' };
  }

  // Obtener la interacción
  const { data: interaction, error: interactionError } = await supabase
    .from('interactions')
    .select('*')
    .eq('id', interactionId)
    .single();

  if (interactionError || !interaction) {
    return { success: false, error: 'Interacción no encontrada.' };
  }

  if (interaction.buyer_id !== user.id) {
    return { success: false, error: 'No tienes permiso para reseñar esta interacción.' };
  }

  // Validar Cooldown de 30 días para calificación del negocio
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

  // Buscar interacciones previas entre este comprador y este vendedor
  const { data: pastInteractions } = await supabase
    .from('interactions')
    .select('id')
    .eq('buyer_id', user.id)
    .eq('seller_id', interaction.seller_id);

  if (pastInteractions && pastInteractions.length > 0) {
    const interactionIds = pastInteractions.map(i => i.id);
    
    // Verificar si existe alguna reseña reciente de este comprador hacia este vendedor
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select('created_at')
      .in('interaction_id', interactionIds)
      .gte('created_at', thirtyDaysAgoIso)
      .limit(1);

    if (recentReviews && recentReviews.length > 0) {
      return { 
        success: false, 
        error: 'Debes esperar al menos 1 mes (30 días) desde tu última reseña para volver a calificar a este negocio.' 
      };
    }
  }

  const review_type = outcome === 'concreto' ? 'compra_concretada' : 'compra_no_concretada';

  // Insertar la reseña (quedará oculta `is_published: false` hasta que el vendedor deje la suya)
  const { error: insertError } = await supabase.from('reviews').insert({
    interaction_id: interactionId,
    seller_rating: rating,
    product_rating: productId ? rating : null,
    comment: comment || null,
    is_published: false,
    review_type: review_type
  });

  if (insertError) {
    console.error('Error insertando reseña:', insertError);
    return { success: false, error: 'Ocurrió un error al guardar tu reseña.' };
  }

  // Actualizar el estado de la interacción
  const { error: updateError } = await supabase
    .from('interactions')
    .update({ status: 'ready_to_review' })
    .eq('id', interactionId);

  if (updateError) {
    console.error('Error actualizando interacción:', updateError);
    return { success: false, error: 'Ocurrió un error al actualizar el estado de la compra.' };
  }

  revalidatePath('/resenas');
  return { success: true };
}

export async function submitSellerReviewAction(interactionId: string, rating: number, comment: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Debes iniciar sesión para dejar una reseña.' };
  }

  // Obtener la interacción
  const { data: interaction, error: interactionError } = await supabase
    .from('interactions')
    .select('*')
    .eq('id', interactionId)
    .single();

  if (interactionError || !interaction) {
    return { success: false, error: 'Interacción no encontrada.' };
  }

  if (interaction.seller_id !== user.id) {
    return { success: false, error: 'No tienes permiso para reseñar a este comprador.' };
  }

  // Actualizar la reseña del comprador con los datos del vendedor y publicarla
  const { error: updateReviewError } = await supabase
    .from('reviews')
    .update({
      buyer_rating: rating,
      seller_reply: comment || null,
      is_published: true
    })
    .eq('interaction_id', interactionId);

  if (updateReviewError) {
    console.error('Error actualizando reseña del vendedor:', updateReviewError);
    return { success: false, error: 'Ocurrió un error al enviar tu reseña.' };
  }

  // Publicar la interacción
  const { error: updateInteractionError } = await supabase
    .from('interactions')
    .update({ status: 'published' })
    .eq('id', interactionId);

  if (updateInteractionError) {
    console.error('Error publicando interacción:', updateInteractionError);
    return { success: false, error: 'Ocurrió un error al actualizar la compra.' };
  }

  revalidatePath('/resenas');
  return { success: true };
}
