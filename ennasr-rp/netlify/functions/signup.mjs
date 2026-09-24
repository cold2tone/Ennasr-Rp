import { getStore } from "@netlify/blobs";
import { hashPassword, signSession, cookieHeader, json, normUsername } from "./_lib/auth.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let data; try { data = await req.json(); } catch { return json({ error: "Bad request" }, 400); }

  const username = normUsername(data.username);
  const displayName = String(data.displayName || "").trim().slice(0, 40) || username;
  const password = String(data.password || "");

  if (username.length < 3) return json({ error: "Username must be at least 3 characters (letters, numbers, . _ -)." }, 400);
  if (password.length < 6) return json({ error: "Password must be at least 6 characters." }, 400);

  const users = getStore("users");
  const existing = await users.get(username, { type: "json" });
  if (existing) return json({ error: "That username is taken." }, 409);

  const passwordHash = await hashPassword(password);
  await users.setJSON(username, { username, displayName, passwordHash, createdAt: new Date().toISOString() });

  const token = signSession({ u: username, n: displayName });
  return json({ ok: true, username, displayName }, 200, { "set-cookie": cookieHeader("ennasr_session", token) });
};

export const config = { path: "/api/signup" };
