/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/admin/login',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig
