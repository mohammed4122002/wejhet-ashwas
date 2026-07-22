import { createClient } from "@/lib/supabase/client";
import { getDB } from "./dexie";
import type { Table } from "dexie";

/**
 * ترطيب (hydration) التخزين المحلي من الخادم.
 * يُسحب صفوف المستخدم من Supabase ويُدمجها بـ Dexie عند توفّر الاتصال.
 *
 * قواعد الدمج (تحمي الكتابات المحلية غير المتزامنة):
 * - أي سجل عنده عنصر معلّق بطابور المزامنة ⇒ لا يُلمس (النسخة المحلية أحدث).
 * - للجداول ذات updated_at ⇒ "آخر تعديل يفوز" (يُكتب الخادم فقط إذا كان أحدث/مساوٍ).
 * - غير ذلك ⇒ الخادم يُكتب (مصدر الحقيقة للسجلات غير المعدّلة محلياً).
 */
export async function hydrateFromServer(userId: string): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const supabase = createClient();
  const db = getDB();

  const [slots, tasks, exams, doubts, pomodoro, subjects, units, lessons] =
    await Promise.all([
      supabase.from("schedule_slots").select("*").eq("user_id", userId),
      supabase.from("tasks").select("*").eq("user_id", userId),
      supabase.from("exam_schedule").select("*").eq("user_id", userId),
      supabase.from("doubt_box_entries").select("*").eq("user_id", userId),
      supabase.from("pomodoro_sessions").select("*").eq("user_id", userId),
      // المنهج قراءة عامة (لا فلترة مستخدم) — يُخزّن للعمل بدون نت
      supabase.from("subjects").select("*"),
      supabase.from("units").select("*"),
      supabase.from("lessons").select("*"),
    ]);

  // قائمة اختبارات المحاكاة (بيانات وصفية صغيرة) — الأسئلة تُحمَّل عند الطلب
  const mockExams = await supabase.from("mock_exams").select("*");
  const mockAttempts = await supabase
    .from("mock_exam_attempts")
    .select("*")
    .eq("user_id", userId);

  // التفضيلات (الملف الشخصي + إعدادات التذكير) — صف واحد لكل مستخدم
  const profile = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  const reminders = await supabase
    .from("reminder_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // معرّفات معلّقة بالطابور — لا نكتب فوقها
  const pendingIds = new Set(
    (await db.sync_queue.toArray()).map((i) => i.recordId)
  );

  async function mergePut<T extends { id: string; updated_at?: string | null }>(
    table: Table<T, string>,
    rows: T[] | null,
    hasUpdatedAt: boolean
  ) {
    if (!rows?.length) return;
    for (const row of rows) {
      if (pendingIds.has(row.id)) continue; // كتابة محلية معلّقة — احتفظ فيها
      if (hasUpdatedAt) {
        const local = await table.get(row.id);
        if (local && (local.updated_at ?? "") > (row.updated_at ?? "")) continue;
      }
      await table.put(row);
    }
  }

  /**
   * استبدال كامل لجدول مرجعي (منهج للقراءة فقط، لا تعديل محلي عليه):
   * يكتب صفوف الخادم، ثم يحذف أي صفّ محلي لم يعد موجوداً بالخادم (منهج قديم
   * تغيّر اسمه أو أُعيد بناؤه) — يمنع تراكم صفوف يتيمة تظهر كتكرار بالواجهة.
   * لا يلمس شيئاً لو رجعت القائمة فارغة (حماية من مسح الكاش عند خطأ مؤقّت).
   */
  async function replaceRefTable<T extends { id: string }>(
    table: Table<T, string>,
    rows: T[] | null
  ) {
    if (!rows?.length) return;
    await table.bulkPut(rows);
    const currentIds = new Set(rows.map((r) => r.id));
    const staleIds = (await table.toArray())
      .map((r) => r.id)
      .filter((id) => !currentIds.has(id));
    if (staleIds.length) await table.bulkDelete(staleIds);
  }

  await mergePut(db.schedule_slots, slots.data, true);
  await mergePut(db.tasks, tasks.data, true);
  await mergePut(db.exam_schedule, exams.data, false);
  await mergePut(db.doubt_box_entries, doubts.data, false);
  await mergePut(db.pomodoro_sessions, pomodoro.data, false);

  // المنهج: استبدال كامل (بيانات مرجعية للقراءة فقط، لا تعارض محلي) —
  // يحذف صفوف المنهج القديمة اليتيمة بعد أي إعادة بناء للمنهج بالخادم.
  await replaceRefTable(db.subjects, subjects.data);
  await replaceRefTable(db.units, units.data);
  await replaceRefTable(db.lessons, lessons.data);
  if (mockExams.data?.length) await db.mock_exams.bulkPut(mockExams.data);
  await mergePut(db.mock_exam_attempts, mockAttempts.data, false);

  // التفضيلات: لا نكتب فوق تغيير محلي معلّق (recordId = userId)
  if (profile.data && !pendingIds.has(userId)) {
    await db.profiles.put(profile.data);
  }
  if (reminders.data && !pendingIds.has(userId)) {
    await db.reminder_settings.put(reminders.data);
  }
}
