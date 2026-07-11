/**
 * توليد "قائمة اليوم" (خطة §أ.3) — دالة نقية offline.
 * تُبنى مهام اليوم من فترات الجدول المطابقة ليوم الأسبوع الحالي،
 * بدون تكرار لو المهمة موجودة أصلاً لنفس اليوم/الفترة.
 */

import type { Database } from "@/lib/supabase/database.types";

type Slot = Database["public"]["Tables"]["schedule_slots"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];

/** بيانات مهمة جديدة مقترحة لليوم (بدون id/user — يملؤها المستودع). */
export interface NewTodayTask {
  schedule_slot_id: string;
  subject_id: string | null;
  lesson_id: string | null;
  title: string;
  task_date: string;
  task_type: "study";
}

/**
 * يُرجّع المهام الواجب إنشاؤها لليوم من الفترات المطابقة ليوم الأسبوع،
 * مستثنياً الفترات اللي إلها مهمة أصلاً بنفس التاريخ.
 */
export function tasksToCreateForDay(
  slots: Slot[],
  existingTasksForDate: Task[],
  dayOfWeek: number,
  dateISO: string
): NewTodayTask[] {
  const alreadyHasTask = new Set(
    existingTasksForDate
      .filter((t) => t.task_date === dateISO && t.schedule_slot_id)
      .map((t) => t.schedule_slot_id as string)
  );

  return slots
    .filter((s) => s.day_of_week === dayOfWeek)
    .filter((s) => !alreadyHasTask.has(s.id))
    .map((s) => ({
      schedule_slot_id: s.id,
      subject_id: s.subject_id,
      lesson_id: null,
      title: s.title,
      task_date: dateISO,
      task_type: "study" as const,
    }));
}

/** المهام المتراكمة من أيام سابقة وغير المكتملة (خطة §أ.3). */
export function carryOverTasks(allTasks: Task[], todayISOstr: string): Task[] {
  return allTasks
    .filter((t) => t.task_date < todayISOstr && t.status !== "done")
    .sort((a, b) => (a.task_date < b.task_date ? 1 : -1));
}
