import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "@/lib/db";

const appScheme = "asignaciones://";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  plugins: [expo()],
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID ?? "",
      clientSecret: process.env.APPLE_CLIENT_SECRET ?? "",
    },
  },
  trustedOrigins: [
    appScheme,
    process.env.BETTER_AUTH_URL ?? "",
    ...(process.env.NODE_ENV === "development"
      ? ["http://localhost:8081", "exp://", "exp://**"]
      : []),
  ],
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-vercel-forwarded-for"],
      trustedProxies: ["76.76.21.0/24", "13.248.128.0/17", "15.197.128.0/17"],
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
});
