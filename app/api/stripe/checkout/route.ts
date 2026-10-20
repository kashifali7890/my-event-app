import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // FIX: Get both the event_id and the slug from the request
    const { event_id, slug } = await request.json();
    
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      // FIX: Use the slug in the URLs instead of the event_id
      success_url: `${origin}/events/${slug}?success=true`,
      cancel_url: `${origin}/events/${slug}?canceled=true`,
      metadata: {
        user_id: user.id,
        event_id: event_id,
      },
      customer_email: user.email, 
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Stripe Checkout Error Details:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}