import { getStore } from "@netlify/blobs";
import { json } from "./_lib/auth.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass || req.headers.get("x-admin-password") !== pass) return json({ error: "Wrong password" }, 401);

  const { username } = await req.json().catch(() => ({}));
  if (!username) return json({ error: "Username required" }, 400);

  await Promise.all([
    getStore("availability").delete(username),
    getStore("users").delete(username)
  ]);
  return json({ ok: true });
};

export const config = { path: "/api/remove" };
