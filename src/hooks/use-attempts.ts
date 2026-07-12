"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDB, type LocalQuestionAttempt } from "@/lib/db/dexie";
import { localUpsert } from "@/lib/db/sync-queue";
import { newId, nowISO } from "@/lib/db/ids";
import { useUserId } from "@/components/app/app-data-provider";

/** محاولات الأسئلة — تسجيل local-first (يغذّي الخريطة الحرارية). */
export function useAttempts() {
  const userId = useUserId();

  const attempts = useLiveQuery(
    () => getDB().question_attempts.where("user_id").equals(userId).toArray(),
    [userId],
    [] as LocalQuestionAttempt[]
  );

  async function recordAttempt(
    questionId: string,
    isCorrect: boolean,
    timeSpentSeconds?: number
  ) {
    const row: LocalQuestionAttempt = {
      id: newId(),
      user_id: userId,
      question_id: questionId,
      is_correct: isCorrect,
      time_spent_seconds: timeSpentSeconds ?? null,
      answered_at: nowISO(),
    };
    await localUpsert("question_attempts", row);
  }

  return { attempts, recordAttempt };
}
