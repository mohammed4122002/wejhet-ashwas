import { createClient } from "@/lib/supabase/client";
import { getDB, type SyncQueueItem } from "./dexie";

/**
 * محرّك المزامنة (خطة §ب.5 بند 3):
 * يرفع كل عنصر بطابور Dexie لـ Supabase أول ما يتوفّر اتصال، ويحذفه بعد النجاح.
 *
 * استراتيجية التعارض: "آخر تعديل يفوز" — كافية لأن البيانات شخصية لطالب واحد
 * (خطة §ب.5 بند 4). نعتمد upsert على المفتاح id.
 */

const MAX_ATTEMPTS = 8; // بعدها نوقف المحاولة التلقائية ونترك العنصر بالطابور مع الخطأ
const RETRY_INTERVAL_MS = 30_000; // إعادة محاولة دورية للطابور

/** عمود التعارض عند الـupsert لكل جدول (افتراضياً id). */
const CONFLICT_COLUMN: Partial<Record<string, string>> = {
  reminder_settings: "user_id",
};

let isFlushing = false;

/** يرفع عنصر واحد؛ يعيد true عند النجاح. */
async function pushItem(item: SyncQueueItem): Promise<boolean> {
  const supabase = createClient();

  // اسم الجدول ديناميكي (يأتي من الطابور) — نتعامل معه كواجهة فضفاضة
  // لأن الأنواع المولّدة لا تعرف الجدول المحدّد وقت الترجمة.
  const table = supabase.from(item.table) as unknown as {
    delete: () => {
      eq: (col: string, val: string) => Promise<{ error: unknown }>;
    };
    upsert: (
      values: Record<string, unknown>,
      options: { onConflict: string }
    ) => Promise<{ error: unknown }>;
  };

  const conflictCol = CONFLICT_COLUMN[item.table] ?? "id";

  try {
    if (item.op === "delete") {
      const { error } = await table.delete().eq(conflictCol, item.recordId);
      if (error) throw error;
      return true;
    }

    // insert / update / upsert ← upsert على عمود التعارض (آخر تعديل يفوز)
    const { error } = await table.upsert(item.payload, {
      onConflict: conflictCol,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    // خطأ شبكة/خادم — نتركه للطابور ليُعاد لاحقاً
    console.warn("[sync] فشل رفع عنصر:", item.table, item.op, err);
    return false;
  }
}

/** يمرّ على الطابور (الأقدم أولاً) ويرفع ما أمكن. */
export async function flushQueue(): Promise<void> {
  if (isFlushing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  isFlushing = true;
  try {
    const db = getDB();

    // نتأكّد من وجود جلسة قبل الرفع (RLS يحتاج مستخدم مصادق)
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return; // بدون جلسة نؤجّل — البيانات محفوظة محلياً بأمان

    const items = await db.sync_queue.orderBy("createdAt").toArray();
    for (const item of items) {
      if (item.attempts >= MAX_ATTEMPTS) continue;

      const ok = await pushItem(item);
      if (ok) {
        await db.sync_queue.delete(item.id!);
      } else {
        await db.sync_queue.update(item.id!, {
          attempts: item.attempts + 1,
          lastError: "push failed",
        });
        // نتوقّف عن هالجولة لو صار خطأ (غالباً انقطع الاتصال)
        break;
      }
    }
  } finally {
    isFlushing = false;
  }
}

/**
 * يشغّل محرّك المزامنة: يستمع لعودة الاتصال + يعيد المحاولة دورياً.
 * يُستدعى مرة من مزوّد العميل (Providers). يعيد دالة إيقاف للتنظيف.
 */
export function startSyncEngine(): () => void {
  if (typeof window === "undefined") return () => {};

  const onOnline = () => void flushQueue();
  window.addEventListener("online", onOnline);

  // محاولة أولى عند الإقلاع + محاولة دورية
  void flushQueue();
  const interval = window.setInterval(() => void flushQueue(), RETRY_INTERVAL_MS);

  return () => {
    window.removeEventListener("online", onOnline);
    window.clearInterval(interval);
  };
}
