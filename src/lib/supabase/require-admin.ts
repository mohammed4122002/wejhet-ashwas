import { redirect } from "next/navigation";
import { createClient } from "./server";
import { isAdminEmail } from "./admin";
import type { User } from "@supabase/supabase-js";

/**
 * حارس صفحات لوحة الإدارة: يوجّه غير المسجّلين لتسجيل الدخول، وغير الأدمن
 * لصفحة التطبيق الرئيسية — حتى لا تظهر أي صفحة إدارة لمن لا صلاحية له، لا
 * بس الروابط المخفية بقائمة "المزيد".
 */
export async function requireAdmin(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!user.email || !isAdminEmail(user.email)) redirect("/app");

  return user;
}
