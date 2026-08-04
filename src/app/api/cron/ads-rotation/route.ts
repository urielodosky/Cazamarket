import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    // 1. Validar seguridad del CRON (Vercel Cron Secret)
    const authHeader = request.headers.get('authorization');
    if (
      process.env.CRON_SECRET && 
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date();

    // 2. Purgar reservas 'pending' expiradas (limpiar la basura)
    await supabase
      .from('sponsored_ads')
      .delete()
      .eq('status', 'pending')
      .lt('expires_at', now.toISOString());

    // 3. Procesar los anuncios de "Ayer" (quitarles is_today_ad y marcar shown_this_week)
    // Esto es seguro hacerlo en masa
    await supabase
      .from('sponsored_ads')
      .update({ 
        is_today_ad: false, 
        shown_this_week: true 
        // total_shows se incrementa en 1. Lamentablemente Supabase JS no tiene un operador de incremento simple sin RPC.
        // Lo haremos iterando sobre los afectados para ser precisos.
      })
      .eq('is_today_ad', true);

    // Para el incremento exacto, traemos los de ayer antes de actualizar, pero para simplificar, 
    // fetch de todos los activos es seguro (max 105).
    
    const { data: allActiveAds, error: fetchActiveError } = await supabase
      .from('sponsored_ads')
      .select('id, start_date, end_date, total_shows, is_today_ad, shown_this_week')
      .eq('status', 'active');

    if (fetchActiveError) throw fetchActiveError;

    const adsToUpdate = allActiveAds || [];
    
    // Batch updates for specific conditions
    for (const ad of adsToUpdate) {
      const adStart = new Date(ad.start_date);
      const adEnd = new Date(ad.end_date);
      let updates: any = {};
      let needsUpdate = false;

      // Increment total shows for yesterday's ads
      if (ad.is_today_ad) {
        updates.total_shows = ad.total_shows + 1;
        needsUpdate = true;
      }

      // Check Expiration
      if (now > adEnd) {
        updates.status = 'expired';
        updates.is_today_ad = false; // Just in case
        needsUpdate = true;
      } else {
        // Check Monthly Reset (every 7 days)
        const daysSinceStart = Math.floor((now.getTime() - adStart.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceStart > 0 && daysSinceStart % 7 === 0 && ad.shown_this_week) {
          updates.shown_this_week = false;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await supabase
          .from('sponsored_ads')
          .update(updates)
          .eq('id', ad.id);
      }
    }

    // 4. Seleccionar los 15 anuncios del día
    // Volvemos a consultar para asegurarnos de tener el estado limpio (sin expirados, con reset aplicados)
    const { data: eligibleAds } = await supabase
      .from('sponsored_ads')
      .select('id')
      .eq('status', 'active')
      .eq('shown_this_week', false)
      .eq('is_today_ad', false);

    if (eligibleAds && eligibleAds.length > 0) {
      // Shuffle array JS
      const shuffled = [...eligibleAds].sort(() => 0.5 - Math.random());
      const selectedAds = shuffled.slice(0, 15);
      
      const selectedIds = selectedAds.map(a => a.id);

      if (selectedIds.length > 0) {
        await supabase
          .from('sponsored_ads')
          .update({ is_today_ad: true })
          .in('id', selectedIds);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Ads rotated successfully' 
    });

  } catch (error: any) {
    console.error('Cron rotation error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
