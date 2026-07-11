"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDB, type LocalPomodoroSession } from "@/lib/db/dexie";
import { localUpsert } from "@/lib/db/sync-queue";
import { newId } from "@/lib/db/ids";
import { useUserId } from "@/components/app/app-data-provider";

/** تسجيل جلسات البومودورو المكتملة (وقت فعلي مقابل مخطط). */
export function usePomodoroLog(taskId?: string) {
  const userId = useUserId();

  const sessions = useLiveQuery(
    () =>
      taskId
        ? getDB().pomodoro_sessions.where("task_id").equals(taskId).toArray()
        : Promise.resolve([] as LocalPomodoroSession[]),
    [taskId],
    [] as LocalPomodoroSession[]
  );

  /** إجمالي الدقائق الفعلية المسجّلة لهذه المهمة. */
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  async function logSession(
    task_id: string,
    durationMinutes: number,
    startedAt: string,
    endedAt: string
  ) {
    const row: LocalPomodoroSession = {
      id: newId(),
      task_id,
      user_id: userId,
      duration_minutes: durationMinutes,
      started_at: startedAt,
      ended_at: endedAt,
    };
    await localUpsert("pomodoro_sessions", row);
  }

  return { sessions, totalMinutes, logSession };
}
