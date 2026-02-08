import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // register: true, // default is true
  // skipWaiting: true, // default is true
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ["postscholastic-periscopic-matias.ngrok-free.dev"],
    },
  },
  allowedDevOrigins: ["postscholastic-periscopic-matias.ngrok-free.dev"],
};

export default withPWA(nextConfig);
