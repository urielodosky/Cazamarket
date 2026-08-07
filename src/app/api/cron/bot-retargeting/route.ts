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

    // 1. Fetch all active bot settings
    const { data: settings, error: settingsError } = await supabase
      .from('bot_settings')
      .select('*')
      .eq('is_active', true);

    if (settingsError || !settings) {
      throw new Error(settingsError?.message || 'Error fetching settings');
    }

    let retargetingCount = 0;
    let reactivationCount = 0;

    // 2. Iterate through settings and process Reactivation and Retargeting
    for (const setting of settings) {
      // --- SILENT REACTIVATION ---
      if (setting.bot_reactivation_hours) {
        const reactThreshold = new Date();
        reactThreshold.setHours(reactThreshold.getHours() - setting.bot_reactivation_hours);

        let reactQuery = supabase
          .from('chats')
          .select('id, updated_at')
          .eq('seller_id', setting.seller_id)
          .eq('bot_status', 'paused')
          .lt('updated_at', reactThreshold.toISOString());

        if (setting.product_id) reactQuery = reactQuery.eq('product_id', setting.product_id);
        else reactQuery = reactQuery.is('product_id', null);

        const { data: chatsToReactivate } = await reactQuery;

        if (chatsToReactivate && chatsToReactivate.length > 0) {
          for (const chat of chatsToReactivate) {
            await supabase.from('chats').update({
              bot_status: 'active',
              bot_cooldown_until: null,
              bot_waiting_for_user: false,
              bot_fired_once: false // Reset fire once so it can trigger from scratch
            }).eq('id', chat.id);
            reactivationCount++;
          }
        }
      }

      // --- RETARGETING ---
      if (setting.retargeting_days && setting.retargeting_message) {
        const hours = setting.retargeting_days; 
        const thresholdDate = new Date();
        thresholdDate.setHours(thresholdDate.getHours() - hours);

        let chatQuery = supabase
          .from('chats')
          .select('id, updated_at, seller_id')
          .eq('seller_id', setting.seller_id)
          .lt('updated_at', thresholdDate.toISOString());

        if (setting.product_id) chatQuery = chatQuery.eq('product_id', setting.product_id);
        else chatQuery = chatQuery.is('product_id', null);

        const { data: inactiveChats } = await chatQuery;
        
        if (inactiveChats) {
          for (const chat of inactiveChats) {
            // Check if seller had the last word
            const { data: lastMessage } = await supabase
              .from('messages')
              .select('sender_id')
              .eq('chat_id', chat.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (lastMessage && lastMessage.sender_id === chat.seller_id) {
              continue; // Seller already spoke last
            }

            // Insert retargeting message
            await supabase.from('messages').insert({
              chat_id: chat.id,
              sender_id: setting.seller_id,
              content: setting.retargeting_message,
              attachment_url: null,
              attachment_type: null
            });

            // Update chat to trigger updated_at and reset bot status
            await supabase.from('chats').update({
              bot_status: 'active',
              bot_cooldown_until: null,
              bot_waiting_for_user: false,
              bot_fired_once: false,
              updated_at: new Date().toISOString()
            }).eq('id', chat.id);

            retargetingCount++;
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cron completed. Reactivations: ${reactivationCount}, Retargeting messages sent: ${retargetingCount}` 
    });

  } catch (error: any) {
    console.error('CRON ERROR:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
