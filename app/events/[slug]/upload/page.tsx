"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; // Import Supabase

export default function GuestUpload() {
  const router = useRouter();
  const supabase = createClient();
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress("Uploading image...");

    try {
      // 1. Get the current event slug from the URL
      const slug = window.location.pathname.split("/")[2];

      // 2. Find the Event ID in your database (needed to link the photo)
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("id")
        .eq("slug", slug)
        .single();

      if (eventError || !eventData)
        throw new Error("Event not found in database");

      // 3. Upload the file to Supabase Storage
      // IMPORTANT: Change 'photos' to the actual name of your Storage Bucket in Supabase
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${slug}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setUploadProgress("Saving to gallery...");

      // 4. Get the public URL of the uploaded image
      const { data: urlData } = supabase.storage
        .from("photos")
        .getPublicUrl(filePath);
      const imageUrl = urlData.publicUrl;

      // 5. Insert the photo record into your 'photos' database table
      const { error: dbError } = await supabase.from("photos").insert({
        event_id: eventData.id,
        image_url: imageUrl,
        guest_name: "Anonymous Guest", // You can change this if you add a name input
        created_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      // 6. Success!
      setUploadSuccess(true);
    } catch (error: any) {
      console.error("Upload failed:", error);
      alert("Failed to upload photo. Error: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadMore = () => {
    setUploadSuccess(false);
  };

  const handleViewGallery = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-6">
      {uploadSuccess ? (
        <div className="text-center max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-green-600 mb-2">
              Photos Uploaded Successfully!
            </h2>
            <p className="text-gray-600">What would you like to do next?</p>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleViewGallery}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all shadow-lg hover:shadow-xl text-lg"
            >
              View Gallery
            </button>
            <button
              onClick={handleUploadMore}
              className="w-full py-4 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 active:bg-gray-400 transition-all text-lg"
            >
              Upload More
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
          <div className="mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Upload Your Photos
            </h2>
            <p className="text-gray-600">Share your memories with everyone!</p>
          </div>

          <input
            id="guest-file-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />

          <label
            htmlFor="guest-file-upload"
            className={`inline-block w-full py-4 px-6 text-lg font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer ${isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:scale-[1.02]"}`}
          >
            {isUploading ? uploadProgress : "📸 Choose Photos from Device"}
          </label>
        </div>
      )}
    </div>
  );
}
