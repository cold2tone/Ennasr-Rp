import { requireSession, json } from "./_lib/auth.mjs";
export default async (req) => {
  const session = requireSession(req);
  if (!session) return json({ user: null }, 200);
  return json({ user: { username: session.u, displayName: session.n } });
};
export const config = { path: "/api/me" };
