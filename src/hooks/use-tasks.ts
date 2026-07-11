"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDB, type LocalTask } from "@/lib/db/dexie";
import { localUpsert, localDelete } from "@/lib/db/sync-queue";
import { newId, nowISO, todayISO, weekday } from "@/lib/db/ids";
import { useUserId } from "@/components/app/app-data-provider";
import type { TaskStatus } from "@/lib/supabase/database.types";
import { tasksToCreateForDay, carryOverTasks } from "@/lib/domain/today";
import { reviewDatesFor } from "@/lib/domain/spaced-repetition";

export interface NewTaskInput {
  title: string;
  task_date: string;
  subject_id?: string | null;
  lesson_id?: string | null;
  schedule_slot_id?: string | null;
  task_type?: "study" | "review";
}

/** المهام — قراءة محلية حيّة + كتابات local-first + منطق التكرار المتباعد. */
export function useTasks(dateISO: string = todayISO()) {
  const userId = useUserId();

  const allTasks = useLiveQuery(
    () => getDB().tasks.where("user_id").equals(userId).toArray(),
    [userId],
    [] as LocalTask[]
  );

  const tasksForDate = allTasks
    .filter((t) => t.task_date === dateISO)
    .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));

  const carryOver = carryOverTasks(allTasks, dateISO);

  function buildTask(input: NewTaskInput): LocalTask {
    return {
      id: newId(),
      user_id: userId,
      schedule_slot_id: input.schedule_slot_id ?? null,
      lesson_id: input.lesson_id ?? null,
      subject_id: input.subject_id ?? null,
      title: input.title,
      task_date: input.task_date,
      task_type: input.task_type ?? "study",
      status: "todo",
      created_at: nowISO(),
      completed_at: null,
      updated_at: nowISO(),
    };
  }

  async function addTask(input: NewTaskInput) {
    await localUpsert("tasks", buildTask(input));
  }

  /** يولّد مهام اليوم من فترات الجدول (بدون تكرار) — يُستدعى عند فتح قائمة اليوم. */
  async function ensureTodayGenerated() {
    const db = getDB();
    const slots = await db.schedule_slots.where("user_id").equals(userId).toArray();
    const existing = await db.tasks
      .where("user_id")
      .equals(userId)
      .and((t) => t.task_date === dateISO)
      .toArray();
    const toCreate = tasksToCreateForDay(
      slots,
      existing,
      weekday(new Date(dateISO + "T00:00:00")),
      dateISO
    );
    for (const nt of toCreate) {
      await localUpsert("tasks", buildTask(nt));
    }
  }

  /** ينشئ مهام مراجعة مستقبلية عند إتمام درس (خطة §أ.13). */
  async function createReviewTasks(task: LocalTask) {
    if (!task.lesson_id) return;
    const db = getDB();
    const dates = reviewDatesFor(new Date());
    for (const d of dates) {
      const dup = await db.tasks
        .where("user_id")
        .equals(userId)
        .and(
          (t) =>
            t.task_type === "review" &&
            t.lesson_id === task.lesson_id &&
            t.task_date === d
        )
        .count();
      if (dup > 0) continue;
      await localUpsert(
        "tasks",
        buildTask({
          title: `مراجعة: ${task.title}`,
          task_date: d,
          subject_id: task.subject_id,
          lesson_id: task.lesson_id,
          task_type: "review",
        })
      );
    }
  }

  async function setStatus(task: LocalTask, status: TaskStatus) {
    const completed_at = status === "done" ? nowISO() : null;
    await localUpsert("tasks", {
      ...task,
      status,
      completed_at,
      updated_at: nowISO(),
    });
    // إتمام درس دراسي ⇒ توليد مهام مراجعة متباعدة تلقائياً
    if (status === "done" && task.task_type === "study" && task.lesson_id) {
      await createReviewTasks(task);
    }
  }

  async function postponeToToday(task: LocalTask) {
    await localUpsert("tasks", {
      ...task,
      task_date: todayISO(),
      updated_at: nowISO(),
    });
  }

  async function removeTask(id: string) {
    await localDelete("tasks", id);
  }

  return {
    allTasks,
    tasksForDate,
    carryOver,
    addTask,
    ensureTodayGenerated,
    setStatus,
    postponeToToday,
    removeTask,
  };
}
