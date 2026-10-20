// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    // SECURITY: Verify this request actually came from Stripe
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 });
  }

  // Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const eventId = session.metadata?.event_id;

    if (!userId || !eventId) {
      console.error('Missing metadata in webhook:', session);
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    try {
      const supabase = await createClient();

      const { error } = await supabase.from('purchases').insert({
        user_id: userId,
        event_id: eventId,
        stripe_session_id: session.id,
        amount_cents: session.amount_total || 0,
        currency: session.currency || 'aud',
        status: 'completed',
      });

      if (error) {
        // SECURITY: If it's a unique violation, it means Stripe sent this twice. We ignore it safely.
        if (error.code === '23505') {
          console.log('Webhook already processed for session:', session.id);
          return NextResponse.json({ received: true });
        }
        console.error('Failed to insert purchase:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      console.log(`✅ Purchase recorded: User ${userId} bought Event ${eventId}`);
    } catch (error) {
      console.error('Error processing webhook:', error);
      return NextResponse.json({ error: 'Processing error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}