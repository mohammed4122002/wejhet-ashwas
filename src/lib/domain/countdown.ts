/**
 * منطق العد التنازلي (خطة §أ.11) — دوال نقية بلا واجهة أو شبكة.
 * تعمل offline بالكامل (حساب تواريخ محلي).
 */

/** عدد الأيام المتبقية حتى تاريخ الامتحان (يتجاهل الوقت داخل اليوم). */
export function daysUntil(examDate: string | Date, from: Date = new Date()): number {
  const exam = new Date(examDate);
  const a = Date.UTC(exam.getFullYear(), exam.getMonth(), exam.getDate());
  const b = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

/** عتبة تفعيل "وضع المراجعة المكثّفة": ≤ 6 أسابيع (42 يوم) وقبل الامتحان. */
export const COUNTDOWN_THRESHOLD_DAYS = 42;

/** هل المادة ضمن نافذة العد التنازلي؟ (خطة §أ.11) */
export function isInCountdownWindow(
  examDate: string | Date,
  from: Date = new Date()
): boolean {
  const d = daysUntil(examDate, from);
  return d >= 0 && d <= COUNTDOWN_THRESHOLD_DAYS;
}
