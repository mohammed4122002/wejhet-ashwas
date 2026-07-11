import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * عميل Supabase للمتصفّح (Client Components).
 * يقرأ المفاتيح العامة من متغيّرات البيئة NEXT_PUBLIC_*.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
