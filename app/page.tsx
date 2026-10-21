"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function GuestUpload() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [showNameInput, setShowNameInput] = useState(true);

  const handleNameSubmit = () => {
    if (guestName.trim()) {
      // Store guest name for later use
      sessionStorage.setItem("guestName", guestName.trim());
      setShowNameInput(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // TODO: Replace with your actual Supabase upload logic
      // const { data, error } = await supabase.storage.from('photos').upload(...)

      // Simulating upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setUploadSuccess(true);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadMore = () => {
    setUploadSuccess(false);
  };

  const handleViewGallery = () => {
    router.push(`/events/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      {showNameInput ? (
        <div className="text-center max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome!</h2>
          <p className="text-gray-600 mb-4">
            Please enter your name to continue:
          </p>
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Your Name"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleNameSubmit}
            disabled={!guestName.trim()}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      ) : uploadSuccess ? (
        <div className="text-center max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            ✅ Photos Uploaded Successfully!
          </h2>
          <p className="text-gray-600 mb-8">What would you like to do next?</p>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleViewGallery}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md text-lg"
            >
              View Gallery
            </button>

            <button
              onClick={handleUploadMore}
              className="w-full py-4 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition text-lg"
            >
              Upload More
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Upload Your Photos
          </h2>

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
            className={`inline-block w-full py-4 px-6 text-lg font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer ${
              isUploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:scale-[1.02]"
            }`}
          >
            {isUploading ? "Uploading..." : "📸 Choose Photos from Device"}
          </label>

          {isUploading && (
            <p className="text-blue-600 mt-4 font-medium animate-pulse">
              Processing your photos...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
