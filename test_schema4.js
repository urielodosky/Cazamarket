const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim();
});
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);
supabase.from('products').select('*').limit(1).then(res => {
  if (res.data && res.data.length > 0) {
    const row = res.data[0];
    for (const key in row) {
      console.log(key + ': ' + typeof row[key]);
    }
  } else {
    console.log(res);
  }
});
