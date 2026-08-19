import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Configura las credenciales usando las variables de entorno
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });
const paymentClient = new Payment(client);

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const type = searchParams.get('type') || searchParams.get('topic');
    const dataId = searchParams.get('data.id') || searchParams.get('id');
    
    // Obtenemos los headers de seguridad de Mercado Pago
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;

    // --- Seguridad Nivel 1: Verificación de Firma Criptográfica (Webhook Signature) ---
    if (xSignature && xRequestId && webhookSecret) {
      const parts = xSignature.split(',');
      let ts = '';
      let hash = '';
      
      parts.forEach(part => {
        const [key, value] = part.split('=');
        if (key === 'ts') ts = value;
        if (key === 'v1') hash = value;
      });

      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(manifest);
      const generatedHash = hmac.digest('hex');

      if (generatedHash !== hash) {
        console.error('MercadoPago webhook signature verification failed.');
        return NextResponse.json({ error: 'Firma de webhook inválida' }, { status: 403 });
      }
    } else {
      console.warn('Intento de acceso bloqueado: Falta firma criptográfica en el webhook de Mercado Pago.');
      return NextResponse.json({ error: 'Unauthorized - Missing or Invalid Signature' }, { status: 400 });
    }

    // --- Seguridad Nivel 2: Verificación Activa contra la API Oficial ---
    // Si la firma pasó (o faltaba por una configuración legada de MP), verificamos 
    // el estado real del pago yendo a buscarlo directamente a los servidores de Mercado Pago
    // para evitar cualquier intento de falsificación (Payment Spoofing).
    if (type === 'payment' && dataId) {
      const paymentInfo = await paymentClient.get({ id: dataId });
      
      if (paymentInfo.status === 'approved') {
        // TODO: Acreditar pago en la base de datos o actualizar plan del usuario
        console.log(`Pago seguro verificado y aprobado: ${dataId}`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('MercadoPago Webhook Error:', error?.message || 'Unknown error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
