'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import VirtualAdvisorModal from '@/components/chat/VirtualAdvisorModal';
import { useThemeColors } from '@/hooks/useThemeColors';

// --- INITIAL MOCK DATA ---
const INITIAL_CHATS: any[] = [];

export default function MensajesPage() {
  const themeColors = useThemeColors();
  const { isVendorModeActive } = useAuth();
  const { hasFeature } = usePlan();
  
  const canUseBot = hasFeature('botAsesor');
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
  
  // Si el usuario no está en modo vendedor, forzamos a que vea 'negocios'
  const [activeTab, setActiveTab] = useState<'negocios' | 'clientes'>('negocios');
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');

  const [chats, setChats] = useState<any[]>([]);
  const currentChats = chats.filter(c => c.type === activeTab);
  const activeChat = chats.find(c => c.id === activeChatId);

  // Auto-select first chat when switching tabs
  useEffect(() => {
    if (currentChats.length > 0) {
      setActiveChatId(currentChats[0].id);
    } else {
      setActiveChatId(null);
    }
  }, [activeTab]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeChat) {
      scrollToBottom();
    }
  }, [activeChat?.messages, activeChatId]);

  const handleSendMessage = (text: string, optionContext?: any) => {
    if (!text.trim() || !activeChatId) return;

    const userText = text.trim();
    const newMsg = { id: Date.now(), text: userText, sender: 'me', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    
    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return { ...c, messages: [...c.messages, newMsg], lastMessage: userText };
      }
      return c;
    }));

    if (text === messageInput) setMessageInput('');

    // Chatbot logic
    const chat = chats.find(c => c.id === activeChatId);
    if (!chat) return;

    const getWhatsappTextWithHistory = (configuredText: string, chatMessages: any[], currentUserText: string) => {
      const history = chatMessages.map((m: any) => `${m.sender === 'me' ? 'Cliente' : 'Bot'}: ${m.text}`).join('\n');
      return `${configuredText}\n\n--- Historial del chat ---\n${history}\nCliente: ${currentUserText}`;
    };

    if (optionContext) {
      if (optionContext.responseType === 'goto') {
        const botContext = localStorage.getItem('cazamarket_virtual_advisor');
        if (botContext) {
          try {
            const data = JSON.parse(botContext);
            let targetRule = data.generalRules?.find((r: any) => r.id === optionContext.ruleId);
            if (!targetRule && chat.productId && data.productRules?.[chat.productId]) {
              targetRule = data.productRules[chat.productId].find((r: any) => r.id === optionContext.ruleId);
            }
            if (targetRule) {
              let targetNode = null;
              if (optionContext.gotoId === 'root') {
                targetNode = targetRule;
              } else {
                const findNode = (opts: any[], id: string): any => {
                  for (let o of opts) {
                    if (o.id === id) return o;
                    if (o.options) {
                      const res = findNode(o.options, id);
                      if (res) return res;
                    }
                  }
                  return null;
                };
                if (targetRule.options) {
                  targetNode = findNode(targetRule.options, optionContext.gotoId);
                }
              }
              if (targetNode) {
                optionContext = { ...targetNode, ruleId: optionContext.ruleId };
              }
            }
          } catch(e) {}
        }
      }

      setTimeout(() => {
        const botMsg = { 
          id: Date.now() + 1, 
          text: optionContext.responseText, 
          sender: 'them', 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          options: optionContext.responseType === 'options' ? optionContext.options : undefined,
          fileName: optionContext.responseType === 'file' ? optionContext.fileName : undefined,
          whatsappText: optionContext.responseType === 'whatsapp' ? getWhatsappTextWithHistory(optionContext.whatsappText || '', chat.messages, userText) : undefined,
          ruleId: optionContext.ruleId
        };
        setChats(prev => prev.map(c => {
          if (c.id === activeChatId) {
            return { ...c, messages: [...c.messages, botMsg], lastMessage: optionContext.responseText };
          }
          return c;
        }));
      }, 800);
      return; // Skip global rules
    }

    const botContext = localStorage.getItem('cazamarket_virtual_advisor');
    if (botContext) {
      try {
        const data = JSON.parse(botContext);
        let rulesToCheck = data.generalRules || [];
        if (chat.productId && data.productRules && data.productRules[chat.productId]) {
           rulesToCheck = [...data.productRules[chat.productId], ...rulesToCheck];
        }

        const normalizeText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const normalizedUserText = normalizeText(userText);

        let matchedRule = rulesToCheck.find((r: any) => r.conditionType === 'exact' && normalizeText(r.conditionValue) === normalizedUserText);
        if (!matchedRule) {
          matchedRule = rulesToCheck.find((r: any) => r.conditionType === 'keyword' && normalizedUserText.includes(normalizeText(r.conditionValue)));
        }
        if (!matchedRule) {
          matchedRule = rulesToCheck.find((r: any) => r.conditionType === 'any');
        }

        if (matchedRule) {
          setTimeout(() => {
            const botMsg = { 
              id: Date.now() + 1, 
              text: matchedRule.responseText, 
              sender: 'them', 
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              options: matchedRule.responseType === 'options' ? matchedRule.options : undefined,
              fileName: matchedRule.responseType === 'file' ? matchedRule.fileName : undefined,
              whatsappText: matchedRule.responseType === 'whatsapp' ? getWhatsappTextWithHistory(matchedRule.whatsappText || '', chat.messages, userText) : undefined,
              ruleId: matchedRule.id
            };
            setChats(prev => prev.map(c => {
              if (c.id === activeChatId) {
                return { ...c, messages: [...c.messages, botMsg], lastMessage: matchedRule.responseText };
              }
              return c;
            }));
          }, 800);
        }
      } catch(e) {}
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', height: 'calc(100vh - 140px)', minHeight: '600px', padding: 'var(--spacing-6)' }}>
      
      <div className="glass-panel" style={{ display: 'flex', height: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        
        {/* --- LEFT SIDEBAR (CHATS LIST) --- */}
        <div style={{ width: '350px', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)', background: themeColors.bgSubtle2 }}>
          
          {/* Header & Tabs */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--color-text-main)' }}>Mensajes</h2>
              {canUseBot && (
                <button 
                  onClick={() => setIsAdvisorModalOpen(true)}
                  className="btn-glow"
                  style={{
                    background: 'var(--color-primary)', 
                    color: '#fff', border: 'none', padding: '8px 16px', 
                    borderRadius: 'var(--radius-full)', fontSize: '0.85rem', cursor: 'pointer', 
                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,115,0,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4" />
                    <line x1="8" y1="16" x2="8" y2="16" />
                    <line x1="16" y1="16" x2="16" y2="16" />
                  </svg>
                  Crear asesor virtual
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', background: themeColors.bgSubtle3, borderRadius: 'var(--radius-full)', padding: '6px', gap: '4px' }}>
              <button 
                onClick={() => setActiveTab('negocios')}
                style={{ 
                  flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.3s',
                  background: activeTab === 'negocios' ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === 'negocios' ? '#fff' : 'var(--color-text-muted)',
                  boxShadow: activeTab === 'negocios' ? '0 2px 8px rgba(255,115,0,0.4)' : 'none'
                }}
              >
                Con Negocios
              </button>
              
              {/* Solo mostrar la pestaña de clientes si está en modo vendedor */}
              {isVendorModeActive && (
                <button 
                  onClick={() => setActiveTab('clientes')}
                  style={{ 
                    flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.3s',
                    background: activeTab === 'clientes' ? 'var(--color-primary)' : 'transparent',
                    color: activeTab === 'clientes' ? '#fff' : 'var(--color-text-muted)',
                    boxShadow: activeTab === 'clientes' ? '0 2px 8px rgba(255,115,0,0.4)' : 'none'
                  }}
                >
                  Con Clientes
                </button>
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
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', cursor: 'pointer', transition: 'all 0.3s', 
                  borderRadius: 'var(--radius-lg)', marginBottom: '8px',
                  background: activeChatId === chat.id ? 'linear-gradient(90deg, rgba(255,115,0,0.15), transparent)' : 'transparent',
                  border: '1px solid',
                  borderColor: activeChatId === chat.id ? 'rgba(255,115,0,0.3)' : 'transparent'
                }}
                onMouseEnter={e => { if (activeChatId !== chat.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={e => { if (activeChatId !== chat.id) e.currentTarget.style.background = 'transparent' }}
              >
                {/* Avatar */}
                <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
                  <img src={chat.avatar} alt={chat.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  {chat.online && (
                    <div style={{ position: 'absolute', bottom: 2, right: 2, width: '12px', height: '12px', background: '#25D366', borderRadius: '50%', border: '2px solid var(--color-bg-base)' }} />
                  )}
                </div>
                
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{chat.time}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: chat.unread > 0 ? 'var(--color-text-main)' : 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: chat.unread > 0 ? 600 : 400 }}>
                      {chat.lastMessage}
                    </p>
                    {chat.unread > 0 && (
                      <span style={{ background: 'var(--color-primary)', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px' }}>
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- RIGHT AREA (ACTIVE CHAT) --- */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: themeColors.bgSubtle }}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: themeColors.bgSubtle }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img src={activeChat.avatar} alt={activeChat.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h3 style={{ margin: '0 0 2px 0', fontSize: '1.1rem', color: 'var(--color-text-main)' }}>{activeChat.name}</h3>
                    <span style={{ fontSize: '0.8rem', color: activeChat.online ? '#25D366' : 'var(--color-text-muted)' }}>
                      {activeChat.online ? 'En línea' : 'Última vez recientemente'}
                    </span>
                  </div>
                </div>
                
                <button style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                </button>
              </div>

              {/* Messages Area */}
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeChat.messages.map((msg: any) => {
                  const isMe = msg.sender === 'me';
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ 
                        maxWidth: '70%', 
                        padding: '12px 16px', 
                        borderRadius: 'var(--radius-lg)', 
                        background: isMe ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                        color: isMe ? '#fff' : 'var(--color-text-main)',
                        borderBottomRightRadius: isMe ? '4px' : 'var(--radius-lg)',
                        borderBottomLeftRadius: !isMe ? '4px' : 'var(--radius-lg)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                      }}>
                        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.4 }}>{msg.text}</p>
                        
                        {msg.fileName && (
                          <div style={{ marginTop: '8px', padding: '8px 12px', background: themeColors.bgSubtle2, borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                            <span style={{ fontSize: '0.85rem' }}>{msg.fileName}</span>
                          </div>
                        )}

                        {msg.whatsappText && (
                          <a 
                            href={`https://wa.me/1234567890?text=${encodeURIComponent(msg.whatsappText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                              marginTop: '12px', padding: '10px 16px', background: '#25D366', color: '#fff', 
                              borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '8px', 
                              textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.2)', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            Contactar por WhatsApp
                          </a>
                        )}

                        {msg.options && msg.options.length > 0 && (
                          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {msg.options.map((opt: any, i: number) => (
                              <button 
                                key={i}
                                onClick={() => handleSendMessage(opt.label || opt, typeof opt === 'object' ? { ...opt, ruleId: msg.ruleId } : undefined)}
                                style={{ 
                                  background: 'rgba(255,115,0,0.1)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', 
                                  padding: '10px 16px', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontSize: '0.85rem', textAlign: 'center', fontWeight: 600,
                                  transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = 'var(--color-primary)';
                                  e.currentTarget.style.color = '#fff';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = 'rgba(255,115,0,0.1)';
                                  e.currentTarget.style.color = 'var(--color-primary)';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                              >
                                {opt.label || opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px', marginRight: isMe ? '4px' : '0', marginLeft: !isMe ? '4px' : '0' }}>
                        {msg.time}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', background: themeColors.bgSubtle, display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
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
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
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
              <p>Selecciona un chat para comenzar a enviar mensajes.</p>
            </div>
          )}
        </div>
      </div>

      {isAdvisorModalOpen && (
        <VirtualAdvisorModal 
          onClose={() => setIsAdvisorModalOpen(false)} 
        />
      )}
    </div>
  );
}
