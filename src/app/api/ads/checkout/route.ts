import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { planType, storeId } = body; // 'weekly' or 'monthly'

    if (!planType || !storeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Capacity check: absolute max 105 active ads
    const { count, error: countError } = await supabase
      .from('sponsored_ads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (countError) throw countError;

    if (count !== null && count >= 105) {
      return NextResponse.json(
        { error: 'Cupos agotados para esta semana' },
        { status: 400 }
      );
    }

    // In a real scenario, we would call the Mercado Pago API here to create a preference
    // using process.env.MERCADOPAGO_ACCESS_TOKEN
    
    // For now, we mock the creation of the Mercado Pago preference
    const mockPreferenceId = 'mp_pref_' + Math.random().toString(36).substring(7);
    const mockInitPoint = `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=${mockPreferenceId}`;

    // Record the pending transaction in our database
    const startDate = new Date();
    const endDate = new Date();
    if (planType === 'monthly') {
      endDate.setDate(endDate.getDate() + 28); // 4 weeks
    } else {
      endDate.setDate(endDate.getDate() + 7); // 1 week
    }

    const { data: ad, error: insertError } = await supabase
      .from('sponsored_ads')
      .insert({
        user_id: user.id,
        store_id: storeId,
        plan_type: planType,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'pending_payment', // Will be activated via webhook
        mp_preference_id: mockPreferenceId
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ 
      preferenceId: mockPreferenceId,
      init_point: mockInitPoint,
      adId: ad.id
    });

  } catch (error: any) {
    console.error('Ads Checkout Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
