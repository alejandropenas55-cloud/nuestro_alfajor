/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // La página nació como /mayoristas y el link llegó a circular. Se
      // mantiene apuntando al nombre definitivo para no romper nada.
      { source: "/mayoristas", destination: "/mayorista", permanent: true },
    ];
  },
};

module.exports = nextConfig;
