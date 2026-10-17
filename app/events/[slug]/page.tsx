import { createClient } from "@/lib/supabase/server";
import EventGalleryClient from "./EventGalleryClient";

export default async function EventGalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Fetch the event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();

  if (eventError || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Event Not Found
        </h1>
        <a href="/" className="text-blue-600 hover:underline font-medium">
          ← Back to Home
        </a>
      </div>
    );
  }

  // 2. Fetch photos
  const { data: photos } = await supabase
    .from("photos")
    .select("id, image_url, guest_name, created_at, event_id")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  // 3. Pass data to client. We do NOT check isHost here anymore.
  return <EventGalleryClient event={event} photos={photos || []} slug={slug} />;
}
