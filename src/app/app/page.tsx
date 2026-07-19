"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, CalendarPlus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTasks } from "@/hooks/use-tasks";
import { useSchedule } from "@/hooks/use-schedule";
import { useCurriculum } from "@/hooks/use-curriculum";
import { RemindersPanel } from "@/components/app/reminders-panel";
import { TodayHero } from "@/components/app/today-hero";
import { GuidePanel } from "@/components/app/guide-panel";
import { MotivationalQuote } from "@/components/app/motivational-quote";
import { TaskCard } from "@/components/app/task-card";
import { TaskDoneToast, useTaskDoneToast } from "@/components/app/task-done-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { todayISO } from "@/lib/db/ids";
import { fireTaskComplete, fireAllDayComplete } from "@/lib/confetti";

export default function TodayPage() {
  const {
    tasksForDate,
    carryOver,
    ensureTodayGenerated,
    setStatus,
    postponeToToday,
    removeTask,
    addTask,
  } = useTasks();
  const { slots } = useSchedule();
  const { subjects } = useCurriculum();
  const { message: toastMsg, triggerToast } = useTaskDoneToast();

  const subjectName = useMemo(() => {
    const m = new Map(subjects.map((s) => [s.id, s.name_ar]));
    return (id: string | null) => (id ? m.get(id) : undefined);
  }, [subjects]);

  // محاكاة اليوم الفعلي: كل مهمة بوقتها من الجدول، مرتّبة بترتيب يومك الحقيقي
  const slotTime = useMemo(
    () => new Map(slots.map((s) => [s.id, s.start_time.slice(0, 5)])),
    [slots]
  );
  const orderedToday = useMemo(() => {
    const timeOf = (t: (typeof tasksForDate)[number]) =>
      (t.schedule_slot_id && slotTime.get(t.schedule_slot_id)) || "99:99";
    return [...tasksForDate].sort(
      (a, b) =>
        timeOf(a).localeCompare(timeOf(b)) ||
        (a.created_at ?? "").localeCompare(b.created_at ?? "")
    );
  }, [tasksForDate, slotTime]);

  // توليد مهام اليوم من الجدول (بدون تكرار) عند توفّر الفترات
  useEffect(() => {
    void ensureTodayGenerated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots.length]);

  async function handleStatusChange(task: Parameters<typeof setStatus>[0], next: Parameters<typeof setStatus>[1]) {
    await setStatus(task, next);
    if (next === "done") {
      triggerToast();
      const remaining = tasksForDate.filter((t) => t.id !== task.id && t.status !== "done");
      if (remaining.length === 0 && tasksForDate.length > 0) {
        void fireAllDayComplete();
      } else {
        void fireTaskComplete();
      }
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <TaskDoneToast message={toastMsg} />

      {/* عبارة تحفيزية */}
      <MotivationalQuote />

      {/* تحية شخصية + إحصائيات اليوم الحيّة */}
      <TodayHero />

      {/* خارطة البداية (طالب جديد) أو الخطوة التالية الذكية */}
      <GuidePanel />

      {/* التذكيرات ثلاثية الطبقة (خطة §أ.8) */}
      <RemindersPanel />

      {/* متراكم من أمس */}
      {carryOver.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-h2 text-text-primary">متراكم من قبل</h2>
          <p className="text-secondary text-text-muted">
            مهام فاتت — أجّلها لليوم أو احذفها، بدون ضغط.
          </p>
          <div className="flex flex-col gap-3">
            {carryOver.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                subjectName={subjectName(t.subject_id)}
                onStatusChange={handleStatusChange}
                onPostpone={postponeToToday}
                onDelete={removeTask}
              />
            ))}
          </div>
        </section>
      )}

      {/* مهام اليوم */}
      <section className="flex flex-col gap-3">
        <h2 className="text-h2 text-text-primary">مهام اليوم</h2>

        <AddTaskInline
          onAdd={(title) => addTask({ title, task_date: todayISO() })}
        />

        {orderedToday.length > 0 ? (
          <div className="flex flex-col gap-3">
            {orderedToday.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                subjectName={subjectName(t.subject_id)}
                timeLabel={
                  t.schedule_slot_id ? slotTime.get(t.schedule_slot_id) : undefined
                }
                onStatusChange={handleStatusChange}
                onDelete={removeTask}
              />
            ))}
          </div>
        ) : (
          <EmptyToday hasSchedule={slots.length > 0} />
        )}
      </section>
    </div>
  );
}

function AddTaskInline({ onAdd }: { onAdd: (title: string) => void }) {
  const [title, setTitle] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const t = title.trim();
        if (!t) return;
        onAdd(t);
        setTitle("");
      }}
      className="flex items-center gap-2"
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="أضف مهمة سريعة لليوم..."
      />
      <Button type="submit" size="icon" aria-label="إضافة مهمة">
        <Plus aria-hidden />
      </Button>
    </form>
  );
}

function EmptyToday({ hasSchedule }: { hasSchedule: boolean }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        {hasSchedule ? (
          <>
            <Sparkles className="size-8 text-brand-400" aria-hidden />
            <p className="text-body text-text-secondary">
              ما في مهام مجدولة لليوم. أضف مهمة سريعة من فوق، أو استمتع باستراحة.
            </p>
          </>
        ) : (
          <>
            <CalendarPlus className="size-8 text-brand-400" aria-hidden />
            <p className="text-body text-text-secondary">
              لسا ما عندك جدول. ابنِ جدولك الأسبوعي وبتنولّد مهامك اليومية تلقائياً.
            </p>
            <Button asChild>
              <Link href="/app/schedule">ابنِ جدولك</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
