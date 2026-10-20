"use client"; // REQUIRED in Next.js for useState and onClick events

import { useState } from "react";
import { useRouter } from "next/navigation"; // Next.js router instead of react-router-dom

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
      // TODO: Replace this with your actual API call to upload the photo
      // await uploadPhotoToAPI(file);

      // Simulating a short delay for the upload
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // SUCCESS: Show the success screen
      setUploadSuccess(true);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadMore = () => {
    setUploadSuccess(false); // Resets the screen back to the file input
  };

  const handleViewGallery = () => {
    // Navigate to your gallery page (adjust the path if your gallery is inside the 'eventy' folder)
    router.push("/eventy/gallery");
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      {uploadSuccess ? (
        <div>
          <h2 style={{ color: "green" }}>✅ Photos Uploaded Successfully!</h2>
          <p>What would you like to do next?</p>

          <div
            style={{
              display: "flex",
              gap: "15px",
              justifyContent: "center",
              marginTop: "20px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={handleViewGallery}
              style={{
                padding: "10px 20px",
                backgroundColor: "#007BFF",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              View Gallery
            </button>

            <button
              onClick={handleUploadMore}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Upload More
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h2>Upload Your Photos</h2>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={isUploading}
            style={{ marginTop: "10px" }}
          />
          {isUploading && (
            <p style={{ color: "#007BFF", marginTop: "10px" }}>Uploading...</p>
          )}
        </div>
      )}
    </div>
  );
}
