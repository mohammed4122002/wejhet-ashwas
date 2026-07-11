import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

/** المسارات المحمية — تتطلّب تسجيل دخول (خطة §ب.4). */
const PROTECTED_PREFIXES = ["/app", "/onboarding"];
/** صفحات المصادقة — لو المستخدم مسجّل دخول نوجّهه بعيداً عنها. */
const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];

/**
 * تحديث جلسة Supabase على كل طلب + حماية المسارات.
 * - غير المسجّل يحاول الدخول لمسار محمي ← /login
 * - المسجّل بدون ملف شخصي (لم يختر فرعه) ← /onboarding/track (إجباري)
 * - المسجّل على صفحة مصادقة ← /app
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // ملاحظة: لو متغيّرات البيئة غير مضبوطة (قبل ربط Supabase)، لا نكسر الطلب.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return response;

  const supabase = createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // مهم: getUser() يعيد تحقّق الجلسة مع الخادم (لا نعتمد على getSession وحده).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => path.startsWith(p));

  // غير مسجّل + مسار محمي ← صفحة الدخول
  if (!user && isProtected) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  if (user) {
    // نتحقّق من وجود ملف شخصي فقط ضمن المسارات المحمية (تفادي استعلام على كل طلب)
    if (isProtected) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("track")
        .eq("id", user.id)
        .maybeSingle();

      const hasTrack = !!profile?.track;
      const onOnboarding = path.startsWith("/onboarding");

      // مسجّل بلا فرع ← إجباري يختار فرعه أولاً
      if (!hasTrack && !onOnboarding) {
        const redirect = request.nextUrl.clone();
        redirect.pathname = "/onboarding/track";
        return NextResponse.redirect(redirect);
      }
      // اختار فرعه وحاول يرجع للـonboarding ← وجّهه للتطبيق
      if (hasTrack && onOnboarding) {
        const redirect = request.nextUrl.clone();
        redirect.pathname = "/app";
        return NextResponse.redirect(redirect);
      }
    }

    // مسجّل على صفحة مصادقة ← التطبيق
    if (isAuthPage) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/app";
      return NextResponse.redirect(redirect);
    }
  }

  return response;
}
