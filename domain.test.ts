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
import { weakestLesson, scoreMock, type MockQuestion } from "./src/lib/domain/quiz";
import {
  buildRewardProgress,
  litCityCount,
  growthStage,
  evaluateBadges,
  longestStreak,
  PALESTINE_CITIES,
} from "./src/lib/domain/rewards";
import { buildReminders } from "./src/lib/domain/reminders";
import { currentStreak } from "./src/lib/domain/rewards";
import {
  nextStep,
  buildChecklist,
  checklistComplete,
  type NextStepInput,
} from "./src/lib/domain/next-step";
import type { UnitProgress } from "./src/lib/domain/heatmap";

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

console.log("quiz — weakest lesson:");
const wl = weakestLesson([
  { lessonId: "L1", lessonName: "درس أ", isCorrect: true },
  { lessonId: "L1", lessonName: "درس أ", isCorrect: true },
  { lessonId: "L2", lessonName: "درس ب", isCorrect: false },
  { lessonId: "L2", lessonName: "درس ب", isCorrect: false },
]);
ok("weakest lesson is L2", wl?.lessonId === "L2");
ok("weakest ratio 0", wl?.ratio === 0);
ok("weakest lesson null on empty", weakestLesson([]) === null);
ok("skips null lessonId", weakestLesson([{ lessonId: null, isCorrect: false }]) === null);

console.log("quiz — mock scoring:");
const mq: MockQuestion[] = [
  { id: "q1", unit_id: "U1", unit_name: "و1", correct_answer: "a" },
  { id: "q2", unit_id: "U1", unit_name: "و1", correct_answer: "b" },
  { id: "q3", unit_id: "U2", unit_name: "و2", correct_answer: "c" },
  { id: "q4", unit_id: "U2", unit_name: "و2", correct_answer: "d" },
];
const mres = scoreMock({ q1: "a", q2: "x", q3: "c", q4: "d" }, mq);
ok("mock score 75%", mres.scorePercent === 75);
ok("mock correct 3/4", mres.correct === 3 && mres.total === 4);
ok("weakest unit first (U1)", mres.weaknessByUnit[0].unitId === "U1");
ok("U1 ratio 0.5", mres.weaknessByUnit[0].ratio === 0.5);
ok("U2 ratio 1.0", mres.weaknessByUnit[1].ratio === 1);
const empty = scoreMock({}, []);
ok("empty mock = 0%", empty.scorePercent === 0 && empty.total === 0);

console.log("rewards — progress:");
const ru: UnitProgress[] = [
  { unitId: "u1", unitName: "و1", totalLessons: 4, masteredLessons: 4 }, // مكتملة
  { unitId: "u2", unitName: "و2", totalLessons: 4, masteredLessons: 2 },
  { unitId: "u3", unitName: "و3", totalLessons: 2, masteredLessons: 0 },
];
const rp = buildRewardProgress(ru, 7);
ok("total lessons 10", rp.totalLessons === 10);
ok("mastered lessons 6", rp.masteredLessons === 6);
ok("mastered units 1", rp.masteredUnits === 1);
ok("total units 3", rp.totalUnits === 3);
ok("overall ratio 0.6", rp.overallRatio === 0.6);
ok("completed tasks passed through", rp.completedTasks === 7);
ok("empty progress safe", buildRewardProgress([]).overallRatio === 0);
ok("completed tasks defaults 0", buildRewardProgress([]).completedTasks === 0);

console.log("rewards — templates helpers:");
ok("lit cities scales with ratio", litCityCount(0.5) === Math.floor(0.5 * PALESTINE_CITIES.length));
ok("lit cities 0 at start", litCityCount(0) === 0);
ok("lit cities capped", litCityCount(1) === PALESTINE_CITIES.length);
ok("growth stage 0 at 0", growthStage(0) === 0);
ok("growth stage grows", growthStage(1) === 5);
ok("growth stage mid", growthStage(0.5) >= 3);

