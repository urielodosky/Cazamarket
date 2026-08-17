'use server';

import { cookies } from 'next/headers';
import { verifyAdminJwt, COOKIE_NAME } from '@/lib/auth/adminJwt';

/**
 * Verifica que la sesión Sudo Mode sea válida desde una Server Action.
 * Lanza un Error si el JWT es inválido, expiró o fue manipulado.
 */
export async function verifySudoMode(): Promise<{ userId: string }> {
  const cookieStore = await cookies();
  const sudoCookie = cookieStore.get(COOKIE_NAME);

  if (!sudoCookie?.value) {
    throw new Error('Sudo mode requerido. La sesión segura ha expirado.');
  }

  const payload = await verifyAdminJwt(sudoCookie.value);

  if (!payload) {
    throw new Error('Sudo mode requerido. La sesión segura ha expirado.');
  }

  return { userId: payload.sub };
}
