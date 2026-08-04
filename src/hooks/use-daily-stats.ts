"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDB } from "@/lib/db/dexie";
import { useUserId } from "@/components/app/app-data-provider";
import { currentStreak } from "@/lib/domain/rewards";
import { todayISO } from "@/lib/db/ids";

export interface DailyStats {
  todayTotal: number;
  todayDone: number;
  streak: number; // السلسلة الحالية (تنتهي باليوم/الأمس)
  focusMinutes: number; // دقائق بومودورو اليوم
  completedTasks: number; // كل المهام المنجزة (لخارطة البداية)
  pomodoroCount: number; // كل جلسات البومودورو (لخارطة البداية)
}

const EMPTY: DailyStats = {
  todayTotal: 0,
  todayDone: 0,
  streak: 0,
  focusMinutes: 0,
  completedTasks: 0,
  pomodoroCount: 0,
};

/** إحصائيات اليوم الحيّة من Dexie (offline كامل). */
export function useDailyStats(): DailyStats {
  const userId = useUserId();
  const today = todayISO();

  return (
    useLiveQuery(
      async () => {
        const db = getDB();
        const [todayTasks, doneAll, pomos] = await Promise.all([
          db.tasks
            .where("user_id")
            .equals(userId)
            .and((t) => t.task_date === today)
            .toArray(),
          db.tasks
            .where("user_id")
            .equals(userId)
            .and((t) => t.status === "done")
            .toArray(),
          db.pomodoro_sessions.where("user_id").equals(userId).toArray(),
        ]);

        const dates = doneAll.map((t) =>
          (t.completed_at ?? t.task_date).slice(0, 10)
        );
        // الاستراحات تُسجَّل بنفس الجدول الآن — لازم نستثنيها من دقائق/عدد التركيز
        const focusPomos = pomos.filter((p) => p.session_type === "focus");
        const focusMinutes = focusPomos
          .filter((p) => p.started_at.slice(0, 10) === today)
          .reduce((s, p) => s + p.duration_minutes, 0);

        return {
          todayTotal: todayTasks.length,
          todayDone: todayTasks.filter((t) => t.status === "done").length,
          streak: currentStreak(dates, today),
          focusMinutes,
          completedTasks: doneAll.length,
          pomodoroCount: focusPomos.length,
        } satisfies DailyStats;
      },
      [userId, today],
      EMPTY
    ) ?? EMPTY
  );
}
