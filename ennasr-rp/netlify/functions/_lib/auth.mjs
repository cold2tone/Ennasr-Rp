import crypto from "node:crypto";

// --- password hashing (scrypt, salted, no plaintext ever stored) ---
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt);
  return `${salt}:${hash}`;
}
export async function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const check = await scrypt(password, salt);
  const a = Buffer.from(hash, "hex"), b = Buffer.from(check, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function scrypt(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => err ? reject(err) : resolve(key.toString("hex")));
  });
}

// --- signed session cookie (HMAC, no server-side session store needed) ---
function secret() {
  const s = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("SESSION_SECRET (or ADMIN_PASSWORD) is not set on Netlify");
  return s;
}
export function signSession(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}
export function verifySession(token) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { return JSON.parse(Buffer.from(body, "base64url").toString()); } catch { return null; }
}
export function cookieHeader(name, value, days = 30) {
  const parts = [`${name}=${value}`, "Path=/", "HttpOnly", "Secure", "SameSite=Lax"];
  if (days) parts.push(`Max-Age=${days * 86400}`); else parts.push("Max-Age=0");
  return parts.join("; ");
}
export function readCookie(req, name) {
  const raw = req.headers.get("cookie") || "";
  const m = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? m[1] : null;
}
export function requireSession(req) {
  const token = readCookie(req, "ennasr_session");
  return verifySession(token);
}

export const json = (body, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...extraHeaders } });

export function normUsername(u) {
  return String(u || "").trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 30);
}
