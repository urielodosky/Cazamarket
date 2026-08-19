const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

supabase.from('services').select('*').limit(1).then(({data, error}) => {
  if (error) console.error(error);
  else console.log("KEYS:", Object.keys(data[0] || {}));
});
