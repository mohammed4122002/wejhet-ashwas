"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDB, type LocalDoubtEntry } from "@/lib/db/dexie";
import { localUpsert, localDelete } from "@/lib/db/sync-queue";
import { newId, nowISO } from "@/lib/db/ids";
import { useUserId } from "@/components/app/app-data-provider";

export interface NewDoubtInput {
  question_text: string;
  task_id?: string | null;
  subject_id?: string | null;
  lesson_id?: string | null;
}

/** صندوق الشكوك (خطة §أ.14) — كتابة محلية بالكامل، لا اعتماد على الشبكة. */
export function useDoubts() {
  const userId = useUserId();

  const doubts = useLiveQuery(
    () =>
      getDB()
        .doubt_box_entries.where("user_id")
        .equals(userId)
        .toArray()
        .then((rows) =>
          rows.sort((a, b) =>
            (b.created_at ?? "").localeCompare(a.created_at ?? "")
          )
        ),
    [userId],
    [] as LocalDoubtEntry[]
  );

  const unresolved = doubts.filter((d) => !d.is_resolved);

  async function addDoubt(input: NewDoubtInput) {
    const row: LocalDoubtEntry = {
      id: newId(),
      user_id: userId,
      task_id: input.task_id ?? null,
      subject_id: input.subject_id ?? null,
      lesson_id: input.lesson_id ?? null,
      question_text: input.question_text,
      is_resolved: false,
      resolved_at: null,
      created_at: nowISO(),
    };
    await localUpsert("doubt_box_entries", row);
  }

  async function setResolved(doubt: LocalDoubtEntry, resolved: boolean) {
    await localUpsert("doubt_box_entries", {
      ...doubt,
      is_resolved: resolved,
      resolved_at: resolved ? nowISO() : null,
    });
  }

  async function removeDoubt(id: string) {
    await localDelete("doubt_box_entries", id);
  }

  return { doubts, unresolved, addDoubt, setResolved, removeDoubt };
}
