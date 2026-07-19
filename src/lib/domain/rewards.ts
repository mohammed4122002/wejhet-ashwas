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
  completedTasks: number; // مهام أُنجزت (تُضيء المكافأة فور إتمام المهمة)
  units: UnitProgress[];
}

/**
 * يبني نموذج التقدّم الموحّد.
 * @param units تقدّم الوحدات (للإتقان العميق: كوكبات/خارطة/شجرة).
 * @param completedTasks عدد المهام المُنجزة (للإضاءة الفورية: نجوم/مباني).
 */
export function buildRewardProgress(
  units: UnitProgress[],
  completedTasks = 0
): RewardProgress {
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
    completedTasks,
    units,
  };
}

/**
 * مدن فلسطينية رئيسية لقالب الخارطة (كل مدينة شريحة % من التقدّم العام).
 * الترتيب = ترتيب الإنارة: يبدأ النور من القدس (القلب) ثم ينتشر خارجاً نحو
 * أطراف البلاد — لتبدو الخارطة وكأنها تُضاء انطلاقاً من مركزها.
 */
export const PALESTINE_CITIES = [
  "القدس",
  "بيت لحم",
  "الرملة",
  "الخليل",
  "نابلس",
  "يافا",
  "جنين",
  "غزة",
  "حيفا",
  "طبريا",
  "عكا",
  "صفد",
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
  completedTasks: number; // مهام مُنجزة
  overallRatio: number;
  streakDays: number; // أطول سلسلة أيام متتالية فيها إنجاز
  bestMockPercent: number | null; // أعلى علامة اختبار محاكاة
  questionsAnswered?: number; // عدد أسئلة بنك الأسئلة المُجابة
  pomodoroSessions?: number; // عدد جلسات بومودورو مكتملة
  dailyChallengesWon?: number; // تحديات يومية ربحها
  nightOwlSessions?: number; // جلسات بعد الـ11 مساءً
  earlyBirdSessions?: number; // جلسات قبل الـ7 صباحاً
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
  hidden?: boolean; // شارة مخفية — لا تظهر حتى تُفتح
}

/** يقيّم الشارات من إنجاز حقيقي. */
export function evaluateBadges(input: BadgeInput): Badge[] {
  return [
    // === شارات أساسية ===
    {
      id: "first_task",
      label: "أول خطوة",
      description: "أنجزت أول مهمة",
      earned: input.completedTasks >= 1,
    },
    {
      id: "ten_tasks",
      label: "عشرة مهام",
      description: "أنجزت 10 مهام",
      earned: input.completedTasks >= 10,
    },
    {
      id: "fifty_tasks",
      label: "خمسين مهمة",
      description: "أنجزت 50 مهمة — ماشاء الله!",
      earned: input.completedTasks >= 50,
    },
    {
      id: "hundred_tasks",
      label: "المئة الأولى",
      description: "100 مهمة مُنجزة",
      earned: input.completedTasks >= 100,
    },
    {
      id: "week_streak",
      label: "أسبوع كامل",
      description: "7 أيام متواصلة من الالتزام",
      earned: input.streakDays >= 7,
    },
    {
      id: "month_streak",
      label: "شهر حديد",
      description: "30 يوماً بدون انقطاع!",
      earned: input.streakDays >= 30,
    },
    {
      id: "half_way",
      label: "منتصف الطريق",
      description: "أنجزت نصف المنهج",
      earned: input.overallRatio >= 0.5,
    },
    {
      id: "finish_line",
      label: "خط النهاية",
      description: "أنجزت المنهج كاملاً!",
      earned: input.overallRatio >= 1,
    },
    {
      id: "mock_ace",
      label: "علامة كاملة",
      description: "اختبار محاكاة بعلامة 100%",
      earned: input.bestMockPercent === 100,
    },
    {
      id: "mock_90",
      label: "تسعين فما فوق",
      description: "اختبار محاكاة بعلامة 90%+",
      earned: (input.bestMockPercent ?? 0) >= 90,
    },
    // === شارات مخفية (سرّية) ===
    {
      id: "fifty_questions",
      label: "مستكشف الأسئلة",
      description: "أجبت 50 سؤالاً من بنك الأسئلة",
      earned: (input.questionsAnswered ?? 0) >= 50,
      hidden: true,
    },
    {
      id: "pomodoro_master",
      label: "سيّد التركيز",
      description: "أكملت 25 جلسة بومودورو",
      earned: (input.pomodoroSessions ?? 0) >= 25,
      hidden: true,
    },
    {
      id: "challenge_champ",
      label: "بطل التحديات",
      description: "فزت بـ 7 تحديات يومية",
      earned: (input.dailyChallengesWon ?? 0) >= 7,
      hidden: true,
    },
    {
      id: "night_owl",
      label: "بومة الليل",
      description: "درست بعد الـ11 مساءً 5 مرات",
      earned: (input.nightOwlSessions ?? 0) >= 5,
      hidden: true,
    },
    {
      id: "early_bird",
      label: "عصفور الصبح",
      description: "درست قبل الـ7 صباحاً 5 مرات",
      earned: (input.earlyBirdSessions ?? 0) >= 5,
      hidden: true,
    },
  ];
}

function shiftDay(dateISO: string, delta: number): string {
  const d = new Date(dateISO + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * السلسلة الحالية: أيام متتالية بإنجاز تنتهي باليوم — أو بالأمس إذا اليوم
 * لسا ما أنجز فيه (حتى لا تنكسر السلسلة نفسياً قبل نهاية اليوم).
 */
export function currentStreak(completedDates: string[], today: string): number {
  const days = new Set(completedDates);
  let cursor = days.has(today) ? today : shiftDay(today, -1);
  let n = 0;
  while (days.has(cursor)) {
    n += 1;
    cursor = shiftDay(cursor, -1);
  }
  return n;
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
