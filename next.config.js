/** @type {import('next').NextConfig} */
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const mapboxToken =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  process.env.MAPBOX_ACCESS_TOKEN ||
  process.env.MAPBOX_TOKEN ||
  process.env.MAPBOX_API_KEY ||
  "";

const nextConfig = {
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: mapboxToken,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
