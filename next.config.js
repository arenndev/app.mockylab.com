/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    serverActions: true
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.mockylab.com'
  },
  async rewrites() {
    return []
  },
  images: {
    domains: ['images.printify.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd3e5wuq2fomqsd.cloudfront.net',
        pathname: '/previews/**',
      },
      {
        protocol: 'https',
        hostname: 'd3l4q0oig1v782.cloudfront.net',
        pathname: '/**',
      }
    ]
  },
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/:path*',
          headers: [
            { key: 'Access-Control-Allow-Credentials', value: 'true' },
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
            { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
          ],
        },
      ];
    }
    return [];
  },
}

module.exports = nextConfig 