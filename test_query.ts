import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string);

async function run() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('interactions')
    .select('id, product_id, service_id, seller_id, reviews!inner(purchase_outcome)')
    .eq('status', 'published')
    .gte('created_at', oneWeekAgo.toISOString())
    .eq('reviews.purchase_outcome', 'concreto');

  console.log('Error:', error);
  console.log('Data count:', data?.length);
  if (data && data.length > 0) console.log('Sample:', data[0]);
}

run();
