/**
 * العنصر التنافسي (خطة §أ.10) — دوال نقية.
 * الترتيب مبني على "مؤشّر التزام" لا على علامات (تجنّباً للمقارنة القاسية).
 */

/** مؤشّر الالتزام: مهام مكتملة + سلسلة أيام متواصلة (لا علامات مواد). */
export function commitmentScore(completedTasks: number, streakDays: number): number {
  return completedTasks * 10 + streakDays * 5;
}

/** تقدّم نسبي لطيف داخل تحدٍّ (نسبة مئوية من أعلى تقدّم بالمجموعة). */
export function relativePercent(progress: number, maxProgress: number): number {
  if (maxProgress <= 0) return 0;
  return Math.round((progress / maxProgress) * 100);
}
