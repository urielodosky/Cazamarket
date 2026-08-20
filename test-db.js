const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://suuxvngyjsgelqgpqxhd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1dXh2bmd5anNnZWxxZ3BxeGhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzEyODUyNiwiZXhwIjoyMDk4NzA0NTI2fQ.SVfu9UiyXEWYUos9-zEyc-vWVowOYzuzzb-n-Ae1Lg0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('products').select('*').limit(5);
  console.log(JSON.stringify(data, null, 2));
}

test();
