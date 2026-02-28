import { betterAuth } from "better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { convexAdapter, type GenericCtx } from "@convex-dev/better-auth";
import type { DataModel } from "./_generated/dataModel";
import { components } from "./_generated/api";
import authConfig from "./auth.config";

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    database: convexAdapter(ctx as any, components.betterAuth as any),
    emailAndPassword: {
      enabled: false,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    plugins: [convex({ authConfig })],
  });
};
