"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  getDB,
  type LocalSubject,
  type LocalUnit,
  type LocalLesson,
} from "@/lib/db/dexie";
import { useAppUser } from "@/components/app/app-data-provider";

/** المنهج المخزّن محلياً — مواد فرع الطالب + المشتركة، مع وحداتها ودروسها. */
export function useCurriculum() {
  const { track } = useAppUser();

  const subjects = useLiveQuery(
    () =>
      getDB()
        .subjects.where("track")
        .anyOf("shared", track)
        .toArray()
        .then((rows) =>
          rows.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        ),
    [track],
    [] as LocalSubject[]
  );

  const units = useLiveQuery(
    () => getDB().units.toArray(),
    [],
    [] as LocalUnit[]
  );

  const lessons = useLiveQuery(
    () => getDB().lessons.toArray(),
    [],
    [] as LocalLesson[]
  );

  function unitsOf(subjectId: string): LocalUnit[] {
    return units
      .filter((u) => u.subject_id === subjectId)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }

  function lessonsOf(unitId: string): LocalLesson[] {
    return lessons
      .filter((l) => l.unit_id === unitId)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }

  return { subjects, units, lessons, unitsOf, lessonsOf };
}
