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

async function fixForeignKeys() {
  const sql = `
    ALTER TABLE public.interactions
      DROP CONSTRAINT IF EXISTS interactions_buyer_id_fkey,
      DROP CONSTRAINT IF EXISTS interactions_seller_id_fkey;
      
    ALTER TABLE public.interactions
      ADD CONSTRAINT interactions_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
      ADD CONSTRAINT interactions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  `;
  const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.error('RPC failed:', error);
    // If RPC exec_sql doesn't exist, we'll need to create a migration script or run it through the dashboard.
    // Wait, let's see if there is another way.
  } else {
    console.log('Fixed FKs successfully.');
  }
}

fixForeignKeys();
