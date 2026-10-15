"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarPlus, Loader2 } from "lucide-react";

export default function CreateEventPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);

  // Check if user is logged in on load
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login"); // Kick them to login if not authenticated
      } else {
        setUser(user);
      }
    };
    getUser();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate || !user) return;

    setLoading(true);
    setError("");

    try {
      // 1. Generate a unique slug
      const randomNum = Math.floor(Math.random() * 9000) + 1000;
      const slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") +
        "-" +
        randomNum;

      // 2. Insert into Supabase
      const { data, error: dbError } = await supabase
        .from("events")
        .insert([
          {
            title: title.trim(),
            event_date: eventDate,
            slug: slug,
            user_id: user.id, // 🌟 MAGIC LINE: Links event to the logged-in user!
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      // 3. Redirect to the new event page
      router.push(`/events/${data.slug}`);
    } catch (err: any) {
      console.error(err);
      setError("Failed to create event. Please try again.");
      setLoading(false);
    }
  };

  // Show loading spinner while checking auth
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <CalendarPlus className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
          <p className="text-gray-500">Set up a new photo gallery</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sarah's 30th Birthday"
              className="w-full px-4 py-3 rounded-lg border text-gray-600 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Date
            </label>
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !title.trim() || !eventDate}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Event"
            )}
          </button>

          <Link
            href="/"
            className="block text-center text-sm text-gray-500 hover:text-gray-800 transition pt-2"
          >
            Cancel and return home
          </Link>
        </form>
      </div>
    </div>
  );
}
