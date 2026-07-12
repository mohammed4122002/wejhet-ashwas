"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  getDB,
  type LocalMockExam,
  type LocalMockExamAttempt,
  type LocalQuestionItem,
} from "@/lib/db/dexie";
import { localUpsert } from "@/lib/db/sync-queue";
import { newId, nowISO } from "@/lib/db/ids";
import { useUserId } from "@/components/app/app-data-provider";

/** قائمة اختبارات المحاكاة (من التخزين المحلي). */
export function useMockExams(subjectId?: string): LocalMockExam[] {
  return (
    useLiveQuery(
      () =>
        subjectId
          ? getDB().mock_exams.where("subject_id").equals(subjectId).toArray()
          : getDB().mock_exams.toArray(),
      [subjectId],
      [] as LocalMockExam[]
    ) ?? []
  );
}

/** أسئلة اختبار محاكاة معيّن (بترتيب question_ids). */
export function useMockQuestions(exam: LocalMockExam | null): LocalQuestionItem[] {
  const list = useLiveQuery(
    async () => {
      if (!exam) return [] as LocalQuestionItem[];
      const qs = await getDB()
        .question_bank_items.where("id")
        .anyOf(exam.question_ids)
        .toArray();
      // حافظ على ترتيب question_ids
      const order = new Map(exam.question_ids.map((id, i) => [id, i]));
      return qs.sort(
        (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
      );
    },
    [exam?.id],
    [] as LocalQuestionItem[]
  );
  return list ?? [];
}

/** محاولات اختبارات المحاكاة — تسجيل local-first. */
export function useMockAttempts() {
  const userId = useUserId();

  const attempts = useLiveQuery(
    () =>
      getDB().mock_exam_attempts.where("user_id").equals(userId).toArray(),
    [userId],
    [] as LocalMockExamAttempt[]
  );

  async function saveAttempt(
    mockExamId: string,
    answers: Record<string, string>,
    scorePercent: number,
    startedAt: string
  ) {
    const row: LocalMockExamAttempt = {
      id: newId(),
      user_id: userId,
      mock_exam_id: mockExamId,
      started_at: startedAt,
      submitted_at: nowISO(),
      answers,
      score_percent: scorePercent,
    };
    await localUpsert("mock_exam_attempts", row);
    return row.id;
  }

  return { attempts, saveAttempt };
}
