import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 👇 Add this new property here
  allowedDevOrigins: ['pamperer-paragraph-vocalist.ngrok-free.dev'],
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;