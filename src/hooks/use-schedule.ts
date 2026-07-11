"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDB, type LocalScheduleSlot } from "@/lib/db/dexie";
import { localUpsert, localDelete } from "@/lib/db/sync-queue";
import { newId, nowISO } from "@/lib/db/ids";
import { useUserId } from "@/components/app/app-data-provider";
import type { GeneratedSlot } from "@/lib/domain/schedule";

export interface NewSlotInput {
  day_of_week: number;
  start_time: string;
  end_time: string;
  title: string;
  subject_id?: string | null;
  is_recurring?: boolean;
}

/** فترات الجدول الأسبوعي — قراءة محلية حيّة + كتابات local-first. */
export function useSchedule() {
  const userId = useUserId();

  const slots = useLiveQuery(
    () =>
      getDB()
        .schedule_slots.where("user_id")
        .equals(userId)
        .toArray()
        .then((rows) =>
          rows.sort(
            (a, b) =>
              a.day_of_week - b.day_of_week ||
              a.start_time.localeCompare(b.start_time)
          )
        ),
    [userId],
    [] as LocalScheduleSlot[]
  );

  function buildRow(input: NewSlotInput): LocalScheduleSlot {
    return {
      id: newId(),
      user_id: userId,
      day_of_week: input.day_of_week,
      start_time: input.start_time,
      end_time: input.end_time,
      title: input.title,
      subject_id: input.subject_id ?? null,
      is_recurring: input.is_recurring ?? true,
      created_at: nowISO(),
      updated_at: nowISO(),
    };
  }

  async function addSlot(input: NewSlotInput) {
    await localUpsert("schedule_slots", buildRow(input));
  }

  async function updateSlot(slot: LocalScheduleSlot) {
    await localUpsert("schedule_slots", { ...slot, updated_at: nowISO() });
  }

  async function removeSlot(id: string) {
    await localDelete("schedule_slots", id);
  }

  /** يستبدل كامل الجدول بمسودة مولّدة معتمَدة (مساعد/تلقائي بعد الموافقة). */
  async function replaceWithGenerated(generated: GeneratedSlot[]) {
    // احذف القديم ثم أضف الجديد
    for (const s of slots) {
      await localDelete("schedule_slots", s.id);
    }
    for (const g of generated) {
      await localUpsert(
        "schedule_slots",
        buildRow({
          day_of_week: g.day_of_week,
          start_time: g.start_time,
          end_time: g.end_time,
          title: g.title,
          subject_id: g.subject_id,
          is_recurring: true,
        })
      );
    }
  }

  return { slots, addSlot, updateSlot, removeSlot, replaceWithGenerated };
}
