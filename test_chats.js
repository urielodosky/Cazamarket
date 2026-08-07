async function fetchChats() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/chats?select=*,buyer:profiles!buyer_id(store_name,avatar_url,first_name,last_name),seller:profiles!seller_id(store_name,avatar_url,first_name,last_name)&order=updated_at.desc';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const res = await fetch(url, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
fetchChats();
