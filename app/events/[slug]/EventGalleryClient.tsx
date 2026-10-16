"use client";

import { useState, useEffect } from "react";
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
  const [galleryPhotos, setGalleryPhotos] = useState(photos);
  const [isDownloading, setIsDownloading] = useState(false);
  const supabase = createClient();

  // 🌟 MAGIC FIX: Use production URL if available, otherwise fallback to local
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const uploadUrl = `${appUrl}/events/${slug}/upload`;

  // 1. REAL-TIME SUBSCRIPTION: Listens for new uploads or deletions
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
          if (payload.eventType === "INSERT") {
            setGalleryPhotos((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setGalleryPhotos((prev) =>
              prev.filter((p: any) => p.id !== payload.old.id),
            );
          } else if (payload.eventType === "UPDATE") {
            setGalleryPhotos((prev) =>
              prev.map((p: any) => (p.id === payload.new.id ? payload.new : p)),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id, supabase]);

  // 2. DELETE HANDLER
  const handleDelete = async (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    // OPTIMISTIC UI: Remove it from the screen IMMEDIATELY
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

  // 3. DOWNLOAD ALL AS ZIP HANDLER
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-600">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium transition"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Home
          </Link>

          <button
            onClick={handleDownloadZip}
            disabled={isDownloading || galleryPhotos.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-sm"
          >
            <Download className="w-4 h-4" />
            {isDownloading
              ? "Zipping..."
              : `Download All (${galleryPhotos.length})`}
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Event Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {event.title || "Event Gallery"}
          </h1>
          <p className="text-gray-500 mt-1">
            Manage, delete, and download photos for this event.
          </p>
        </div>

        {/* QR Code Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white p-2 border-2 border-dashed border-blue-200 rounded-xl">
            <QRCodeSVG value={uploadUrl} size={120} />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 justify-center md:justify-start">
              <QrCode className="w-5 h-5 text-blue-600" /> Scan to Upload Photos
            </h2>
            <p className="text-gray-500 mt-1">
              Guests can scan this code to instantly open the upload page.
            </p>
            <p className="text-xs text-gray-400 mt-2 font-mono bg-gray-50 p-2 rounded break-all">
              {uploadUrl}
            </p>
          </div>
        </div>

        {/* Photo Grid */}
        {galleryPhotos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No photos yet
            </h2>
            <p className="text-gray-500">
              Photos will appear here in real-time as guests upload them.
            </p>
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

                {/* Hover Overlay with Delete Action */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-3">
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg"
                      title="Delete photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-white text-sm font-medium">
                    
                  </div>