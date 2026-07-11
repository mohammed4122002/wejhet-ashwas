import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * كل المسارات ما عدا:
     * - _next/static, _next/image
     * - favicon و أصول الشعار و manifest و service worker
     * - ملفات الصور
     */
    "/((?!_next/static|_next/image|favicon.ico|brand/|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
