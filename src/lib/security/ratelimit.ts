import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Inicializa el cliente de Redis
// Usa automáticamente las variables UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN
const redis = Redis.fromEnv();

// Límite global para toda la API: 20 peticiones por cada 10 segundos por IP
export const globalRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, '10 s'),
  analytics: true,
  prefix: '@upstash/ratelimit/global',
});

// Límite estricto para rutas de autenticación: 5 peticiones por minuto por IP
// Para evitar ataques de fuerza bruta en el login y creación masiva de cuentas
export const authRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/auth',
});
