import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * نقطة رجوع المصادقة: تبديل رمز PKCE بجلسة فعلية.
 * تُستخدم بعد تأكيد البريد أو رابط استعادة كلمة المرور (Supabase Auth).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  // "next" وجهة الرجوع بعد نجاح تبديل الرمز
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // فشل أو غياب الرمز ← صفحة الدخول مع إشارة خطأ
  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
