import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Isso libera o acesso para você testar no seu celular via Wi-Fi
  allowedDevOrigins: ["192.168.0.22"],
};

export default nextConfig;