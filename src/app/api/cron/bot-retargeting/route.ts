import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client for the cron job (bypasses RLS)
// Note: In production you'd use service_role key to bypass RLS in the background.
// We assume NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  // Security check: Only allow requests with a valid authorization header (e.g. Vercel Cron Secret)
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    console.log('Running Bot Retargeting Cron Job...');

    // 1. Fetch all bot settings that have retargeting enabled
    const { data: settings, error: settingsError } = await supabase
      .from('bot_settings')
      .select('*')
      .not('retargeting_days', 'is', null)
      .not('retargeting_message', 'is', null)
      .eq('is_active', true);

    if (settingsError || !settings) {
      throw new Error(settingsError?.message || 'Error fetching settings');
    }

    let processedCount = 0;

    // 2. Iterate through settings and check their corresponding chats
    for (const setting of settings) {
      const hours = setting.retargeting_days; // DB column is named days but we treat it as hours now
      if (!hours) continue;

      // Calculate the threshold date
      const thresholdDate = new Date();
      thresholdDate.setHours(thresholdDate.getHours() - hours);

      // Fetch chats for this seller (and specific product if applicable)
      // that haven't been updated since the threshold date.
      let chatQuery = supabase
        .from('chats')
        .select('id, updated_at, seller_id')
        .eq('seller_id', setting.seller_id)
        .lt('updated_at', thresholdDate.toISOString());

      if (setting.product_id) {
        chatQuery = chatQuery.eq('product_id', setting.product_id);
      } else {
        chatQuery = chatQuery.is('product_id', null);
      }

      const { data: inactiveChats, error: chatsError } = await chatQuery;
      
      if (chatsError || !inactiveChats) {
        console.error(`Error fetching chats for setting ${setting.id}:`, chatsError);
        continue;
      }

      for (const chat of inactiveChats) {
        // Double check who sent the last message to avoid spamming
        // If the last message was already sent by the seller (e.g. previous retargeting), skip.
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('sender_id')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (lastMessage && lastMessage.sender_id === chat.seller_id) {
          // Seller already had the last word, don't spam
          continue;
        }

        // Insert retargeting message
        await supabase.from('messages').insert({
          chat_id: chat.id,
          sender_id: setting.seller_id,
          content: setting.retargeting_message,
          attachment_url: null,
          attachment_type: null
        });

        // Reset Bot Status for this chat (so it can listen to rules again)
        await supabase.from('chats').update({
          bot_status: 'active',
          bot_cooldown_until: null,
          bot_waiting_for_user: false,
          bot_fired_once: false, // Reset fire once so it can trigger again
          updated_at: new Date().toISOString()
        }).eq('id', chat.id);

        processedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Retargeting cron completed. Messages sent: ${processedCount}` 
    });

  } catch (error: any) {
    console.error('CRON ERROR:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
