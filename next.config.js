/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd3e5wuq2fomqsd.cloudfront.net',
        pathname: '/previews/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5002',
        pathname: '/api/**',
      }
    ],
  },
}

module.exports = nextConfig 