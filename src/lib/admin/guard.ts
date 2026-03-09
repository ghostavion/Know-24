import { auth } from "@clerk/nextjs/server";

export async function requireAdmin(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHORIZED");

  const adminIds = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!adminIds.includes(userId)) throw new Error("FORBIDDEN");

  return userId;
}
