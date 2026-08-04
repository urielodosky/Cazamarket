import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch the exactly 15 ads selected for today by the Cron job
    const { data: ads, error } = await supabase
      .from('sponsored_ads')
      .select('*')
      .eq('is_today_ad', true)
      .eq('status', 'active'); // Ensure they haven't expired intraday

    if (error) throw error;

    return NextResponse.json({ ads: ads || [] });

  } catch (error: any) {
    console.error('Fetch current ads error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current ads' },
      { status: 500 }
    );
  }
}
