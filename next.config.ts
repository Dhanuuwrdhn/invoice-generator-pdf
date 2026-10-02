import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // postgres must stay a real package in standalone: scripts/create-user.mjs imports it directly.
  serverExternalPackages: ['@react-pdf/renderer', 'postgres'],
};

export default nextConfig;
