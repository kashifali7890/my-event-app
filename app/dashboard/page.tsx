"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { Trash2, ArrowLeft, Download, Camera, Loader2 } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// Helper to optimize Cloudinary images
function getOptimizedUrl(url: string) {
  if (!url) return "";
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
}

export default function DashboardPage() {
  const supabase = createClient();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Fetch all photos on load
  useEffect(() => {
    const fetchPhotos = async () => {
      const { data, error } = await supabase
        .from("photos")
        .select(`id, image_url, guest_name, created_at, events ( title, slug )`)
        .order("created_at", { ascending: false });

      if (data) setPhotos(data);
      setLoading(false);
    };

    fetchPhotos();
  }, [supabase]);

  // Handle Photo Deletion
  const handleDelete = async (photoId: string) => {
    if (!confirm("Are you sure you want to permanently delete this photo?"))
      return;

    try {
      const res = await fetch("/api/delete-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });

      if (res.ok) {
        // Remove from local state to update UI instantly
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      } else {
        alert("Failed to delete photo.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("An error occurred while deleting.");
    }
  };

  // Handle Download All as ZIP
  const handleDownloadAll = async () => {
    if (photos.length === 0) return;
    setDownloading(true);
    const zip = new JSZip();
    const imgFolder = zip.folder("event-photos");

    try {
      // Fetch each image and add to ZIP
      const fetchPromises = photos.map(async (photo, index) => {
        const response = await fetch(photo.image_url);
        const blob = await response.blob();
        const extension = photo.image_url.split(".").pop() || "jpg";
        imgFolder?.file(`photo-${index + 1}.${extension}`, blob);
      });

      await Promise.all(fetchPromises);

      // Generate and save the ZIP file
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "event-gallery.zip");
    } catch (err) {
      console.error("ZIP download error:", err);
      alert("Failed to download gallery.");
    } finally {
      setDownloading(false);
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Host Dashboard</h1>
            <p className="text-gray-500">
              Manage and download your event photos
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
            <button
              onClick={handleDownloadAll}
              disabled={downloading || photos.length === 0}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloading ? "Zipping..." : "Download All (ZIP)"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 flex items-center gap-4 border border-gray-100">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Camera className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Total Photos
            </h2>
            <p className="text-3xl font-bold text-gray-900">{photos.length}</p>
          </div>
        </div>

        {/* Photo Grid */}
        {photos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No photos yet
            </h2>
            <p className="text-gray-500">
              Photos uploaded by guests will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative group aspect-square bg-gray-200 rounded-xl overflow-hidden shadow-sm border border-gray-100"
              >
                <Image
                  src={getOptimizedUrl(photo.image_url)}
                  alt={photo.guest_name}
                  fill
                  className="object-cover"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-3">
                  <div className="text-white text-xs">
                    <p className="font-bold truncate">
                      {photo.events?.title || "Unknown Event"}
                    </p>
                    <p className="truncate opacity-80">
                      By: {photo.guest_name || "Anonymous"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={photo.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-500 text-white text-xs py-2 rounded flex items-center justify-center gap-1 hover:bg-blue-600 transition"
                    >
                      <Download className="w-3 h-3" /> View
                    </a>
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="flex-1 bg-red-500 text-white text-xs py-2 rounded flex items-center justify-center gap-1 hover:bg-red-600 transition"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
