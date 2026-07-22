import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY غير مُعرَّف بمتغيّرات البيئة.");
  }
  return createClient<Database>(url, key);
}

// نفصل على الفواصل والفواصل المنقوطة والمسافات والأسطر الجديدة معاً،
// حتى تعمل القائمة مهما كانت طريقة الإدخال (فاصلة، سطر جديد، أو مزيج).
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(/[\s,;]+/)
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
