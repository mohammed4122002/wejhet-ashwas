/**
 * التكرار المتباعد (خطة §أ.13) — فترات ثابتة بسيطة، لا محرّك SM-2 معقّد.
 * دوال نقية تعمل offline بالكامل (توليد مهام مراجعة محلياً).
 */

/** الفواصل الثابتة بالأيام: بعد أسبوع، أسبوعين، شهر (خطة §أ.13). */
export const REVIEW_INTERVALS_DAYS = [7, 14, 30] as const;

function toDateOnly(d: Date): string {
  // صيغة YYYY-MM-DD (نفس صيغة task_date بقاعدة البيانات)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * يولّد تواريخ مهام المراجعة المستقبلية عند إتمام درس.
 * @param completedOn تاريخ إتمام الدرس (افتراضي: اليوم).
 * @returns مصفوفة تواريخ YYYY-MM-DD للمراجعات القادمة.
 */
export function reviewDatesFor(completedOn: Date = new Date()): string[] {
  return REVIEW_INTERVALS_DAYS.map((days) => {
    const d = new Date(completedOn);
    d.setDate(d.getDate() + days);
    return toDateOnly(d);
  });
}
