import { getStore } from "@netlify/blobs";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass || req.headers.get("x-admin-password") !== pass) return json({ error: "Wrong password" }, 401);

  const { name } = await req.json().catch(() => ({}));
  if (!name) return json({ error: "Name required" }, 400);
  const key = String(name).toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, "-");
  await getStore("availability").delete(key);
  return json({ ok: true });
};

export const config = { path: "/api/remove" };