console.log("rewards — badges + streak:");
ok("no streak on empty", longestStreak([]) === 0);
ok("streak counts consecutive", longestStreak(["2026-07-09", "2026-07-10", "2026-07-11"]) === 3);
ok("streak breaks on gap", longestStreak(["2026-07-01", "2026-07-10", "2026-07-11"]) === 2);
ok("streak dedups", longestStreak(["2026-07-10", "2026-07-10"]) === 1);
const badges = evaluateBadges({ completedTasks: 10, overallRatio: 0.6, streakDays: 7, bestMockPercent: 100 });
ok("first_task earned", badges.find((b) => b.id === "first_task")?.earned === true);
ok("ten_tasks earned at 10", badges.find((b) => b.id === "ten_tasks")?.earned === true);
ok("week_streak earned at 7", badges.find((b) => b.id === "week_streak")?.earned === true);
ok("mock_ace earned at 100", badges.find((b) => b.id === "mock_ace")?.earned === true);
const noBadges = evaluateBadges({ completedTasks: 0, overallRatio: 0, streakDays: 0, bestMockPercent: 40 });
ok("nothing earned at zero", noBadges.every((b) => !b.earned));

console.log("reminders:");
const allFlags = { study_reminders: true, motivational_reminders: true, religious_reminders: true };
const rem = buildReminders({ todayTodo: 2, overdue: 1, doneToday: 3, unresolvedDoubts: 3, flags: allFlags });
ok("has overdue study reminder", rem.some((r) => r.id === "overdue" && r.layer === "study"));
ok("has motivational done", rem.some((r) => r.id === "done-today" && r.layer === "motivational"));
ok("has religious dua when enabled", rem.some((r) => r.layer === "religious"));
const offFlags = { study_reminders: false, motivational_reminders: false, religious_reminders: false };
ok("no reminders when all off", buildReminders({ todayTodo: 5, overdue: 5, doneToday: 5, unresolvedDoubts: 5, flags: offFlags }).length === 0);
ok("doubts reminder only at >=3", buildReminders({ todayTodo: 0, overdue: 0, doneToday: 1, unresolvedDoubts: 2, flags: allFlags }).every((r) => r.id !== "doubts"));

console.log("next-step (guidance priorities):");
const base: NextStepInput = {
  hasSchedule: true,
  overdue: 0,
  todayTodo: 0,
  todayDone: 2,
  weakestStartedUnit: null,
  unresolvedDoubts: 0,
  hasDownloadedQuestions: true,
};
ok("no schedule → build-schedule", nextStep({ ...base, hasSchedule: false }).id === "build-schedule");
ok("overdue beats today", nextStep({ ...base, overdue: 2, todayTodo: 3 }).id === "clear-overdue");
ok("today todo → focus-today", nextStep({ ...base, todayTodo: 3 }).id === "focus-today");
ok("weak unit (<0.6) → strengthen", nextStep({ ...base, weakestStartedUnit: { unitName: "و", ratio: 0.3 } }).id === "strengthen-weakest");
ok("strong unit (≥0.6) skipped", nextStep({ ...base, weakestStartedUnit: { unitName: "و", ratio: 0.8 } }).id === "day-done");
ok("3+ doubts → take-doubts", nextStep({ ...base, unresolvedDoubts: 3 }).id === "take-doubts");
ok("no downloads → download-bank", nextStep({ ...base, hasDownloadedQuestions: false }).id === "download-bank");
ok("all clear → day-done", nextStep(base).id === "day-done");

console.log("getting-started checklist:");
const cl = buildChecklist({ hasSchedule: true, completedTasks: 0, pomodoroCount: 0, hasDownloadedQuestions: false });
ok("4 checklist items", cl.length === 4);
ok("schedule marked done", cl.find((i) => i.id === "schedule")?.done === true);
ok("incomplete when steps remain", checklistComplete(cl) === false);
ok("complete when all done", checklistComplete(buildChecklist({ hasSchedule: true, completedTasks: 1, pomodoroCount: 1, hasDownloadedQuestions: true })) === true);

console.log("current streak:");
ok("counts chain ending today", currentStreak(["2026-07-10", "2026-07-11", "2026-07-12"], "2026-07-12") === 3);
ok("today not done yet → yesterday chain holds", currentStreak(["2026-07-10", "2026-07-11"], "2026-07-12") === 2);
ok("gap breaks current streak", currentStreak(["2026-07-08"], "2026-07-12") === 0);
ok("empty → 0", currentStreak([], "2026-07-12") === 0);

console.log(`\nALL ${passed} ASSERTIONS PASSED ✓`);
