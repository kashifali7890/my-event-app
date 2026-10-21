"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Camera,
  Plus,
  Calendar,
  LogIn,
  Loader2,
  Trash2,
  QrCode,
} from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("events")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setEvents(data || []);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // DELETE EVENT FUNCTION
  const handleDeleteEvent = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation(); // 🛑 CRITICAL: Stops the card from opening

    if (
      !confirm(
        "Are you sure? This will permanently delete the event and ALL its photos.",
      )
    )
      return;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;

      // Remove from UI instantly
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (err: any) {
      alert("Failed to delete event: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50 text-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Event Gallery</h1>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 font-medium hidden sm:inline">
                Hi, {user.user_metadata?.full_name || user.email.split("@")[0]}!
              </span>

              {/* Logout Button */}
              <button
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                    window.location.href = "/";
                  } catch (error) {
                    console.error("Logout failed:", error);
                    window.location.href = "/";
                  }
                }}
                className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium bg-transparent border-none cursor-pointer p-0"
              >
                <LogIn className="w-4 h-4 rotate-180" /> Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <LogIn className="w-4 h-4" /> Login
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {!user ? (
          // 🌟 STATE 1: Logged Out (Public Guest)
          <div className="text-center py-20">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Event Photo Gallery
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Capture, share, and manage memories from your special events
              securely. Scan a QR code to upload, or log in to create your own
              gallery.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-medium shadow-md text-lg"
            >
              <LogIn className="w-5 h-5" /> Log In or Sign Up
            </Link>
          </div>
        ) : events.length === 0 ? (
          // 🌟 STATE 2: Logged In, but NO events (Friendly Guest Uploader View)
          <div className="text-center py-16">
            <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to share some memories?
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-xl mx-auto">
              You are logged in, but you haven't created any event galleries
              yet. You can create your first event below, or simply scan a
              host's QR code to upload photos to their event!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/create-event"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
              >
                <Plus className="w-5 h-5" /> Create Your First Event
              </Link>
              <Link
                href="/login" // Or link to an "How it works" page if you have one
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                <Camera className="w-5 h-5" /> I just want to upload photos
              </Link>
            </div>
          </div>
        ) : (
          // 🌟 STATE 3: Logged In WITH events (Standard Host View)
          <>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Your Events
              </h2>
              <Link
                href="/create-event"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
              >
                <Plus className="w-5 h-5" /> Create New Event
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => router.push(`/events/${event.slug}`)}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border border-gray-200 group relative cursor-pointer"
                >
                  {/* DELETE BUTTON */}
                  <button
                    onClick={(e) => handleDeleteEvent(e, event.id)}
                    className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition opacity-0 group-hover:opacity-100 z-10"
                    title="Delete Event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition">
                    <Camera className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 pr-8">
                    {event.title}
                  </h3>

                  {event.event_date && (
                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-4">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(event.event_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <span className="text-blue-600 text-sm font-medium">
                    View Gallery &rarr;
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
