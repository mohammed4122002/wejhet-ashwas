"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDB } from "@/lib/db/dexie";
import { useUserId } from "@/components/app/app-data-provider";
import { masteryRatio, type UnitProgress } from "@/lib/domain/heatmap";

/**
 * الخريطة الحرارية محسوبة محلياً من Dexie (offline كامل).
 * الإتقان يتراكم من: مهام "تمّت" مرتبطة بدرس + محاولات أسئلة صحيحة (خطة §أ.5).
 * تطابق منطق view قاعدة البيانات لكن بدون شبكة.
 */
export function useHeatmap() {
  const userId = useUserId();

  const data = useLiveQuery(async () => {
    const db = getDB();
    const [tasks, attempts, questions, lessons, units] = await Promise.all([
      db.tasks.where("user_id").equals(userId).toArray(),
      db.question_attempts.where("user_id").equals(userId).toArray(),
      db.question_bank_items.toArray(),
      db.lessons.toArray(),
      db.units.toArray(),
    ]);

    const lessonUnit = new Map(lessons.map((l) => [l.id, l.unit_id]));
    const questionLesson = new Map(questions.map((q) => [q.id, q.lesson_id]));

    // مجموعة الدروس المُتقنة لكل وحدة (done task أو محاولة صحيحة)
    const masteredByUnit = new Map<string, Set<string>>();
    const add = (unitId: string | null | undefined, lessonId: string | null) => {
      if (!unitId || !lessonId) return;
      if (!masteredByUnit.has(unitId)) masteredByUnit.set(unitId, new Set());
      masteredByUnit.get(unitId)!.add(lessonId);
    };

    for (const t of tasks) {
      if (t.status === "done" && t.lesson_id) {
        add(lessonUnit.get(t.lesson_id) ?? null, t.lesson_id);
      }
    }
    for (const a of attempts) {
      if (a.is_correct && a.question_id) {
        const lessonId = questionLesson.get(a.question_id) ?? null;
        if (lessonId) add(lessonUnit.get(lessonId) ?? null, lessonId);
      }
    }

    const totalByUnit = new Map<string, number>();
    for (const l of lessons) {
      if (l.unit_id)
        totalByUnit.set(l.unit_id, (totalByUnit.get(l.unit_id) ?? 0) + 1);
    }

    const progress = new Map<string, UnitProgress>();
    for (const u of units) {
      progress.set(u.id, {
        unitId: u.id,
        unitName: u.name_ar,
        totalLessons: totalByUnit.get(u.id) ?? 0,
        masteredLessons: masteredByUnit.get(u.id)?.size ?? 0,
      });
    }
    return { progress, units };
  }, [userId]);

  const progress = data?.progress ?? new Map<string, UnitProgress>();

  /** متوسط نسبة إتقان مادة (متوسط وحداتها). */
  function subjectMastery(subjectId: string): number {
    const us = (data?.units ?? []).filter((u) => u.subject_id === subjectId);
    if (us.length === 0) return 0;
    const sum = us.reduce((acc, u) => {
      const p = progress.get(u.id);
      return acc + (p ? masteryRatio(p) : 0);
    }, 0);
    return sum / us.length;
  }

  return { progress, subjectMastery };
}
