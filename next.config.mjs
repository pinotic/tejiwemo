/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
    // driver Postgres dimuat langsung dari node_modules saat runtime, tidak dibundel webpack
    serverComponentsExternalPackages: ["postgres", "bcryptjs"],
  },
  poweredByHeader: false,
};

export default nextConfig;
