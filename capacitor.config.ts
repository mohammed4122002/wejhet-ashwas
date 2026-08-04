import type { CapacitorConfig } from "@capacitor/cli";

/**
 * غلاف أندرويد لنفس تطبيق الويب — "remote mode": الـ WebView يفتح الموقع
 * الحي مباشرة (Vercel)، فلا حاجة لتصدير ثابت ولا نسخ من الكود. أي تحديث
 * يُنشر على الموقع ينعكس على التطبيق فوراً بدون إعادة بناء APK.
 */
const config: CapacitorConfig = {
  appId: "com.wejhetashwas.app",
  appName: "وجهة أشوس",
  webDir: "public", // غير مُستخدَم فعلياً بوضع remote، لكن Capacitor يتطلّبه
  server: {
    url: "https://wejhet-ashwas.vercel.app",
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
