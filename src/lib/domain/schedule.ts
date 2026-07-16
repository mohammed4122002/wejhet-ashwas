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

/** التزام ثابت (مدرسة، درس خصوصي...) — الجدولة تتجنّبه (خطة §4.2). */
export interface FixedBlock {
  day_of_week: number;
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
}

/** ساعات فاضية لكل يوم (0=الأحد .. 6=السبت) + طول الفترة + ساعة البدء. */
export interface FreeTimeInput {
  freeHoursByDay: number[]; // طول 7
  sessionLengthHours?: number; // افتراضي 1
  startHour?: number; // افتراضي 16 (بعد المدرسة)
  /** فترات محجوزة تتجنّبها الجدولة (قابلة للتعديل من الإعدادات دائماً). */
  fixedBlocks?: FixedBlock[];
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

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function fromMin(m: number): string {
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
}

/**
 * يولّد فترات الجدول الأسبوعي.
 * - يحسب عدد الفترات لكل يوم من الساعات الفاضية.
 * - يوزّع المواد على الأيام بترتيب دوّار (round-robin) حسب حصصها المرجّحة.
 * - يتجنّب الالتزامات الثابتة (مدرسة، دروس خصوصية...) — يزحزح الفترة لأقرب
 *   ساعة حرة بعدها، وإن لم يتّسع اليوم يضع ما أمكن فقط (واقعية لا تكديس).
 */
export function generateWeeklySlots(
  subjects: SchedulableSubject[],
  input: FreeTimeInput,
  weighted: boolean,
  from: Date = new Date()
): GeneratedSlot[] {
  const sessionLen = input.sessionLengthHours ?? 1;
  const startHour = input.startHour ?? 16;
  const fixed = input.fixedBlocks ?? [];

  const sessionsPerDay = input.freeHoursByDay.map((h) =>
    Math.max(0, Math.floor(h / sessionLen))
  );
  const totalSessions = sessionsPerDay.reduce((a, b) => a + b, 0);
  if (totalSessions === 0 || subjects.length === 0) return [];

  // حصص كل مادة (largest remainder) ثم نوزّعها بتنويع داخل اليوم
  const allocation = allocateSessions(subjects, totalSessions, weighted, from);
  const pools = allocation
    .map((a) => ({ subject: a.subject, left: a.count }))
    .filter((p) => p.left > 0);

  /**
   * يختار المادة التالية لهذا اليوم: يفضّل مادة لم تُستخدم اليوم بعد (تنويع)،
   * ومن بينها الأكثر حصصاً متبقّية؛ لا يكرّر مادة إلا لو نفدت المواد المختلفة.
   */
  function pickSubject(usedToday: Set<string>): SchedulableSubject | null {
    const available = pools.filter((p) => p.left > 0);
    if (available.length === 0) return null;
    const fresh = available.filter((p) => !usedToday.has(p.subject.id));
    const candidates = fresh.length ? fresh : available;
    const best = candidates.reduce((a, b) => (b.left > a.left ? b : a));
    best.left -= 1;
    return best.subject;
  }

  const sessionMin = sessionLen * 60;
  const slots: GeneratedSlot[] = [];

  for (let day = 0; day < 7; day++) {
    const needed = sessionsPerDay[day];
    if (needed === 0) continue;

    const blocked: Array<readonly [number, number]> = fixed
      .filter((b) => b.day_of_week === day)
      .map((b) => [toMin(b.start_time), toMin(b.end_time)] as const);
    const placed: Array<readonly [number, number]> = [];
    const usedToday = new Set<string>();

    // نمشي ساعة بساعة من ساعة البدء ونحجز أول فراغ حر
    for (
      let h = startHour;
      h * 60 + sessionMin <= 24 * 60 && placed.length < needed;
      h++
    ) {
      const s = h * 60;
      const e = s + sessionMin;
      const clash = [...blocked, ...placed].some(
        ([bs, be]) => s < be && e > bs
      );
      if (clash) continue;

      const subject = pickSubject(usedToday);
      if (!subject) break; // نفدت الحصص المخصّصة

      placed.push([s, e]);
      usedToday.add(subject.id);
      slots.push({
        day_of_week: day,
        start_time: fromMin(s),
        end_time: fromMin(e),
        title: `مذاكرة ${subject.name}`,
        subject_id: subject.id,
      });
    }
  }

  return slots;
}
