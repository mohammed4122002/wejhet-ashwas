/**
 * إشعارات المتصفّح (خطة §أ.8) — طبقة بسيطة فوق Notification API.
 *
 * ملاحظة: هذا يعرض إشعارات محلية بينما التطبيق مفتوح. الإشعارات الدفعية
 * الحقيقية (Web Push عبر Service Worker وهي مغلقة) تعتمد على Service Worker
 * المُجهّز بالجلسة 5 (Serwist) — تُبنى فوق هذه الطبقة لاحقاً.
 */

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

/** يطلب إذن الإشعارات من المستخدم. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/** يعرض إشعاراً محلياً إذا كان الإذن ممنوحاً. */
export function showNotification(title: string, body: string): void {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/brand/logo.svg", lang: "ar", dir: "rtl" });
  } catch {
    /* بعض المتصفّحات تتطلّب Service Worker للإشعارات — نتجاهل بهدوء */
  }
}
