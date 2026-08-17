import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: [
    "@prisma/adapter-pg",
    "@prisma/client",
    "better-auth",
    "pg",
  ],
  transpilePackages: ["@asignaciones/shared"],
};

export default nextConfig;
