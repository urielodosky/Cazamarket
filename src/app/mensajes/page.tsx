'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import VirtualAdvisorModal from '@/components/chat/VirtualAdvisorModal';
import { useThemeColors } from '@/hooks/useThemeColors';
import { createClient } from '@/lib/supabase/client';
import './mensajes.css';

export default function MensajesPage() {
  const themeColors = useThemeColors();
  const { isVendorModeActive, supabaseUser } = useAuth();
  const { hasFeature } = usePlan();
  const supabase = createClient();
  
  const canUseBot = hasFeature('botAsesor');
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'negocios' | 'clientes'>('negocios');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  
  const [chats, setChats] = useState<any[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [openMessageMenu, setOpenMessageMenu] = useState<string | null>(null);
  const [openChatMenu, setOpenChatMenu] = useState<string | null>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClick = () => {
      setOpenMessageMenu(null);
      setOpenChatMenu(null);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Fetch chats on mount
  useEffect(() => {
    if (!supabaseUser) return;

    const fetchChats = async () => {
      setIsLoadingChats(true);
      // In a real app we'd join with profiles to get names and avatars.
      // We will do a basic fetch for now.
      const { data, error } = await supabase
        .from('chats')
        .select('*, buyer:profiles!buyer_id(store_name, avatar_url, first_name, last_name), seller:profiles!seller_id(store_name, avatar_url, first_name, last_name)')
        .or(`buyer_id.eq.${supabaseUser.id},seller_id.eq.${supabaseUser.id}`)
        .order('updated_at', { ascending: false });

      if (data) {
        // Filter out duplicate test chats (keep only the newest)
        let foundTestChat = false;
        const filteredData = data.filter(c => {
           if (c.buyer_id === supabaseUser.id && c.seller_id === supabaseUser.id) {
             if (foundTestChat) return false;
             foundTestChat = true;
             return true;
           }
           return true;
        });

        // Map data to UI expected format
        const mappedChats = filteredData.map(c => {
          const isTestChat = c.buyer_id === supabaseUser.id && c.seller_id === supabaseUser.id;
          const isBuyer = c.buyer_id === supabaseUser.id;
          const otherParty = isTestChat ? c.seller : (isBuyer ? c.seller : c.buyer);
          const type = isTestChat ? 'negocios' : (isBuyer ? 'negocios' : 'clientes'); 
          
          let name = 'Usuario';
          if (isTestChat) {
            name = 'Tú (Prueba del Bot General)';
          } else if (otherParty) {
            name = otherParty.store_name || `${otherParty.first_name || ''} ${otherParty.last_name || ''}`.trim() || 'Usuario';
          }

          const isPinned = isBuyer ? c.pinned_by_buyer : c.pinned_by_seller;

          return {
            id: c.id,
            type: type,
            name: name,
            avatar: otherParty?.avatar_url || 'https://ui-avatars.com/api/?name=User',
            online: false,
            time: new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            lastMessage: 'Abrir chat para ver mensajes',
            unread: 0,
            dbChat: c,
            isPinned: isPinned
          };
        });

        // Sort mappedChats: pinned first, then by updated_at descending
        mappedChats.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.dbChat?.updated_at || 0).getTime() - new Date(a.dbChat?.updated_at || 0).getTime();
        });

        // Inject a virtual test chat if it doesn't exist and user can use bot
        const hasTestChat = filteredData.some(c => c.buyer_id === supabaseUser.id && c.seller_id === supabaseUser.id);
        if (!hasTestChat && canUseBot) {
          mappedChats.unshift({
            id: 'bot-test-chat',
            type: 'negocios',
            name: 'Tú (Prueba del Bot General)',
            avatar: 'https://ui-avatars.com/api/?name=Prueba&background=ff7300&color=fff',
            online: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            lastMessage: 'Envía un mensaje para probar tu bot general',
            unread: 0,
            dbChat: null,
            isPinned: false
          });
        }

        setChats(mappedChats);
      }
      setIsLoadingChats(false);
    };

    fetchChats();
  }, [supabaseUser, supabase]);

  const currentChats = chats.filter(c => c.type === activeTab);
  const activeChat = chats.find(c => c.id === activeChatId);

  // Auto-select first chat
  useEffect(() => {
    if (currentChats.length > 0) {
      if (typeof window !== 'undefined' && window.innerWidth > 768) {
        // Only auto-select if we don't have an active chat in the current tab
        if (!activeChatId || !currentChats.some(c => c.id === activeChatId)) {
          setActiveChatId(currentChats[0].id);
        }
      } else {
        if (!activeChatId || !currentChats.some(c => c.id === activeChatId)) {
          setActiveChatId(null);
        }
      }
    } else {
      setActiveChatId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, chats.length]);

  // Fetch messages and subscribe to Realtime
  useEffect(() => {
    if (!activeChatId || !supabaseUser) return;
    
    setMessages([]); // Clear messages while fetching

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', activeChatId)
        .order('created_at', { ascending: true });
      
      if (data) {
        let unreadIds: string[] = [];
        
        // Filter out messages deleted for me
        const currentDbChat = chats.find(c => c.id === activeChatId)?.dbChat;
        const isBuyer = currentDbChat?.buyer_id === supabaseUser.id;

        const messagesData = data.filter((m: any) => {
          if (currentDbChat) {
            if (isBuyer && m.deleted_by_buyer) return false;
            if (!isBuyer && m.deleted_by_seller) return false;
          }
          return true;
        }).map(m => {
          if (m.sender_id !== supabaseUser.id && m.status !== 'read') {
             unreadIds.push(m.id);
             return { ...m, status: 'read' };
          }
          return m;
        });
        
        setMessages(messagesData);

        if (unreadIds.length > 0) {
           supabase.from('messages').update({ status: 'read' }).in('id', unreadIds).then();
        }
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase.channel(`chat_${activeChatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `chat_id=eq.${activeChatId}`
      }, (payload) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          const msg = { ...payload.new };
          if (msg.sender_id !== supabaseUser.id && msg.status !== 'read') {
             supabase.from('messages').update({ status: 'read' }).eq('id', msg.id).then();
             msg.status = 'read';
          }
          return [...prev, msg];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${activeChatId}`
      }, (payload) => {
         setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChatId, supabaseUser, supabase]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string | null = null, optionContext?: any, attachmentUrl?: string, attachmentType?: string) => {
    if (!activeChatId || !supabaseUser) return;
    if (!text?.trim() && !attachmentUrl) return;

    const userText = text?.trim() || '';

    // Optimistic UI for text
    if (userText && !attachmentUrl) {
      setMessageInput('');
    }

    try {
      let targetChatId = activeChatId;
      let targetDbChat = activeChat?.dbChat;

      // Handle the virtual test chat
      if (activeChatId === 'bot-test-chat') {
        const { data: existingChat } = await supabase.from('chats')
          .select('*')
          .eq('buyer_id', supabaseUser.id)
          .eq('seller_id', supabaseUser.id)
          .is('product_id', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        let newChat = existingChat;
        if (!newChat) {
          const { data: createdChat, error: createError } = await supabase.from('chats').insert({
            buyer_id: supabaseUser.id,
            seller_id: supabaseUser.id,
            product_id: null
          }).select().single();
          if (createError) {
            console.error('Error creating test chat', createError);
            return;
          }
          newChat = createdChat;
        }
        
        if (newChat) {
          targetChatId = newChat.id;
          targetDbChat = newChat;
          
          // Add the real chat to the state and remove the dummy one
          setChats(prev => {
            if (prev.some(c => c.id === newChat.id)) return prev; // Already exists
            const newMapped = {
              id: newChat.id,
              type: 'negocios',
              name: 'Tú (Prueba del Bot General)',
              avatar: 'https://ui-avatars.com/api/?name=Prueba&background=ff7300&color=fff',
              online: true,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              lastMessage: userText || 'Archivo enviado',
              unread: 0,
              dbChat: newChat,
              isPinned: false
            };
            return [newMapped, ...prev.filter(c => c.id !== 'bot-test-chat')];
          });
          
          setActiveChatId(newChat.id); // switch the active chat silently
        }
      }

      const { data: insertedMsg } = await supabase.from('messages').insert({
        chat_id: targetChatId,
        sender_id: supabaseUser.id,
        content: userText || null,
        attachment_url: attachmentUrl || null,
        attachment_type: attachmentType || null
      }).select().single();

      // Optimistically append the message so it shows up instantly
      if (insertedMsg) {
        setMessages(prev => {
           if (prev.some(m => m.id === insertedMsg.id)) return prev;
           return [...prev, insertedMsg];
        });
      }

      // Update chat updated_at and pause bot if seller is intervening (unless it's a test chat where they act as buyer)
      const updatePayload: any = { updated_at: new Date().toISOString() };
      if (activeChat?.type === 'clientes' && activeChatId !== 'bot-test-chat') {
        updatePayload.bot_status = 'paused';
      }
      
      await supabase.from('chats').update(updatePayload).eq('id', targetChatId);
      
      // Virtual Advisor Logic (Client side for now, only if I am a buyer talking to a seller)
      if (activeChat?.type === 'negocios' && userText && !attachmentUrl) {
        triggerVirtualAdvisor(userText, optionContext, targetDbChat);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId || !supabaseUser) return;

    setIsUploading(true);

    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${activeChatId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // Determine type based on MIME
      let type = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      // Upload to Storage
      const { data, error } = await supabase.storage
        .from('chat_attachments')
        .upload(fileName, file, { upsert: false });

      if (error) {
        alert('Error al subir el archivo: ' + error.message);
        setIsUploading(false);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from('chat_attachments').getPublicUrl(fileName);

      // Send message with attachment
      await handleSendMessage(null, null, publicUrl, type);

    } catch (err) {
      console.error(err);
      alert('Hubo un error inesperado al subir el archivo.');
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deleteMessage = async (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_deleted: true } : m));
    await supabase.from('messages').update({ is_deleted: true }).eq('id', msgId);
  };

  const hardDeleteMessage = async (msgId: string) => {
    if (!activeChat?.dbChat || !supabaseUser) return;
    const isBuyer = activeChat.dbChat.buyer_id === supabaseUser.id;
    const updateField = isBuyer ? 'deleted_by_buyer' : 'deleted_by_seller';
    
    setMessages(prev => prev.filter(m => m.id !== msgId));
    await supabase.from('messages').update({ [updateField]: true }).eq('id', msgId);
  };

  const togglePinMessage = async (msg: any) => {
    const newStatus = !msg.is_pinned;
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_pinned: newStatus } : m));
    await supabase.from('messages').update({ is_pinned: newStatus }).eq('id', msg.id);
  };

  const togglePinChat = async (chat: any) => {
    if (!chat.dbChat || !supabaseUser) return;
    const isBuyer = chat.dbChat.buyer_id === supabaseUser.id;
    const updateField = isBuyer ? 'pinned_by_buyer' : 'pinned_by_seller';
    const newStatus = !chat.isPinned;
    
    setChats(prev => {
      const updated = prev.map(c => c.id === chat.id ? { ...c, isPinned: newStatus } : c);
      updated.sort((a, b) => {
        if (a.id === 'bot-test-chat') return -1;
        if (b.id === 'bot-test-chat') return 1;
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.dbChat?.updated_at || 0).getTime() - new Date(a.dbChat?.updated_at || 0).getTime();
      });
      return updated;
    });

    await supabase.from('chats').update({ [updateField]: newStatus }).eq('id', chat.id);
  };

  const deleteChat = async (chatId: string) => {
    const confirm = window.confirm('¿Seguro que deseas eliminar este chat de forma permanente?');
    if (!confirm) return;
    
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChatId === chatId) setActiveChatId(null);
    
    await supabase.from('messages').delete().eq('chat_id', chatId);
    await supabase.from('chats').delete().eq('id', chatId);
  };

  // --- VIRTUAL ADVISOR LOGIC ---
  const triggerVirtualAdvisor = async (userText: string, optionContext?: any, explicitDbChat?: any) => {
    const dbChatToUse = explicitDbChat || activeChat?.dbChat;
    if (!dbChatToUse || !dbChatToUse.seller_id) return;
    const sellerId = dbChatToUse.seller_id;
    const productId = dbChatToUse.product_id;
    const chatId = dbChatToUse.id;

    try {
      // 1. Fetch Bot Settings (Only needed to check if bot is globally disabled, but we should probably check seller general settings)
      const { data: settingsData } = await supabase.from('bot_settings').select('is_active').eq('seller_id', sellerId).is('product_id', null).single();
      const isActive = settingsData ? settingsData.is_active : true;

      if (!isActive) return;

      // 2. Fetch Rules: Specific Priority -> Fallback General
      let rules: any[] = [];
      
      if (productId) {
        // Try to fetch specific bot rules first
        const { data: specificRules } = await supabase.from('bot_rules').select('*').eq('seller_id', sellerId).eq('product_id', productId);
        if (specificRules && specificRules.length > 0) {
          rules = specificRules;
        } else {
          // Fallback to general bot if no specific rules exist
          const { data: generalRules } = await supabase.from('bot_rules').select('*').eq('seller_id', sellerId).is('product_id', null);
          rules = generalRules || [];
        }
      } else {
        // No product ID in chat, just fetch general bot
        const { data: generalRules } = await supabase.from('bot_rules').select('*').eq('seller_id', sellerId).is('product_id', null);
        rules = generalRules || [];
      }

      if (rules.length === 0) return;

      const normalizeText = (t: string) => t ? t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
      const normalizedUserText = normalizeText(userText);
      
      // Check Cooldown and Fire Once
      const { data: currentChat } = await supabase.from('chats').select('*').eq('id', chatId).single();
      if (!currentChat) return;

      let matchedRule = rules.find((r: any) => r.condition_type === 'exact' && normalizeText(r.condition_value) === normalizedUserText);
      if (!matchedRule) matchedRule = rules.find((r: any) => r.condition_type === 'keyword' && normalizedUserText.includes(normalizeText(r.condition_value)));
      if (!matchedRule) {
        // Evaluate Always rule only if not in cooldown and not fired once already if fire_once is true
        const alwaysRules = rules.filter((r: any) => r.condition_type === 'always');
        for (const r of alwaysRules) {
          if (r.fire_once && currentChat.bot_fired_once) continue;
          if (r.cooldown_hours && currentChat.bot_cooldown_until && new Date(currentChat.bot_cooldown_until) > new Date()) continue;
          matchedRule = r;
          break;
        }
      }

      if (matchedRule) {
        setTimeout(async () => {
          // Check if Reactivation message should be used
          let responseText = matchedRule.response_text;
          if (matchedRule.condition_type === 'always' && currentChat.bot_fired_once && matchedRule.reactivation_text) {
             responseText = matchedRule.reactivation_text;
          }

          // Insert bot response
          await supabase.from('messages').insert({
            chat_id: chatId,
            sender_id: sellerId,
            content: responseText,
            attachment_url: matchedRule.attachment_url || null,
            attachment_type: matchedRule.attachment_type || null
          });

          // Update chat tracking
          const isFlowEnd = !matchedRule.options || matchedRule.options.length === 0;
          let updateData: any = { 
            bot_status: isFlowEnd ? 'active' : 'waiting_user_response',
            bot_last_message_at: new Date().toISOString()
          };

          if (matchedRule.condition_type === 'always') {
            updateData.bot_fired_once = true;
            if (isFlowEnd && matchedRule.cooldown_hours) {
              const cooldownDate = new Date();
              cooldownDate.setHours(cooldownDate.getHours() + matchedRule.cooldown_hours);
              updateData.bot_cooldown_until = cooldownDate.toISOString();
              updateData.bot_status = 'cooldown';
            }
          }

          await supabase.from('chats').update(updateData).eq('id', chatId);
        }, 1000);
      }
    } catch(e) {}
  };

  return (
    <div className="layout-container mensajes-page-wrapper">
      
      <div className="glass-panel messages-container" style={{ display: 'flex', height: '75vh', minHeight: '600px', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        
        {/* --- LEFT AREA (CHAT LIST) --- */}
        <div className={`messages-sidebar ${activeChatId ? 'hidden-on-mobile' : ''}`} style={{ width: '320px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', background: themeColors.bgSubtle2 }}>  
          {/* Header & Tabs */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--color-text-main)' }}>Mensajes</h2>
              {canUseBot && (
                <button 
                  onClick={() => setIsAdvisorModalOpen(true)}
                  className="btn-glow"
                  style={{
                    background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '8px 12px', 
                    borderRadius: 'var(--radius-full)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" style={{ flexShrink: 0 }}>
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4" />
                    <line x1="8" y1="16" x2="8" y2="16" />
                    <line x1="16" y1="16" x2="16" y2="16" />
                  </svg>
                  Bot Asesor
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', background: themeColors.bgSubtle3, borderRadius: 'var(--radius-full)', padding: '6px', gap: '4px' }}>
              <button 
                onClick={() => setActiveTab('negocios')}
                style={{ flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                  background: activeTab === 'negocios' ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === 'negocios' ? '#fff' : 'var(--color-text-muted)'
                }}
              >Con Negocios</button>
              
              {isVendorModeActive && (
                <button 
                  onClick={() => setActiveTab('clientes')}
                  style={{ flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                    background: activeTab === 'clientes' ? 'var(--color-primary)' : 'transparent',
                    color: activeTab === 'clientes' ? '#fff' : 'var(--color-text-muted)'
                  }}
                >Con Clientes</button>
              )}
            </div>
          </div>

          {/* Chat List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {isLoadingChats ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite ease-in-out' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ width: '60%', height: '14px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', marginBottom: '8px' }} />
                      <div style={{ width: '40%', height: '10px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : currentChats.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                No tienes mensajes en esta sección.
              </div>
            ) : currentChats.map(chat => (
                <div 
                  key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', cursor: 'pointer', 
                  borderRadius: 'var(--radius-lg)', marginBottom: '8px',
                  background: activeChatId === chat.id ? 'linear-gradient(90deg, rgba(255,115,0,0.15), transparent)' : 'transparent',
                  border: '1px solid', borderColor: activeChatId === chat.id ? 'rgba(255,115,0,0.3)' : 'transparent'
                }}
              >
                <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
                  <img src={chat.avatar} alt={chat.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.name}</h4>
                    <div style={{ position: 'relative' }}>
                      <button onClick={(e) => { e.stopPropagation(); setOpenChatMenu(openChatMenu === chat.id ? null : chat.id); }} style={{ background: 'transparent', border: 'none', color: chat.isPinned ? 'var(--color-primary)' : 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                      </button>
                      {openChatMenu === chat.id && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--color-bg, #1a1a1a)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '4px', zIndex: 50, minWidth: '120px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                          <button onClick={(e) => { e.stopPropagation(); togglePinChat(chat); setOpenChatMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '8px 12px', color: 'var(--color-text-main)', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={chat.isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
                            {chat.isPinned ? "Desfijar" : "Fijar chat"}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); setOpenChatMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '8px 12px', color: 'var(--color-danger, #ff4444)', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            Eliminar chat
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{chat.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- RIGHT AREA (ACTIVE CHAT) --- */}
        <div className={`messages-chat-area ${!activeChatId ? 'hidden-on-mobile' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: themeColors.bgSubtle }}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: themeColors.bgSubtle }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button 
                    className="mobile-back-btn" onClick={() => setActiveChatId(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: '0 8px 0 0' }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  </button>
                  <img src={activeChat.avatar} alt={activeChat.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h3 style={{ margin: '0 0 2px 0', fontSize: '1.1rem', color: 'var(--color-text-main)' }}>{activeChat.name}</h3>
                  </div>
                </div>
              </div>

              {/* Pinned Message Banner */}
              {(() => {
                const pinnedMsg = messages.slice().reverse().find(m => m.is_pinned && !m.is_deleted);
                if (!pinnedMsg) return null;
                return (
                  <div style={{ padding: '8px 24px', background: 'rgba(255,115,0,0.1)', borderBottom: '1px solid rgba(255,115,0,0.2)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="var(--color-primary)" strokeWidth="2"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
                    <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
                      {pinnedMsg.content || (pinnedMsg.attachment_type ? `Archivo ${pinnedMsg.attachment_type}` : 'Mensaje fijado')}
                    </div>
                  </div>
                );
              })()}

              {/* Messages Area */}
              <div style={{ flex: 1, padding: '24px 24px 120px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map((msg: any) => {
                  const isMe = msg.sender_id === supabaseUser?.id;
                  return (
                    <div key={msg.id} className="message-item-container" style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', position: 'relative', maxWidth: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isMe ? 'row-reverse' : 'row', maxWidth: '100%', position: 'relative' }}>
                        {msg.is_deleted ? (
                          <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                            Este mensaje fue eliminado
                          </div>
                        ) : (
                          <div style={{ 
                            maxWidth: '70vw', minWidth: 0, padding: '12px 16px', borderRadius: 'var(--radius-lg)', 
                            background: isMe ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)', color: isMe ? '#fff' : 'var(--color-text-main)',
                            borderBottomRightRadius: isMe ? '4px' : 'var(--radius-lg)', borderBottomLeftRadius: !isMe ? '4px' : 'var(--radius-lg)'
                          }}>
                            {msg.content && <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.4, wordBreak: 'break-all', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{msg.content}</p>}
                        
                        {/* Attachments rendering */}
                        {msg.attachment_url && (
                          <div style={{ marginTop: msg.content ? '10px' : '0' }}>
                            {msg.attachment_type === 'image' && (
                              <img src={msg.attachment_url} alt="Adjunto" style={{ maxWidth: '100%', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.open(msg.attachment_url, '_blank')} />
                            )}
                            {msg.attachment_type === 'video' && (
                              <video src={msg.attachment_url} controls style={{ maxWidth: '100%', borderRadius: '8px' }} />
                            )}
                            {msg.attachment_type === 'audio' && (
                              <audio src={msg.attachment_url} controls style={{ maxWidth: '100%', borderRadius: '8px', minWidth: '250px' }} />
                            )}
                            {msg.attachment_type === 'document' && (
                              <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none', background: 'rgba(0,0,0,0.1)', padding: '10px', borderRadius: '8px' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                                <span>Ver Documento Adjunto</span>
                              </a>
                            )}
                          </div>
                        )}
                          </div>
                        )}
                        <div className="msg-actions-hover">
                          <button onClick={(e) => { e.stopPropagation(); setOpenMessageMenu(openMessageMenu === msg.id ? null : msg.id); }} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                          </button>
                        </div>
                        {openMessageMenu === msg.id && (
                          <div style={{ position: 'absolute', right: isMe ? 0 : 'auto', left: isMe ? 'auto' : 0, top: '100%', background: 'var(--color-bg, #1a1a1a)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '4px', zIndex: 50, minWidth: '160px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                            {!msg.is_deleted && (
                              <button onClick={(e) => { e.stopPropagation(); togglePinMessage(msg); setOpenMessageMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '8px 12px', color: 'var(--color-text-main)', cursor: 'pointer', fontSize: '0.85rem' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill={msg.is_pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
                                {msg.is_pinned ? "Desfijar mensaje" : "Fijar mensaje"}
                              </button>
                            )}
                            {!msg.is_deleted && isMe && (
                              <button onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); setOpenMessageMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '8px 12px', color: 'var(--color-danger, #ff4444)', cursor: 'pointer', fontSize: '0.85rem' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                Eliminar para todos
                              </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); hardDeleteMessage(msg.id); setOpenMessageMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '8px 12px', color: 'var(--color-danger, #ff4444)', cursor: 'pointer', fontSize: '0.85rem' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              Borrar para mí
                            </button>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && !msg.is_deleted && (
                           <span style={{ display: 'flex', color: msg.status === 'read' ? '#53bdeb' : 'var(--color-text-muted)' }}>
                             {(msg.status === 'sent' || !msg.status) && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                             {(msg.status === 'delivered' || msg.status === 'read') && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 6 7 17 2 12"></polyline><polyline points="22 6 11 17 6 12"></polyline></svg>}
                           </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', background: themeColors.bgSubtle, display: 'flex', gap: '12px', alignItems: 'center' }}>
                
                {/* File Input (Hidden) */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  hidden 
                  onChange={handleFileUpload} 
                  accept="image/jpeg,image/png,image/webp,video/mp4,audio/ogg,audio/mpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                />

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: isUploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Adjuntar archivo (Img, Video, Audio, Doc)"
                >
                  {isUploading ? (
                    <div style={{ width: '24px', height: '24px', border: '2px solid', borderColor: 'var(--color-primary) transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                  )}
                </button>
                
                <input 
                  type="text" 
                  placeholder="Escribe un mensaje..." 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(messageInput); }}
                  style={{ 
                    flex: 1, background: themeColors.bgSubtle2, border: '1px solid var(--color-border)', color: 'var(--color-text-main)', 
                    padding: '12px 16px', borderRadius: 'var(--radius-full)', outline: 'none', fontSize: '0.95rem' 
                  }} 
                />
                
                <button 
                  onClick={() => handleSendMessage(messageInput)}
                  style={{ 
                    background: 'var(--color-primary)', border: 'none', color: '#fff', 
                    width: '42px', height: '42px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '-2px' }}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.5 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <h2>Tus Mensajes</h2>
              <p>Selecciona un chat para comenzar a enviar mensajes y archivos multimedia.</p>
            </div>
          )}
        </div>
      </div>

      {isAdvisorModalOpen && <VirtualAdvisorModal onClose={() => setIsAdvisorModalOpen(false)} />}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
