/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  serverExternalPackages: [
    "@google/genai",
    "isomorphic-dompurify",
    "express",
    "razorpay",
    "stripe",
    "cookie-parser",
    "qrcode",
    "otpauth",
  ],
  experimental: {
    serverMinification: false,
  },
};

export default nextConfig;
