import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Falta la firma criptográfica (Stripe Signature)' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      // --- Seguridad: Verificación de Firmas (Webhook Signature) ---
      // Validamos criptográficamente que el evento provenga de Stripe
      // y no haya sido manipulado en tránsito.
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      // Rechazar inmediatamente cualquier evento sin firma válida
      return NextResponse.json({ error: 'Firma de webhook inválida' }, { status: 400 });
    }

    // Procesamiento seguro de eventos
    switch (event.type) {
      case 'checkout.session.completed':
        // const session = event.data.object as Stripe.Checkout.Session;
        // TODO: Acreditar pago o actualizar plan
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error?.message || 'Unknown error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
