import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * عميل Supabase للخادم (Server Components / Server Actions / Route Handlers).
 * يدير الجلسة عبر الكوكيز بالتزامن مع المتصفّح (@supabase/ssr).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // الاستدعاء من Server Component — يمكن تجاهله لأن middleware
            // يتكفّل بتحديث الجلسة على كل طلب.
          }
        },
      },
    }
  );
}
