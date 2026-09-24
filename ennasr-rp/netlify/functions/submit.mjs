import { getStore } from "@netlify/blobs";
import { requireSession, json } from "./_lib/auth.mjs";

const DAYS = ["mon","tue","wed","thu","fri","sat","sun"];

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const session = requireSession(req);
  if (!session) return json({ error: "Please log in first." }, 401);

  let data;
  try { data = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }

  const avail = {};
  for (const d of DAYS) {
    const arr = Array.isArray(data.availability?.[d]) ? data.availability[d] : [];
    avail[d] = [...new Set(arr.map(Number).filter(h => Number.isInteger(h) && h >= 0 && h <= 23))].sort((a,b)=>a-b);
  }
  const note = String(data.note || "").trim().slice(0, 300);

  const store = getStore("availability");
  await store.setJSON(session.u, {
    username: session.u,
    name: session.n,
    availability: avail,
    note,
    updatedAt: new Date().toISOString()
  });

  const hook = process.env.DISCORD_WEBHOOK_URL;
  if (hook) {
    const label = { mon:"Mon", tue:"Tue", wed:"Wed", thu:"Thu", fri:"Fri", sat:"Sat", sun:"Sun" };
    const ranges = (hrs) => {
      if (!hrs.length) return "busy";
      const out = []; let s = hrs[0], p = hrs[0];
      for (let i = 1; i <= hrs.length; i++) {
        if (hrs[i] !== p + 1) { out.push(s === p ? `${s}:00` : `${s}:00-${p + 1}:00`); s = hrs[i]; }
        p = hrs[i];
      }
      return out.join(", ");
    };
    const lines = DAYS.map(d => `**${label[d]}**: ${ranges(avail[d])}`).join("\n");
    try {
      await fetch(hook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title: `${session.n} updated their availability`,
            description: lines + (note ? `\n\n*${note}*` : ""),
            color: 0xe3242b,
            timestamp: new Date().toISOString()
          }]
        })
      });
    } catch (e) { console.error("discord hook failed", e); }
  }

  return json({ ok: true });
};

export const config = { path: "/api/submit" };
