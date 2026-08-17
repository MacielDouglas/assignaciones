import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["@prisma/client", "better-auth"],
  transpilePackages: ["@asignaciones/shared"],
};

export default nextConfig;
