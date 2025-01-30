/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '**',
      },
    ],
  },

  webpack: (config, { isServer }) => {
    // Ignore the warnings from these modules
    config.ignoreWarnings = [
      { module: /node_modules\/@opentelemetry/ },
      { module: /node_modules\/prisma-instrumentation-5-x/ },
      { module: /node_modules\/require-in-the-middle/ }
    ];
    return config;
  },

  //
  rewrites: async () => {
    return [
      {
        source: "/api/py/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/py/:path*"
            : "/api/",
      },
    {
        source: "/docs",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/py/docs"
            : "/api/py/docs",
      },
      {
        source: "/openapi.json",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/py/openapi.json"
            : "/api/py/openapi.json",
      },
    ];
  },
};

module.exports = nextConfig;
