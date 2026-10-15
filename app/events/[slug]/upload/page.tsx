"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  Image as ImageIcon,
  CheckCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";

declare global {
  interface Window {
    cloudinary: any;
  }
}

export default function GuestUploadPage() {
  const params = useParams();
  const slug = params.slug as string;
  const supabase = createClient();

  const [eventId, setEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [widgetReady, setWidgetReady] = useState(false);

  // --- CHANGE 1: Added state for guest name ---
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title")
        .eq("slug", slug)
        .single();

      if (data) {
        setEventId(data.id);
        setEventTitle(data.title);
      } else {
        setError("Event not found. Please check the URL.");
      }
    };

    if (slug) fetchEvent();
  }, [slug, supabase]);

  useEffect(() => {
    const checkWidget = setInterval(() => {
      if (window.cloudinary) {
        setWidgetReady(true);
        clearInterval(checkWidget);
      }
    }, 500);

    return () => clearInterval(checkWidget);
  }, []);

  const openUploadWidget = async () => {
    if (!eventId || !widgetReady) return;

    setUploading(true);
    setError("");

    try {
      // Get signature from our backend
      const signatureRes = await fetch("/api/upload-signature");
      const signatureData = await signatureRes.json();

      if (!signatureRes.ok) {
        throw new Error("Failed to get upload signature");
      }

      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: signatureData.cloudName,
          uploadPreset: "myevent-unsigned",
          apiKey: signatureData.apiKey,
          signature: signatureData.signature,
          timestamp: signatureData.timestamp,
          sources: ["local"],
          maxFiles: 5,
          multiple: true,
          clientAllowedFormats: ["jpg", "jpeg", "png", "gif"],
          maxFileSize: 10000000,
          cropping: false,
          theme: "minimal",
        },
        async (error: any, result: any) => {
          console.log("Cloudinary Widget Result:", result);
          console.log("Cloudinary Widget Error:", error);

          if (error) {
            const errorMsg = error.message || JSON.stringify(error);
            console.error("Upload failed with error:", errorMsg);
            setError(`Upload failed: ${errorMsg}`);
            setUploading(false);
            return;
          }

          if (result && result.event === "success") {
            console.log("✅ Successfully uploaded:", result.info?.secure_url);

            // --- CHANGE 2: Use the guestName state here instead of hardcoded "Anonymous Guest" ---
            const { error: dbError } = await supabase.from("photos").insert({
              event_id: eventId,
              image_url: result.info?.secure_url,
              guest_name: guestName.trim() || "Anonymous Guest",
            });

            if (dbError) {
              console.error("Database save error:", dbError);
              setError("Photo uploaded, but failed to save to gallery.");
            }
          }

          if (result && result.event === "close") {
            console.log("Widget closed");
            setUploading(false);
            if (!error) {
              setSuccess(true);
            }
          }
        },
      );

      widget.open();
    } catch (err) {
      console.error("Failed to open widget:", err);
      setError("Could not open upload window. Please refresh the page.");
      setUploading(false);
    }
  };

  if (error && !eventId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link
          href={`/events/${slug}`}
          className="flex items-center gap-2 text-blue-600 hover:underline font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Gallery
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-green-50 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Photos Uploaded!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you for sharing your memories at {eventTitle}.
        </p>
        <Link
          href={`/events/${slug}`}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          View Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <ImageIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {eventTitle || "Loading event..."}
          </h1>
          <p className="text-gray-500">
            Upload your photos to the live gallery
          </p>
        </div>

        {error && (
          <div className="bg-yellow-50 text-yellow-700 p-3 rounded-lg text-sm text-center border border-yellow-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* --- CHANGE 3: Added the Guest Name input field right above the button --- */}
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Your Name (Optional)"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />

          <button
            onClick={openUploadWidget}
            disabled={!eventId || !widgetReady || uploading}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {!widgetReady ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading Upload Widget...
              </>
            ) : uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Select & Upload Photos
              </>
            )}
          </button>

          {!widgetReady && (
            <p className="text-xs text-center text-gray-500">
              Please wait while we load the upload tool...
            </p>
          )}

          <Link
            href={`/events/${slug}`}
            className="block text-center text-sm text-gray-500 hover:text-gray-800 transition pt-2"
          >
            Cancel and return to gallery
          </Link>
        </div>

        <p className="text-xs text-center text-gray-400 mt-4">
          Photos are securely uploaded and instantly available to the host.
        </p>
      </div>
    </div>
  );
}
