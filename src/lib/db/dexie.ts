import Dexie, { type Table } from "dexie";
import type { Database } from "@/lib/supabase/database.types";

/**
 * التخزين المحلي (IndexedDB عبر Dexie) — أساس فلسفة local-first.
 * (CLAUDE.md قاعدة 4 + خطة §ب.5)
 *
 * كل كتابة لميزة محلية تُكتب هون فوراً وتُعرض بالواجهة قبل أي انتظار للشبكة،
 * ثم تُضاف لـ sync_queue وتُرفع لـ Supabase بالخلفية عند توفّر الاتصال.
 *
 * الجداول المرآتية هون تغطّي الميزات "offline كامل" و"offline بشرط تحميل مسبق"
 * (خطة §ب.5 جدول التصنيف). لوحة الصدارة والتحديات (اتصال دائم) لا تُخزَّن هون.
 */

// أنواع السجلات المحلية = نفس صفوف قاعدة البيانات
type Tables = Database["public"]["Tables"];
export type LocalTask = Tables["tasks"]["Row"];
export type LocalScheduleSlot = Tables["schedule_slots"]["Row"];
export type LocalPomodoroSession = Tables["pomodoro_sessions"]["Row"];
export type LocalQuestionAttempt = Tables["question_attempts"]["Row"];
export type LocalDoubtEntry = Tables["doubt_box_entries"]["Row"];
export type LocalRewardEvent = Tables["reward_events"]["Row"];
export type LocalExamSchedule = Tables["exam_schedule"]["Row"];
export type LocalMockExamAttempt = Tables["mock_exam_attempts"]["Row"];

/** أنواع الجداول القابلة للتحميل المسبق للعمل بدون نت (محتوى منهج، للقراءة). */
export type LocalQuestionItem = Tables["question_bank_items"]["Row"];
export type LocalMockExam = Tables["mock_exams"]["Row"];

/** عملية بانتظار المزامنة مع Supabase. */
export type SyncOp = "insert" | "update" | "delete" | "upsert";

export interface SyncQueueItem {
  id?: number; // مفتاح تلقائي متزايد
  table: keyof Tables; // اسم جدول Supabase الهدف
  op: SyncOp;
  recordId: string; // uuid السجل (للحذف/التتبّع)
  payload: Record<string, unknown>;
  createdAt: number; // طابع زمني محلي (ms) — للترتيب
  attempts: number; // عدد محاولات الرفع الفاشلة
  lastError?: string;
}

export class WejhetDB extends Dexie {
  tasks!: Table<LocalTask, string>;
  schedule_slots!: Table<LocalScheduleSlot, string>;
  pomodoro_sessions!: Table<LocalPomodoroSession, string>;
  question_attempts!: Table<LocalQuestionAttempt, string>;
  doubt_box_entries!: Table<LocalDoubtEntry, string>;
  reward_events!: Table<LocalRewardEvent, string>;
  exam_schedule!: Table<LocalExamSchedule, string>;
  mock_exam_attempts!: Table<LocalMockExamAttempt, string>;

  // محتوى مُحمّل مسبقاً للعمل بدون نت (تحميل انتقائي بالمادة — خطة §ب.5 بند 5)
  question_bank_items!: Table<LocalQuestionItem, string>;
  mock_exams!: Table<LocalMockExam, string>;

  // طابور المزامنة
  sync_queue!: Table<SyncQueueItem, number>;

  constructor() {
    super("wejhet_ashwas");
    this.version(1).stores({
      // فهارس: المفتاح الأساسي أولاً ثم الحقول القابلة للاستعلام
      tasks: "id, user_id, task_date, status, subject_id, lesson_id",
      schedule_slots: "id, user_id, day_of_week, subject_id",
      pomodoro_sessions: "id, user_id, task_id, started_at",
      question_attempts: "id, user_id, question_id, answered_at",
      doubt_box_entries: "id, user_id, task_id, subject_id, is_resolved",
      reward_events: "id, user_id, event_type, unlocked_at",
      exam_schedule: "id, user_id, subject_id, exam_date",
      mock_exam_attempts: "id, user_id, mock_exam_id",
      question_bank_items: "id, subject_id, unit_id, lesson_id",
      mock_exams: "id, subject_id",
      sync_queue: "++id, table, recordId, createdAt",
    });
  }
}

/**
 * نسخة مفردة (singleton) من قاعدة البيانات المحلية.
 * تُنشأ فقط بالمتصفّح (IndexedDB غير متوفّر على الخادم).
 */
let _db: WejhetDB | null = null;

export function getDB(): WejhetDB {
  if (typeof window === "undefined") {
    throw new Error("getDB() لا يُستدعى إلا من المتصفّح (IndexedDB غير متوفّر على الخادم).");
  }
  if (!_db) _db = new WejhetDB();
  return _db;
}
