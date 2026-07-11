import { headers } from "next/headers";

/**
 * أصل الموقع (origin) للاستخدام بروابط رجوع المصادقة.
 * يفضّل NEXT_PUBLIC_SITE_URL، وإلا يبنيه من ترويسات الطلب (بيئة التطوير/Vercel).
 */
export async function getSiteURL(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
