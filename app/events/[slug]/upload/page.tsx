"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GuestUpload() {
  const router = useRouter();
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // TODO: Add your actual Supabase upload code here
      // For now, simulating upload
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
    // Get the current URL (e.g., /events/my-event/upload)
    const currentPath = window.location.pathname;

    // Split it to get the event name (e.g., "my-event")
    const parts = currentPath.split("/");
    const slug = parts[2];

    // Navigate directly to the gallery
    router.push(`/events/${slug}`);
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
            className={`inline-block w-full py-4 px-6 text-lg font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer ${
              isUploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:scale-[1.02]"
            }`}
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Uploading...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Choose Photos from Device
              </span>
            )}
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
