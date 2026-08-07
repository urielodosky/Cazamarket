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
  const [messages, setMessages] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch chats on mount
  useEffect(() => {
    if (!supabaseUser) return;

    const fetchChats = async () => {
      // In a real app we'd join with profiles to get names and avatars.
      // We will do a basic fetch for now.
      const { data, error } = await supabase
        .from('chats')
        .select('*, buyer:profiles!buyer_id(store_name, avatar_url, first_name, last_name), seller:profiles!seller_id(store_name, avatar_url, first_name, last_name)')
        .or(`buyer_id.eq.${supabaseUser.id},seller_id.eq.${supabaseUser.id}`)
        .order('updated_at', { ascending: false });

      if (data) {
        // Map data to UI expected format
        const mappedChats = data.map(c => {
          const isBuyer = c.buyer_id === supabaseUser.id;
          const otherParty = isBuyer ? c.seller : c.buyer;
          const type = isBuyer ? 'negocios' : 'clientes'; // If I am buyer, I am talking to a negocio
          
          let name = 'Usuario';
          if (otherParty) {
            name = otherParty.store_name || `${otherParty.first_name || ''} ${otherParty.last_name || ''}`.trim() || 'Usuario';
          }

          return {
            id: c.id,
            type: type,
            name: name,
            avatar: otherParty?.avatar_url || 'https://via.placeholder.com/150',
            online: false,
            time: new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            lastMessage: 'Abrir chat para ver mensajes',
            unread: 0,
            dbChat: c
          };
        });
        setChats(mappedChats);
      }
    };

    fetchChats();
  }, [supabaseUser, supabase]);

  const currentChats = chats.filter(c => c.type === activeTab);
  const activeChat = chats.find(c => c.id === activeChatId);

  // Auto-select first chat
  useEffect(() => {
    if (currentChats.length > 0) {
      if (typeof window !== 'undefined' && window.innerWidth > 768) {
        setActiveChatId(currentChats[0].id);
      } else {
        setActiveChatId(null);
      }
    } else {
      setActiveChatId(null);
    }
  }, [activeTab, chats.length]);

  // Fetch messages and subscribe to Realtime
  useEffect(() => {
    if (!activeChatId || !supabaseUser) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', activeChatId)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
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
        setMessages(prev => [...prev, payload.new]);
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
      await supabase.from('messages').insert({
        chat_id: activeChatId,
        sender_id: supabaseUser.id,
        content: userText || null,
        attachment_url: attachmentUrl || null,
        attachment_type: attachmentType || null
      });

      // Update chat updated_at and pause bot if seller is intervening
      const updatePayload: any = { updated_at: new Date().toISOString() };
      if (activeChat?.type === 'clientes') {
        updatePayload.bot_status = 'paused';
      }
      
      await supabase.from('chats').update(updatePayload).eq('id', activeChatId);
      
      // Virtual Advisor Logic (Client side for now, only if I am a buyer talking to a seller)
      if (activeChat?.type === 'negocios' && userText && !attachmentUrl) {
        triggerVirtualAdvisor(userText, optionContext);
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

  // --- VIRTUAL ADVISOR LOGIC ---
  const triggerVirtualAdvisor = async (userText: string, optionContext?: any) => {
    if (!activeChat || !activeChat.dbChat?.seller_id) return;
    const sellerId = activeChat.dbChat.seller_id;
    const productId = activeChat.dbChat.product_id;
    const chatId = activeChat.dbChat.id;

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

      const normalizeText = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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
            attachment_url: null,
            attachment_type: null
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
            {currentChats.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                No tienes mensajes en esta sección.
              </div>
            )}
            {currentChats.map(chat => (
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

              {/* Messages Area */}
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map((msg: any) => {
                  const isMe = msg.sender_id === supabaseUser?.id;
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ 
                        maxWidth: '70%', padding: '12px 16px', borderRadius: 'var(--radius-lg)', 
                        background: isMe ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)', color: isMe ? '#fff' : 'var(--color-text-main)',
                        borderBottomRightRadius: isMe ? '4px' : 'var(--radius-lg)', borderBottomLeftRadius: !isMe ? '4px' : 'var(--radius-lg)'
                      }}>
                        {msg.content && <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.4 }}>{msg.content}</p>}
                        
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
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
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
