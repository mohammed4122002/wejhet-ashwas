import type { Database } from "@/lib/supabase/database.types";
import { getDB, type SyncOp, type SyncQueueItem } from "./dexie";

type Tables = Database["public"]["Tables"];

/** أسماء الجداول المحلية اللي عندها مرآة في Dexie. */
type LocalMirrorTable =
  | "tasks"
  | "schedule_slots"
  | "pomodoro_sessions"
  | "question_attempts"
  | "doubt_box_entries"
  | "reward_events"
  | "exam_schedule"
  | "mock_exam_attempts";

/** يضيف عملية لطابور المزامنة (بدون رفع فوري — المحرّك يتكفّل). */
export async function enqueue(
  table: keyof Tables,
  op: SyncOp,
  recordId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const db = getDB();
  const item: SyncQueueItem = {
    table,
    op,
    recordId,
    payload,
    createdAt: Date.now(),
    attempts: 0,
  };
  await db.sync_queue.add(item);
}

/**
 * كتابة local-first: تكتب السجل بجدول Dexie المحلي فوراً (تُعرض بالواجهة مباشرة)
 * وتضيفه لطابور المزامنة ليُرفع لـ Supabase بالخلفية.
 *
 * الاستخدام لكل ميزة محلية (مهمة جديدة، تغيير حالة، محاولة سؤال، شك جديد...).
 */
export async function localUpsert<T extends LocalMirrorTable>(
  table: T,
  record: Tables[T]["Row"] & { id: string }
): Promise<void> {
  const db = getDB();
  // upsert محلي فوري
  await (db[table] as unknown as {
    put: (r: Tables[T]["Row"]) => Promise<string>;
  }).put(record);
  // upsert للخادم لاحقاً (آخر تعديل يفوز عبر updated_at بالسجل نفسه)
  await enqueue(table, "upsert", record.id, record as Record<string, unknown>);
}

/** حذف local-first: يحذف محلياً فوراً ويجدول الحذف على الخادم. */
export async function localDelete<T extends LocalMirrorTable>(
  table: T,
  id: string
): Promise<void> {
  const db = getDB();
  await (db[table] as unknown as {
    delete: (id: string) => Promise<void>;
  }).delete(id);
  await enqueue(table, "delete", id, { id });
}

/** عدد العناصر المعلّقة بالطابور (لعرض مؤشّر "بانتظار المزامنة"). */
export async function pendingCount(): Promise<number> {
  const db = getDB();
  return db.sync_queue.count();
}
