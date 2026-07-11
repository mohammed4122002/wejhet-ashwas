"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDB, type LocalExamSchedule } from "@/lib/db/dexie";
import { localUpsert, localDelete } from "@/lib/db/sync-queue";
import { newId } from "@/lib/db/ids";
import { useUserId } from "@/components/app/app-data-provider";

/** تواريخ الامتحانات (تغذّي العد التنازلي + الجدولة التلقائية). */
export function useExams() {
  const userId = useUserId();

  const exams = useLiveQuery(
    () =>
      getDB()
        .exam_schedule.where("user_id")
        .equals(userId)
        .toArray()
        .then((rows) =>
          rows.sort((a, b) => a.exam_date.localeCompare(b.exam_date))
        ),
    [userId],
    [] as LocalExamSchedule[]
  );

  async function setExam(subjectId: string, examDate: string) {
    // امتحان واحد لكل مادة: حدّث الموجود أو أنشئ جديد
    const existing = exams.find((e) => e.subject_id === subjectId);
    const row: LocalExamSchedule = {
      id: existing?.id ?? newId(),
      user_id: userId,
      subject_id: subjectId,
      exam_date: examDate,
    };
    await localUpsert("exam_schedule", row);
  }

  async function removeExam(id: string) {
    await localDelete("exam_schedule", id);
  }

  return { exams, setExam, removeExam };
}
