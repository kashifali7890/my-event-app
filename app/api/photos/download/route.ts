// app/api/photos/download/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Check if the user is logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get the event_id and photo_id from the URL parameters
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    const photoId = searchParams.get('photo_id'); // This should be the ID from your 'photos' table

    if (!eventId || !photoId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 3. SECURITY CHECK: Does this user have a completed purchase for this event?
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .eq('status', 'completed')
      .single();

    // If no purchase found, or error, block access
    if (purchaseError || !purchase) {
      return NextResponse.json({ error: 'Access denied. Purchase required.' }, { status: 403 });
    }

    // 4. If they paid, fetch the photo details from your database
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('url, high_res_url') // Adjust these column names to match your actual 'photos' table
      .eq('id', photoId)
      .eq('event_id', eventId) // Ensure the photo belongs to the event they bought
      .single();

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // 5. Return the secure URL
    // Note: For true "temporary" links, we would use Cloudinary's signed URL feature here.
    // For now, we return the high-res URL stored in your DB.
    return NextResponse.json({ 
      url: photo.high_res_url || photo.url,
      expires_in: 3600 // Tell the frontend this is valid for 1 hour (conceptual)
    });

  } catch (error) {
    console.error('Download API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}