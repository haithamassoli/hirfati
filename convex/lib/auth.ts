import { ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = Pick<QueryCtx, "auth" | "db"> | Pick<MutationCtx, "auth" | "db">;

export async function getOptionalAuthUser(
  ctx: AuthCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email) {
    return null;
  }
  const email = identity.email;

  return await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();
}

export async function requireAuthUser(ctx: AuthCtx): Promise<Doc<"users">> {
  const user = await getOptionalAuthUser(ctx);
  if (!user) {
    throw new ConvexError("غير مصرح");
  }
  return user;
}
