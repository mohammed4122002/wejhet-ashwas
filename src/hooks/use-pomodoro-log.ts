"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDB, type LocalPomodoroSession } from "@/lib/db/dexie";
import { localUpsert } from "@/lib/db/sync-queue";
import { newId, todayISO } from "@/lib/db/ids";
import { useUserId } from "@/components/app/app-data-provider";
import type { PomodoroPhase } from "@/hooks/use-pomodoro-timer";

/** تسجيل جلسات البومودورو المكتملة (وقت فعلي مقابل مخطط). */
export function usePomodoroLog(taskId?: string) {
  const userId = useUserId();

  const rawSessions = useLiveQuery(
    () =>
      taskId
        ? getDB().pomodoro_sessions.where("task_id").equals(taskId).toArray()
        : Promise.resolve([] as LocalPomodoroSession[]),
    [taskId],
    [] as LocalPomodoroSession[]
  );

  // جلسات التركيز فقط — الاستراحات قد تُسجَّل بنفس task_id لكنها لا تُحسب
  // ضمن "جلسات مكتملة" أو الوقت الفعلي للمهمة.
  const sessions = rawSessions.filter((s) => s.session_type === "focus");

  /** إجمالي الدقائق الفعلية المسجّلة لهذه المهمة (تركيز فقط). */
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  async function logSession(
    task_id: string | null,
    sessionType: PomodoroPhase,
    durationMinutes: number,
    startedAt: string,
    endedAt: string
  ) {
    const row: LocalPomodoroSession = {
      id: newId(),
      task_id,
      user_id: userId,
      session_type: sessionType,
      duration_minutes: durationMinutes,
      started_at: startedAt,
      ended_at: endedAt,
    };
    await localUpsert("pomodoro_sessions", row);
  }

  return { sessions, totalMinutes, logSession };
}

export interface TodayPomodoroStats {
  focusCount: number;
  breakCount: number;
  focusMinutes: number;
}

const EMPTY_TODAY_STATS: TodayPomodoroStats = {
  focusCount: 0,
  breakCount: 0,
  focusMinutes: 0,
};

/** إحصاء جلسات اليوم (تركيز + استراحة) لكل المستخدم — بغضّ النظر عن المهمة. */
export function useTodayPomodoroStats(): TodayPomodoroStats {
  const userId = useUserId();
  const today = todayISO();

  return (
    useLiveQuery(
      async () => {
        const rows = await getDB()
          .pomodoro_sessions.where("user_id")
          .equals(userId)
          .toArray();
        const todayRows = rows.filter((r) => r.started_at.slice(0, 10) === today);
        const focusRows = todayRows.filter((r) => r.session_type === "focus");
        return {
          focusCount: focusRows.length,
          breakCount: todayRows.filter((r) => r.session_type === "break").length,
          focusMinutes: focusRows.reduce((s, r) => s + r.duration_minutes, 0),
        } satisfies TodayPomodoroStats;
      },
      [userId, today],
      EMPTY_TODAY_STATS
    ) ?? EMPTY_TODAY_STATS
  );
}
