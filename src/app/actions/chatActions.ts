'use server'

import { createClient as createServerClient } from '@/lib/supabase/server';
import { encryptText, decryptText } from '@/lib/security/encryption';

// Insertar un nuevo mensaje cifrado
export async function sendEncryptedMessage(chatId: string, content: string | null, attachmentUrl: string | null = null, attachmentType: string | null = null) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'No autorizado' };

  // Encriptar el contenido si existe
  const encryptedContent = content ? encryptText(content) : null;

  const { data, error } = await supabase.from('messages').insert({
    chat_id: chatId,
    sender_id: user.id,
    content: encryptedContent,
    attachment_url: attachmentUrl,
    attachment_type: attachmentType
  }).select().single();

  if (error) return { success: false, error: error.message };

  // Devolvemos el mensaje con el contenido plano para optimismo en UI, 
  // pero en base de datos ya está cifrado.
  return { 
    success: true, 
    data: { ...data, content: content } 
  };
}

// Obtener todos los mensajes de un chat y descifrarlos
export async function getDecryptedMessages(chatId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'No autorizado' };

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) return { success: false, error: error.message };

  // Desciframos
  const decryptedMessages = messages.map(msg => ({
    ...msg,
    content: msg.content ? decryptText(msg.content) : null
  }));

  return { success: true, data: decryptedMessages };
}

// Descifrar un solo mensaje (ej: cuando llega por Realtime)
export async function decryptSingleMessage(message: any) {
  // Al ser un server action no necesitamos auth check riguroso acá, 
  // pero RLS ya protegió el select original que originó este mensaje.
  if (!message) return null;
  return {
    ...message,
    content: message.content ? decryptText(message.content) : null
  };
}
