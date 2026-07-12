"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDB, type LocalQuestionItem } from "@/lib/db/dexie";

/** معرّفات المواد اللي أسئلتها محمّلة محلياً (متاحة بدون نت). */
export function useDownloadedSubjectIds(): Set<string> {
  return (
    useLiveQuery(
      async () => {
        const all = await getDB().question_bank_items.toArray();
        return new Set(all.map((q) => q.subject_id).filter(Boolean) as string[]);
      },
      [],
      new Set<string>()
    ) ?? new Set<string>()
  );
}

/** عدد أسئلة كل درس (لعرض الدروس اللي إلها أسئلة). */
export function useQuestionCountByLesson(): Map<string, number> {
  return (
    useLiveQuery(
      async () => {
        const all = await getDB().question_bank_items.toArray();
        const m = new Map<string, number>();
        for (const q of all) {
          if (q.lesson_id) m.set(q.lesson_id, (m.get(q.lesson_id) ?? 0) + 1);
        }
        return m;
      },
      [],
      new Map<string, number>()
    ) ?? new Map<string, number>()
  );
}

/** أسئلة درس معيّن (من التخزين المحلي — تعمل بدون نت بعد التحميل). */
export function useLessonQuestions(lessonId: string | null): LocalQuestionItem[] {
  return (
    useLiveQuery(
      () =>
        lessonId
          ? getDB().question_bank_items.where("lesson_id").equals(lessonId).toArray()
          : Promise.resolve([] as LocalQuestionItem[]),
      [lessonId],
      [] as LocalQuestionItem[]
    ) ?? []
  );
}
