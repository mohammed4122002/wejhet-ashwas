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

/**
 * نوع هدف التحدي — يحدّد أي بيانات محلية حقيقية تُحسَب تلقائياً كتقدّم،
 * بدل رقم يكتبه الطالب بنفسه (قابل للغش). "lessons_mastered"/"questions_solved"
 * يحتاجان بنك الأسئلة مفعّلاً (خطة §أ.7).
 */
export type ChallengeGoalType =
  | "tasks"
  | "focus_minutes"
  | "streak_days"
  | "lessons_mastered"
  | "questions_solved";

export const CHALLENGE_GOAL_TYPES: {
  value: ChallengeGoalType;
  label: string;
  unit: string;
  requiresBank?: boolean;
}[] = [
  { value: "tasks", label: "مهام مُنجزة", unit: "مهمة" },
  { value: "focus_minutes", label: "دقائق تركيز (بومودورو)", unit: "دقيقة" },
  { value: "streak_days", label: "سلسلة أيام متواصلة", unit: "يوم" },
  { value: "lessons_mastered", label: "دروس أُتقنت", unit: "درس", requiresBank: true },
  { value: "questions_solved", label: "أسئلة صحيحة بالبنك", unit: "سؤال", requiresBank: true },
];

/** مستوى الشعلة البصري من عدد أيام السلسلة (0 = خامدة .. 4 = مشتعلة بالكامل). */
export function flameLevel(streakDays: number): 0 | 1 | 2 | 3 | 4 {
  if (streakDays <= 0) return 0;
  if (streakDays < 3) return 1;
  if (streakDays < 7) return 2;
  if (streakDays < 14) return 3;
  return 4;
}
