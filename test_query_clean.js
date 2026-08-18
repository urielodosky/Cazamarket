require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://suuxvngyjsgelqgpqxhd.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('reviews')
  .select('id, product_rating, comment, created_at, interactions!inner(buyer_id)')
  .eq('product_id', 2)
  .eq('is_published', true)
  .not('product_rating', 'is', null)
  .order('created_at', { ascending: false })
  .then(res => console.log(res.error));
