"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteURL } from "@/lib/site-url";

export interface AuthState {
  error?: string;
  message?: string;
}

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

/** تسجيل حساب جديد بالبريد وكلمة المرور (خطة §أ.1). */
export async function signupAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "البريد الإلكتروني وكلمة المرور مطلوبان." };
  }
  if (password.length < 6) {
    return { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." };
  }

  const supabase = await createClient();
  const siteURL = await getSiteURL();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${siteURL}/auth/callback?next=/onboarding/track` },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  // لو تفعيل تأكيد البريد مطلوب، لا تُنشأ جلسة فوراً.
  if (!data.session) {
    return {
      message:
        "تم إنشاء حسابك! تفقّد بريدك الإلكتروني وأكّد الحساب لإكمال التسجيل.",
    };
  }

  // جلسة فعّالة مباشرة ← لصفحة اختيار الفرع الإجبارية.
  redirect("/onboarding/track");
}

/** تسجيل الدخول (خطة §أ.1). */
export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  const next = String(formData.get("next") ?? "/app");
  if (!email || !password) {
    return { error: "البريد الإلكتروني وكلمة المرور مطلوبان." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: translateAuthError(error.message) };
  }

  // middleware يوجّه لاختيار الفرع لو لسا ما اختاره الطالب.
  redirect(next.startsWith("/") ? next : "/app");
}

/** تسجيل الخروج (خطة §أ.1). */
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** طلب رابط استعادة كلمة المرور (خطة §أ.1 — Supabase Auth المدمج). */
export async function requestResetAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "أدخل بريدك الإلكتروني." };

  const supabase = await createClient();
  const siteURL = await getSiteURL();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteURL}/auth/callback?next=/reset-password`,
  });
  if (error) {
    return { error: translateAuthError(error.message) };
  }
  return {
    message:
      "إذا كان البريد مسجّلاً لدينا، رح يوصلك رابط لإعادة تعيين كلمة المرور.",
  };
}

/** تعيين كلمة مرور جديدة (بعد الوصول من رابط الاستعادة). */
export async function updatePasswordAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) {
    return { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "انتهت صلاحية جلسة الاستعادة. اطلب رابطاً جديداً." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: translateAuthError(error.message) };
  }
  redirect("/app");
}

/** ترجمة رسائل أخطاء Supabase الشائعة للعربية. */
function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  }
  if (m.includes("user already registered")) {
    return "هذا البريد مسجّل مسبقاً. جرّب تسجيل الدخول.";
  }
  if (m.includes("email not confirmed")) {
    return "لازم تأكّد بريدك الإلكتروني أولاً.";
  }
  if (m.includes("password")) {
    return "كلمة المرور لا تحقّق الشروط المطلوبة.";
  }
  return "صار خطأ غير متوقّع. حاول مرة ثانية.";
}
