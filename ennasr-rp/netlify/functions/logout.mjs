import { json, cookieHeader } from "./_lib/auth.mjs";
export default async () => json({ ok: true }, 200, { "set-cookie": cookieHeader("ennasr_session", "", 0) });
export const config = { path: "/api/logout" };
