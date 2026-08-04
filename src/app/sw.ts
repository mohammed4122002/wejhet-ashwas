/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Service Worker للتطبيق (Serwist).
 * يخزّن أصول التطبيق (JS/CSS/الخطوط/الشعار) ليفتح بدون نت بعد أول زيارة،
 * مع تخزين وقت التشغيل الافتراضي لبقية الطلبات.
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

/**
 * استقبال Web Push من الخادم (كبسولة الزمن) — يعمل حتى لو التطبيق مسكّر
 * تماماً، لأن هذا الحدث يُطلق على الـ Service Worker نفسه لا صفحة مفتوحة.
 */
self.addEventListener("push", (event: PushEvent) => {
  let data: { title?: string; body?: string; url?: string } = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    /* حمولة نصية بسيطة أو فارغة — نتجاهل ونستخدم القيم الافتراضية */
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? "وجهة أشوس", {
      body: data.body ?? "",
      icon: "/brand/icon-192.png",
      badge: "/brand/icon-192.png",
      dir: "rtl",
      lang: "ar",
      data: { url: data.url ?? "/app" },
    })
  );
});

/** نقرة الإشعار تفتح/تُركّز نافذة التطبيق على الرابط المرفق بالإشعار. */
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl = (event.notification.data as { url?: string } | undefined)
    ?.url ?? "/app";

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clientsList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })()
  );
});
