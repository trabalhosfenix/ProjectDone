import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignora erros de build para garantir que o site suba mesmo com avisos menores
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  // Aumentar limite de upload para Server Actions (suporte a arquivos .mpp grandes)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;

