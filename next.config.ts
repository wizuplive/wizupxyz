import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      {source: '/studio', destination: '/app', permanent: false},
      {source: '/studio/radar/:path*', destination: '/app/ideas/:path*', permanent: false},
      {source: '/studio/dna/:path*', destination: '/app/examples/:path*', permanent: false},
      {source: '/studio/forge/:path*', destination: '/app/product/:path*', permanent: false},
      {source: '/studio/launch/:path*', destination: '/app/sales-kit/:path*', permanent: false},
      {source: '/studio/storefront/:path*', destination: '/app/store/:path*', permanent: false},
      {source: '/studio/vault/:path*', destination: '/app/saved/:path*', permanent: false},
      {source: '/studio/kratos/:path*', destination: '/app/ai-team/:path*', permanent: false},
      {source: '/studio/profile/:path*', destination: '/app/profile/:path*', permanent: false},
      {source: '/studio/billing/:path*', destination: '/app/billing/:path*', permanent: false},
      {source: '/studio/settings/:path*', destination: '/app/settings/:path*', permanent: false},
      {source: '/studio/help/:path*', destination: '/app/help/:path*', permanent: false},
    ];
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  output: 'standalone',
  outputFileTracingRoot: __dirname,
  transpilePackages: ['motion', '@base-ui/react'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
