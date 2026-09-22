import { getStore } from "@netlify/blobs";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export default async (req) => {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return json({ error: "ADMIN_PASSWORD is not set on Netlify" }, 500);

  const sent = req.headers.get("x-admin-password") || "";
  if (sent !== pass) return json({ error: "Wrong password" }, 401);

  const store = getStore("availability");
  const { blobs } = await store.list();
  const staff = (await Promise.all(blobs.map(b => store.get(b.key, { type: "json" })))).filter(Boolean);
  staff.sort((a, b) => a.name.localeCompare(b.name));
  return json({ staff });
};

export const config = { path: "/api/availability" };
