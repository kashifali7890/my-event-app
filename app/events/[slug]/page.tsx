import { createClient } from "@/lib/supabase/server";
import EventGalleryClient from "./EventGalleryClient";

export default async function EventGalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Get the current logged-in user (if any)
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const { data: photos } = await supabase
    .from("photos")
    .select("id, image_url, guest_name, created_at, event_id")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  // 2. Check if the current user is the owner of this event
  const isHost = user?.id === event.user_id;

  return (
    <EventGalleryClient
      event={event}
      photos={photos || []}
      slug={slug}
      isHost={isHost} // Pass this to the client
    />
  );
}
