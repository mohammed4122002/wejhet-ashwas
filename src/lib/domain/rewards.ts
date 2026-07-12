/**
 * منطق المكافآت (خطة §أ.9) — دوال نقية.
 * التقدّم البصري مربوط بإنجاز حقيقي فقط (دروس/وحدات متقنة، أداء قوي بالمحاكاة).
 * القوالب الخمسة تعرض نفس هذا التقدّم بأشكال مختلفة (نفس البيانات، عرض مختلف).
 */

import type { UnitProgress } from "./heatmap";

/** نموذج تقدّم موحّد تستهلكه كل القوالب البصرية. */
export interface RewardProgress {
  masteredLessons: number;
  totalLessons: number;
  masteredUnits: number; // وحدات مُتقنة بالكامل
  totalUnits: number;
  overallRatio: number; // نسبة الدروس المُتقنة من الإجمالي [0..1]
  units: UnitProgress[];
}

/** يبني نموذج التقدّم الموحّد من تقدّم الوحدات. */
export function buildRewardProgress(units: UnitProgress[]): RewardProgress {
  const totalLessons = units.reduce((s, u) => s + u.totalLessons, 0);
  const masteredLessons = units.reduce((s, u) => s + u.masteredLessons, 0);
  const totalUnits = units.filter((u) => u.totalLessons > 0).length;
  const masteredUnits = units.filter(
    (u) => u.totalLessons > 0 && u.masteredLessons >= u.totalLessons
  ).length;
  return {
    masteredLessons,
    totalLessons,
    masteredUnits,
    totalUnits,
    overallRatio: totalLessons ? masteredLessons / totalLessons : 0,
    units,
  };
}

/** مدن فلسطينية رئيسية لقالب الخارطة (كل مدينة شريحة % من التقدّم العام). */
export const PALESTINE_CITIES = [
  "القدس",
  "يافا",
  "عكا",
  "حيفا",
  "غزة",
  "الخليل",
  "نابلس",
  "بيت لحم",
  "طبريا",
  "صفد",
  "الرملة",
  "جنين",
] as const;

/** عدد المدن المُنارة حسب التقدّم العام. */
export function litCityCount(overallRatio: number, total = PALESTINE_CITIES.length): number {
  return Math.min(total, Math.floor(overallRatio * total));
}

/** مرحلة نمو الشجرة/الحديقة (0 بذرة .. 5 مثمرة). */
export function growthStage(overallRatio: number): 0 | 1 | 2 | 3 | 4 | 5 {
  return Math.min(5, Math.floor(overallRatio * 5 + (overallRatio > 0 ? 1 : 0))) as
    | 0 | 1 | 2 | 3 | 4 | 5;
}

/** اسم كوكبة لوحدة مُتقنة (قالب النجوم والأبراج). */
export function constellationName(unitName: string): string {
  return `كوكبة ${unitName}`;
}

// ============ الشارات النصية المشتركة بين كل القوالب ============
export interface BadgeInput {
  masteredLessons: number;
  overallRatio: number;
  streakDays: number; // أطول سلسلة أيام متتالية فيها إنجاز
  bestMockPercent: number | null; // أعلى علامة اختبار محاكاة
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
}

/** يقيّم الشارات من إنجاز حقيقي. */
export function evaluateBadges(input: BadgeInput): Badge[] {
  return [
    {
      id: "first_lesson",
      label: "أول خطوة",
      description: "أتقنت أول درس",
      earned: input.masteredLessons >= 1,
    },
    {
      id: "ten_lessons",
      label: "عشرة على التوالي",
      description: "أتقنت 10 دروس",
      earned: input.masteredLessons >= 10,
    },
    {
      id: "week_streak",
      label: "أسبوع كامل",
      description: "7 أيام متواصلة من الالتزام",
      earned: input.streakDays >= 7,
    },
    {
      id: "half_way",
      label: "منتصف الطريق",
      description: "أنجزت نصف المنهج",
      earned: input.overallRatio >= 0.5,
    },
    {
      id: "mock_ace",
      label: "علامة كاملة",
      description: "اختبار محاكاة بعلامة 100%",
      earned: input.bestMockPercent === 100,
    },
  ];
}

/** أطول سلسلة أيام متتالية تحتوي إنجازاً، من تواريخ الإنجاز (YYYY-MM-DD). */
export function longestStreak(completedDates: string[]): number {
  const days = [...new Set(completedDates)].sort();
  if (days.length === 0) return 0;
  let best = 1;
  let cur = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1] + "T00:00:00");
    const curr = new Date(days[i] + "T00:00:00");
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) cur += 1;
    else cur = 1;
    best = Math.max(best, cur);
  }
  return best;
}
