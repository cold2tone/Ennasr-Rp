import { getStore } from "@netlify/blobs";
import { verifyPassword, signSession, cookieHeader, json, normUsername } from "./_lib/auth.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let data; try { data = await req.json(); } catch { return json({ error: "Bad request" }, 400); }

  const username = normUsername(data.username);
  const password = String(data.password || "");

  const users = getStore("users");
  const user = await users.get(username, { type: "json" });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return json({ error: "Wrong username or password." }, 401);
  }

  const token = signSession({ u: user.username, n: user.displayName });
  return json({ ok: true, username: user.username, displayName: user.displayName }, 200, { "set-cookie": cookieHeader("ennasr_session", token) });
};

export const config = { path: "/api/login" };
