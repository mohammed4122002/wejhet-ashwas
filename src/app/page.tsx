import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** جذر الموقع: يوجّه المستخدم حسب حالة الجلسة. */
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/app" : "/login");
}
