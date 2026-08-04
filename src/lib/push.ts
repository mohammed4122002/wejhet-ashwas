/**
 * اشتراك Web Push حقيقي عبر Service Worker — يوصل للطالب حتى لو التطبيق
 * مسكّر تماماً (يُستخدم لتنبيه فتح كبسولة الزمن).
 */

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/**
 * يطلب إذن الإشعارات (يجب استدعاؤها من ردّ فعل مستخدم مباشر — نقرة زر)،
 * ثم يشترك بـ Push ويرفع بيانات الاشتراك للخادم. لا يرمي خطأ عند الرفض،
 * فقط يعيد false حتى لا تنكسر تجربة كتابة الرسالة بسبب رفض الإشعارات.
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!pushSupported()) return false;
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
