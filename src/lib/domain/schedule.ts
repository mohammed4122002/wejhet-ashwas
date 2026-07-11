/**
 * محرّك توليد الجدول (خطة §أ.2) — دوال نقية بلا واجهة أو شبكة (offline كامل).
 *
 * نظامان يعتمدان هذا المحرّك:
 * - "مساعد": ترجيح متساوٍ لكل المواد ← اقتراح مبدئي بسيط.
 * - "تلقائي بالكامل": ترجيح مرجّح حسب (قرب الامتحان + ضعف الوحدة + وقت فاضٍ).
 *
 * القواعد واضحة ويسهل تعديلها لاحقاً — لا ذكاء اصطناعي معقّد (خطة §أ.2).
 */

import { daysUntil, COUNTDOWN_THRESHOLD_DAYS } from "./countdown";

export interface SchedulableSubject {
  id: string;
  name: string;
  /** أقرب تاريخ امتحان لهذه المادة (اختياري) — يغذّي ترجيح القرب. */
  examDate?: string | null;
  /** متوسط نسبة الإتقان [0..1] من الخريطة الحرارية (اختياري) — يغذّي ترجيح الضعف. */
  masteryRatio?: number;
}

/** ساعات فاضية لكل يوم (0=الأحد .. 6=السبت) + طول الفترة + ساعة البدء. */
export interface FreeTimeInput {
  freeHoursByDay: number[]; // طول 7
  sessionLengthHours?: number; // افتراضي 1
  startHour?: number; // افتراضي 16 (بعد المدرسة)
}

export interface GeneratedSlot {
  day_of_week: number;
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  title: string;
  subject_id: string | null;
}

/** أوزان الترجيح — معزولة ليسهل ضبطها. */
export const WEIGHTS = {
  base: 1, // وزن أساسي لكل مادة
  examProximity: 3, // كل ما قرب الامتحان زاد الوزن
  weakness: 2, // كل ما ضعفت المادة زاد الوزن
} as const;

/** وزن مادة واحدة بالنظام التلقائي (كل ما زاد ⇒ حصة أكبر بالجدول). */
export function subjectWeight(
  s: SchedulableSubject,
  weighted: boolean,
  from: Date = new Date()
): number {
  if (!weighted) return WEIGHTS.base; // النظام المساعد: تساوٍ

  let w = WEIGHTS.base;

  // قرب الامتحان: خطّي داخل نافذة العد التنازلي (≤ 6 أسابيع)
  if (s.examDate) {
    const d = daysUntil(s.examDate, from);
    if (d >= 0 && d <= COUNTDOWN_THRESHOLD_DAYS) {
      w += WEIGHTS.examProximity * (1 - d / COUNTDOWN_THRESHOLD_DAYS);
    }
  }

  // الضعف: كل ما قلّ الإتقان زاد الوزن
  if (typeof s.masteryRatio === "number") {
    w += WEIGHTS.weakness * (1 - Math.min(1, Math.max(0, s.masteryRatio)));
  }

  return w;
}

/** يوزّع عدد فترات على المواد حسب أوزانها (طريقة أكبر باقٍ largest remainder). */
export function allocateSessions(
  subjects: SchedulableSubject[],
  totalSessions: number,
  weighted: boolean,
  from: Date = new Date()
): { subject: SchedulableSubject; count: number }[] {
  if (subjects.length === 0 || totalSessions <= 0) return [];

  const weights = subjects.map((s) => subjectWeight(s, weighted, from));
  const sum = weights.reduce((a, b) => a + b, 0);

  const raw = weights.map((w) => (w / sum) * totalSessions);
  const floors = raw.map((r) => Math.floor(r));
  let remaining = totalSessions - floors.reduce((a, b) => a + b, 0);

  // وزّع الباقي على الأكبر كسراً
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  const counts = [...floors];
  for (const { i } of order) {
    if (remaining <= 0) break;
    counts[i] += 1;
    remaining -= 1;
  }

  return subjects.map((subject, i) => ({ subject, count: counts[i] }));
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * يولّد فترات الجدول الأسبوعي.
 * - يحسب عدد الفترات لكل يوم من الساعات الفاضية.
 * - يوزّع المواد على الأيام بترتيب دوّار (round-robin) حسب حصصها المرجّحة.
 */
export function generateWeeklySlots(
  subjects: SchedulableSubject[],
  input: FreeTimeInput,
  weighted: boolean,
  from: Date = new Date()
): GeneratedSlot[] {
  const sessionLen = input.sessionLengthHours ?? 1;
  const startHour = input.startHour ?? 16;

  const sessionsPerDay = input.freeHoursByDay.map((h) =>
    Math.max(0, Math.floor(h / sessionLen))
  );
  const totalSessions = sessionsPerDay.reduce((a, b) => a + b, 0);
  if (totalSessions === 0 || subjects.length === 0) return [];

  // طابور مواد موزّع دوّاراً حتى ما تتكدّس مادة واحدة بيوم واحد
  const allocation = allocateSessions(subjects, totalSessions, weighted, from);
  const queue: SchedulableSubject[] = [];
  const pools = allocation.map((a) => ({ subject: a.subject, left: a.count }));
  let anyLeft = true;
  while (anyLeft) {
    anyLeft = false;
    for (const p of pools) {
      if (p.left > 0) {
        queue.push(p.subject);
        p.left -= 1;
        anyLeft = true;
      }
    }
  }

  const slots: GeneratedSlot[] = [];
  let qi = 0;
  for (let day = 0; day < 7; day++) {
    for (let i = 0; i < sessionsPerDay[day]; i++) {
      const subject = queue[qi % queue.length];
      qi += 1;
      const sh = startHour + i * sessionLen;
      const eh = sh + sessionLen;
      slots.push({
        day_of_week: day,
        start_time: `${pad2(sh)}:00`,
        end_time: `${pad2(eh)}:00`,
        title: `مذاكرة ${subject.name}`,
        subject_id: subject.id,
      });
    }
  }

  return slots;
}
