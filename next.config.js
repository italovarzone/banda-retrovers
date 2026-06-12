/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    localPatterns: [
      { pathname: '/api/images/by-name', search: '**' },
      { pathname: '/api/images/**' },
      { pathname: '/images/**' },
    ],
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  }
};

export default nextConfig;
