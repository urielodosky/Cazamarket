import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2].trim();
  }
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testQuery() {
  const { data, error } = await supabaseAdmin
    .from('sponsored_ads')
    .select('*, profiles(store_name, full_name, contact_email)')
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString())
    .order('end_date', { ascending: true });

  if (error) {
    console.error('SUPABASE ERROR:', error.message);
  } else {
    console.log('Success! Data count:', data?.length);
  }
}

testQuery();
