// اختبارات وحدة لمنطق الأعمال النقي (الجلسة 2) — بدون شبكة.
// تشغيل: npx tsx domain.test.ts
import assert from "node:assert";
import {
  daysUntil,
  isInCountdownWindow,
  COUNTDOWN_THRESHOLD_DAYS,
} from "./src/lib/domain/countdown";
import { reviewDatesFor, REVIEW_INTERVALS_DAYS } from "./src/lib/domain/spaced-repetition";
import {
  subjectWeight,
  allocateSessions,
  generateWeeklySlots,
  type SchedulableSubject,
} from "./src/lib/domain/schedule";
import { tasksToCreateForDay, carryOverTasks } from "./src/lib/domain/today";
import { masteryRatio, heatLevel } from "./src/lib/domain/heatmap";

let passed = 0;
function ok(name: string, cond: boolean) {
  assert.ok(cond, "FAILED: " + name);
  passed++;
  console.log("  ✓ " + name);
}

const FROM = new Date("2026-07-11T09:00:00");

console.log("countdown:");
ok("daysUntil same day = 0", daysUntil("2026-07-11", FROM) === 0);
ok("daysUntil +10 days", daysUntil("2026-07-21", FROM) === 10);
ok("daysUntil past is negative", daysUntil("2026-07-01", FROM) === -10);
ok("in window at 30d", isInCountdownWindow("2026-08-10", FROM) === true);
ok("not in window at 60d", isInCountdownWindow("2026-09-09", FROM) === false);
ok("not in window when passed", isInCountdownWindow("2026-07-01", FROM) === false);
ok("threshold is 42", COUNTDOWN_THRESHOLD_DAYS === 42);

console.log("spaced-repetition:");
const rd = reviewDatesFor(new Date("2026-07-11T09:00:00"));
ok("3 review dates", rd.length === 3);
ok("intervals 7/14/30", JSON.stringify(REVIEW_INTERVALS_DAYS) === "[7,14,30]");
ok("first review = +7d", rd[0] === "2026-07-18");
ok("second review = +14d", rd[1] === "2026-07-25");
ok("third review = +30d", rd[2] === "2026-08-10");

console.log("schedule weights:");
const strong: SchedulableSubject = { id: "a", name: "A", masteryRatio: 1, examDate: null };
const weak: SchedulableSubject = { id: "b", name: "B", masteryRatio: 0, examDate: null };
ok("assisted: equal weight", subjectWeight(strong, false) === subjectWeight(weak, false));
ok("auto: weaker subject weighs more", subjectWeight(weak, true, FROM) > subjectWeight(strong, true, FROM));
const soonExam: SchedulableSubject = { id: "c", name: "C", examDate: "2026-07-18", masteryRatio: 0.5 };
const farExam: SchedulableSubject = { id: "d", name: "D", examDate: "2026-12-01", masteryRatio: 0.5 };
ok("auto: nearer exam weighs more", subjectWeight(soonExam, true, FROM) > subjectWeight(farExam, true, FROM));

console.log("schedule allocation:");
const subs: SchedulableSubject[] = [
  { id: "a", name: "A", masteryRatio: 0.9 },
  { id: "b", name: "B", masteryRatio: 0.1 },
  { id: "c", name: "C", masteryRatio: 0.5 },
];
const alloc = allocateSessions(subs, 10, true, FROM);
const total = alloc.reduce((s, a) => s + a.count, 0);
ok("allocation sums to total sessions", total === 10);
const weakAlloc = alloc.find((a) => a.subject.id === "b")!.count;
const strongAlloc = alloc.find((a) => a.subject.id === "a")!.count;
ok("weakest subject gets most sessions", weakAlloc >= strongAlloc);
ok("empty subjects → no allocation", allocateSessions([], 10, true).length === 0);
ok("zero sessions → empty", allocateSessions(subs, 0, true).length === 0);

console.log("schedule generation:");
const slots = generateWeeklySlots(
  subs,
  { freeHoursByDay: [2, 2, 2, 2, 2, 0, 2], sessionLengthHours: 1, startHour: 16 },
  true,
  FROM
);
ok("generates 12 slots (2+2+2+2+2+0+2)", slots.length === 12);
ok("friday (5) has no slots", slots.filter((s) => s.day_of_week === 5).length === 0);
ok("slots start at 16:00", slots.some((s) => s.start_time === "16:00"));
ok("slot has 1h length", slots[0].end_time === "17:00" || slots[0].end_time === "18:00");
ok("no free hours → no slots", generateWeeklySlots(subs, { freeHoursByDay: [0,0,0,0,0,0,0] }, true).length === 0);

console.log("today generation:");
const daySlots = [
  { id: "s1", user_id: "u", day_of_week: 6, start_time: "16:00", end_time: "17:00", title: "T1", subject_id: "a", is_recurring: true, created_at: null, updated_at: null },
  { id: "s2", user_id: "u", day_of_week: 0, start_time: "16:00", end_time: "17:00", title: "T2", subject_id: "b", is_recurring: true, created_at: null, updated_at: null },
];
const created = tasksToCreateForDay(daySlots as never, [], 6, "2026-07-11");
ok("only saturday slot generates task", created.length === 1 && created[0].schedule_slot_id === "s1");
const existing = [{ id: "t1", user_id: "u", schedule_slot_id: "s1", lesson_id: null, subject_id: "a", title: "T1", task_date: "2026-07-11", task_type: "study", status: "todo", created_at: null, completed_at: null, updated_at: null }];
ok("no duplicate task if already exists", tasksToCreateForDay(daySlots as never, existing as never, 6, "2026-07-11").length === 0);

const allTasks = [
  { id: "t1", task_date: "2026-07-09", status: "todo" },
  { id: "t2", task_date: "2026-07-10", status: "done" },
  { id: "t3", task_date: "2026-07-11", status: "todo" },
];
const co = carryOverTasks(allTasks as never, "2026-07-11");
ok("carry-over: only past incomplete", co.length === 1 && co[0].id === "t1");

console.log("heatmap:");
ok("ratio 3/4 = 0.75", masteryRatio({ totalLessons: 4, masteredLessons: 3 }) === 0.75);
ok("ratio safe on zero", masteryRatio({ totalLessons: 0, masteredLessons: 0 }) === 0);
ok("ratio capped at 1", masteryRatio({ totalLessons: 2, masteredLessons: 5 }) === 1);
ok("heatLevel 0 at start", heatLevel(0) === 0);
ok("heatLevel 4 at full", heatLevel(1) === 4);
ok("heatLevel rises with ratio", heatLevel(0.3) > heatLevel(0.1));

console.log(`\nALL ${passed} ASSERTIONS PASSED ✓`);
