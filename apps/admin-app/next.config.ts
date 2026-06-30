import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@kclub/database', 'pino', 'pino-pretty'],
  experimental: {
    optimizePackageImports: ['lucide-react', '@base-ui/react'],
  },
};

export default nextConfig;
