"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // 🌟 ADDED: Next.js router for redirection
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, Trash2, Camera, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import JSZip from "jszip";

function getOptimizedUrl(url: string) {
  if (!url) return "";
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
}

export default function EventGalleryClient({
  event,
  photos,
  slug,
}: {
  event: any;
  photos: any[];
  slug: string;
}) {
  const router = useRouter(); // 🌟 ADDED: Initialize router
  const [galleryPhotos, setGalleryPhotos] = useState(photos);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const uploadUrl = `${appUrl}/events/${slug}/upload`;

  // 1. Check if user is the host
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.id === event.user_id) {
        setIsHost(true);
      } else {
        setIsHost(false);
      }
      setIsLoadingAuth(false);
    };
    checkAuth();
  }, [event.user_id, supabase]);

  // 2. Check if the gallery has been purchased
  useEffect(() => {
    const checkPurchase = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setHasPurchased(false);
        return;
      }

      const { data } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("event_id", event.id)
        .eq("status", "completed")
        .limit(1);

      if (data && data.length > 0) {
        setHasPurchased(true);
      } else {
        setHasPurchased(false);
      }
    };

    if (!isLoadingAuth) {
      checkPurchase();
    }
  }, [isLoadingAuth, event.id, supabase]);

  // 3. REAL-TIME SUBSCRIPTION
  useEffect(() => {
    const channel = supabase
      .channel(`event-gallery-${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "photos",
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT")
            setGalleryPhotos((prev) => [payload.new, ...prev]);
          else if (payload.eventType === "DELETE")
            setGalleryPhotos((prev) =>
              prev.filter((p: any) => p.id !== payload.old.id),
            );
          else if (payload.eventType === "UPDATE")
            setGalleryPhotos((prev) =>
              prev.map((p: any) => (p.id === payload.new.id ? payload.new : p)),
            );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id, supabase]);

  // 4. DELETE HANDLER
  const handleDelete = async (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    setGalleryPhotos((prev) => prev.filter((p: any) => p.id !== photoId));
    try {
      const { error } = await supabase
        .from("photos")
        .delete()
        .eq("id", photoId);
      if (error) throw error;
    } catch (err: any) {
      console.error("Delete error:", err);
      alert("Failed to delete photo. Error: " + err.message);
    }
  };

  // 5. DOWNLOAD ALL AS ZIP HANDLER
  const handleDownloadZip = async () => {
    if (galleryPhotos.length === 0) return;
    setIsDownloading(true);
    const zip = new JSZip();
    const imgFolder = zip.folder("photos");

    try {
      for (let i = 0; i < galleryPhotos.length; i++) {
        const photo = galleryPhotos[i];
        const response = await fetch(getOptimizedUrl(photo.image_url));
        const blob = await response.blob();
        imgFolder?.file(`photo-${i + 1}.jpg`, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `${event.title || "event"}-photos.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to generate ZIP:", err);
      alert("Failed to download photos.");
    } finally {
      setIsDownloading(false);
    }
  };

  // 6. STRIPE CHECKOUT HANDLER
  const handleCheckout = async () => {
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: event.id, slug: slug }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error starting checkout. Please try again.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // 🌟 NEW: Handle Guest Logout and Redirect
  const handleGoBackHome = async () => {
    // 1. Clear any local guest session markers
    localStorage.removeItem("guestToken");
    sessionStorage.removeItem("isGuest");
    sessionStorage.removeItem("currentEventId");

    // 2. Sign out from Supabase to ensure a completely clean slate
    await supabase.auth.signOut();

    // 3. Redirect to the public Thank You page
    router.push("/thank-you");
  };

  // Show a small loader while checking auth
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-600">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* 🌟 UPDATED: Conditional Back Button */}
          {!isHost ? (
            <button
              onClick={handleGoBackHome}
              className="flex items-center gap-2 text-gray-700 hover:text-red-600 font-medium transition"
            >
              <ArrowLeft className="w-5 h-5" /> Leave Event & Go Home
            </button>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium transition"
            >
              <ArrowLeft className="w-5 h-5" /> Back to Dashboard
            </Link>
          )}

          {/* DOWNLOAD BUTTON: Only show for Host IF they have purchased */}
          {isHost && hasPurchased && galleryPhotos.length > 0 && (
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-sm"
            >
              <Download className="w-4 h-4" />
              {isDownloading
                ? "Zipping..."
                : `Download All (${galleryPhotos.length})`}
            </button>
          )}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Event Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {event.title || "Event Gallery"}
          </h1>
          <p className="text-gray-500 mt-1">
            {isHost
              ? "Manage, delete, and download photos for this event."
              : "View photos shared by guests."}
          </p>
        </div>

        {/* PAYWALL BANNER: ONLY for Host, ONLY if NOT purchased, ONLY if photos exist */}
        {isHost && !hasPurchased && galleryPhotos.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 text-center">
            <h3 className="text-xl font-bold text-blue-900 mb-2">
              Unlock High-Res Photos
            </h3>
            <p className="text-blue-700 mb-4">
              Get access to download all high-resolution photos from this event.
            </p>
            <button
              onClick={handleCheckout}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-200 shadow-md cursor-pointer "
            >
              Unlock Gallery for A$4.99
            </button>
          </div>
        )}

        {/* SUCCESS BANNER: ONLY for Host, ONLY IF purchased */}
        {isHost && hasPurchased && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-8 text-center text-green-800 font-medium">
            ✅ Gallery Unlocked! You can now download high-resolution photos.
          </div>
        )}

        {/* ONLY HOST: QR Code Section */}
        {isHost && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white p-2 border-2 border-dashed border-blue-200 rounded-xl">
              <QRCodeSVG value={uploadUrl} size={120} />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 justify-center md:justify-start">
                <QrCode className="w-5 h-5 text-blue-600" /> Scan to Upload
                Photos
              </h2>
              <p className="text-gray-500 mt-1">
                Guests can scan this code to instantly open the upload page.
              </p>
              <p className="text-xs text-gray-400 mt-2 font-mono bg-gray-50 p-2 rounded break-all">
                {uploadUrl}
              </p>
            </div>
          </div>
        )}

        {/* Photo Grid */}
        {galleryPhotos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No photos yet
            </h2>
            <p className="text-gray-500">
              {isHost
                ? "Share the QR code to get started!"
                : "Be the first to upload a photo!"}
            </p>
            {!isHost && (
              <Link
                href={`/events/${slug}/upload`}
                className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Upload Photos
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryPhotos.map((photo: any) => (
              <div
                key={photo.id}
                className="relative group aspect-square bg-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <Image
                  src={getOptimizedUrl(photo.image_url)}
                  alt={`Photo by ${photo.guest_name || "Anonymous"}`}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-3">
                  {isHost && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDelete(photo.id)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg"
                        title="Delete photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* INDIVIDUAL DOWNLOAD: Only for Host IF purchased */}
                  {isHost && hasPurchased && (
                    <div className="mt-auto">
                      <a
                        href={`/api/photos/download?event_id=${event.id}&photo_id=${photo.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-white text-gray-900 font-semibold py-2 px-3 rounded-lg hover:bg-gray-100 transition text-sm"
                      >
                        <Download className="w-4 h-4" /> Download High-Res
                      </a>
                    </div>
                  )}

                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 w-full mt-2">
                    <p className="text-white text-xs font-medium">
                      {photo.guest_name || "Anonymous Guest"}
                    </p>
                    <p className="text-gray-300 text-[10px]">
                      {new Date(photo.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GUEST: Upload more photos button at the bottom */}
        {!isHost && galleryPhotos.length > 0 && (
          <div className="text-center mt-8">
            <Link
              href={`/events/${slug}/upload`}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Upload More Photos
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
