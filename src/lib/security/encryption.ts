import crypto from 'crypto';

// aes-256-gcm requiere una clave de 32 bytes (256 bits).
// Se debe pasar en base64 o hex en el .env. Aquí asumiremos que es hex.
// Si no existe, usamos un fallback para que no explote en build time, 
// pero deberías configurarla.
const ENCRYPTION_KEY = process.env.CHAT_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

export function encryptText(text: string): string {
  if (!text) return text;
  
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(12); // GCM standard is 12 bytes
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Guardamos el IV, el authTag y el texto cifrado separados por :
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptText(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  
  // Si no tiene el formato esperado, puede que sea un mensaje antiguo sin cifrar
  if (!encryptedText.includes(':')) {
    return encryptedText;
  }

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('Error desencriptando mensaje:', err);
    // Si falla (ej. clave rota o cambiada), devolvemos un mensaje genérico
    return '🔒 [Mensaje encriptado indisponible]';
  }
}
