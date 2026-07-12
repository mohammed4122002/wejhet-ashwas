"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDB } from "@/lib/db/dexie";
import { useUserId } from "@/components/app/app-data-provider";
import { useCurriculum } from "@/hooks/use-curriculum";
import { useHeatmap } from "@/hooks/use-heatmap";
import {
  buildRewardProgress,
  evaluateBadges,
  longestStreak,
  type Badge,
  type RewardProgress,
} from "@/lib/domain/rewards";
import type { UnitProgress } from "@/lib/domain/heatmap";

/**
 * تقدّم المكافآت + الشارات — محسوب من إنجاز حقيقي محلي (offline).
 *
 * ملاحظة تصميمية: العرض البصري مشتقّ مباشرة من الإتقان الفعلي (دروس/وحدات
 * متقنة، أداء المحاكاة) — وهذا هو "الإنجاز الحقيقي" المطلوب بخطة §أ.9. جدول
 * reward_events يبقى الطبقة الموحّدة للأحداث ويُستخدم بالجلسة 5 (السلاسل/التنافسي)؛
 * TODO(rewards): كتابة أحداث lesson_mastered/unit_mastered إليه عند الحاجة لسجلّ
 * دائم عبر الأجهزة (العرض الحالي لا يعتمد عليه).
 */
export function useRewards(): { progress: RewardProgress; badges: Badge[] } {
  const userId = useUserId();
  const { subjects, unitsOf } = useCurriculum();
  const { progress: unitMap } = useHeatmap();

  // وحدات فرع الطالب فقط
  const trackUnits: UnitProgress[] = subjects
    .flatMap((s) => unitsOf(s.id))
    .map(
      (u) =>
        unitMap.get(u.id) ?? {
          unitId: u.id,
          unitName: u.name_ar,
          totalLessons: 0,
          masteredLessons: 0,
        }
    );

  // المهام المنجزة: عددها (يُضيء المكافأة فوراً) + السلسلة
  const doneStats = useLiveQuery(
    async () => {
      const done = await getDB()
        .tasks.where("user_id")
        .equals(userId)
        .and((t) => t.status === "done")
        .toArray();
      const dates = done.map((t) => (t.completed_at ?? t.task_date).slice(0, 10));
      return { count: done.length, streak: longestStreak(dates) };
    },
    [userId],
    { count: 0, streak: 0 }
  );
  const completedTasks = doneStats?.count ?? 0;
  const streakDays = doneStats?.streak ?? 0;

  const progress = buildRewardProgress(trackUnits, completedTasks);

  const bestMockPercent = useLiveQuery(
    async () => {
      const attempts = await getDB()
        .mock_exam_attempts.where("user_id")
        .equals(userId)
        .toArray();
      const scores = attempts
        .map((a) => a.score_percent)
        .filter((s): s is number => typeof s === "number");
      return scores.length ? Math.max(...scores) : null;
    },
    [userId],
    null
  );

  const badges = evaluateBadges({
    completedTasks,
    overallRatio: progress.overallRatio,
    streakDays,
    bestMockPercent: bestMockPercent ?? null,
  });

  return { progress, badges };
}
