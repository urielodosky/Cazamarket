import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'admin_sudo_session';
const JWT_EXPIRATION = '1h'; // La sesión sudo expira en 1 hora

/**
 * Obtiene la clave secreta para firmar/verificar JWTs del admin.
 * Lanza un error si la variable de entorno no está configurada.
 */
function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error('ADMIN_JWT_SECRET no está configurado en las variables de entorno.');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Firma un JWT con el userId y rol del administrador.
 * Se usa al momento de iniciar sesión en Sudo Mode.
 */
export async function signAdminJwt(userId: string): Promise<string> {
  const token = await new SignJWT({
    sub: userId,
    role: 'superadmin',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(getSecret());

  return token;
}

/**
 * Verifica un JWT de admin. Retorna el payload decodificado si es válido.
 * Retorna null si el token es inválido, fue manipulado o expiró.
 */
export async function verifyAdminJwt(token: string): Promise<{ sub: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== 'superadmin' || !payload.sub) {
      return null;
    }
    return { sub: payload.sub as string, role: payload.role as string };
  } catch {
    // Token expirado, firma inválida, o cualquier otro error
    return null;
  }
}

/**
 * Nombre de la cookie que almacena el JWT del Sudo Mode.
 */
export { COOKIE_NAME };
