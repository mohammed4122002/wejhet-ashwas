"use client";

import { useMemo, useState } from "react";
import { Plus, Wand2, Check, X } from "lucide-react";
import { useSchedule } from "@/hooks/use-schedule";
import { useCurriculum } from "@/hooks/use-curriculum";
import { useExams } from "@/hooks/use-exams";
import { useHeatmap } from "@/hooks/use-heatmap";
import { useAppUser } from "@/components/app/app-data-provider";
import {
  ScheduleWeekView,
  type DisplaySlot,
} from "@/components/app/schedule-week-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WEEKDAYS_AR } from "@/lib/domain/constants";
import {
  generateWeeklySlots,
  type GeneratedSlot,
  type SchedulableSubject,
} from "@/lib/domain/schedule";

type Mode = "manual" | "assisted" | "auto";

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "manual", label: "يدوي", hint: "أنت تضيف كل فترة بنفسك" },
  { value: "assisted", label: "مساعد", hint: "نقترح جدولاً وتعدّله قبل الاعتماد" },
  { value: "auto", label: "تلقائي", hint: "نبني جدولاً مرجّحاً حسب امتحاناتك ونقاط ضعفك" },
];

export default function SchedulePage() {
  const [mode, setMode] = useState<Mode>("manual");
  const { slots, removeSlot } = useSchedule();
  const { subjects } = useCurriculum();

  const subjectName = useMemo(() => {
    const m = new Map(subjects.map((s) => [s.id, s.name_ar]));
    return (id: string | null) => (id ? m.get(id) : undefined);
  }, [subjects]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 text-text-primary">الجدول الأسبوعي</h1>
        <p className="text-body text-text-secondary">
          اختر طريقة البناء اللي تناسبك — أنت صاحب القرار دائماً.
        </p>
      </header>

      {/* اختيار النظام */}
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value)}
            className={cn(
              "flex flex-col items-start gap-0.5 rounded-card border px-4 py-3 text-start transition-colors",
              mode === m.value
                ? "border-brand-500 bg-bg-raised"
                : "border-strong bg-bg-surface hover:border-brand-400"
            )}
          >
            <span className="text-h3 text-text-primary">{m.label}</span>
            <span className="text-secondary text-text-muted">{m.hint}</span>
          </button>
        ))}
      </div>

      {mode === "manual" ? (
        <ManualMode
          slots={slots}
          onDelete={removeSlot}
          subjectName={subjectName}
        />
      ) : (
        <GeneratorMode mode={mode} subjectName={subjectName} />
      )}
    </div>
  );
}

/* ============ يدوي ============ */
function ManualMode({
  slots,
  onDelete,
  subjectName,
}: {
  slots: DisplaySlot[];
  onDelete: (id: string) => void;
  subjectName: (id: string | null) => string | undefined;
}) {
  return (
    <div className="flex flex-col gap-6">
      <AddSlotForm />
      <ScheduleWeekView
        slots={slots}
        onDelete={onDelete}
        subjectName={subjectName}
      />
    </div>
  );
}

function AddSlotForm() {
  const { addSlot } = useSchedule();
  const { subjects } = useCurriculum();
  const [day, setDay] = useState(0);
  const [start, setStart] = useState("16:00");
  const [end, setEnd] = useState("17:00");
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">أضف فترة</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = title.trim() || (subjects.find((s) => s.id === subjectId)?.name_ar
              ? `مذاكرة ${subjects.find((s) => s.id === subjectId)!.name_ar}`
              : "");
            if (!t) return;
            void addSlot({
              day_of_week: day,
              start_time: start,
              end_time: end,
              title: t,
              subject_id: subjectId || null,
            });
            setTitle("");
          }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div className="flex flex-col gap-1.5">
            <Label>اليوم</Label>
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="h-11 rounded-input border border-strong bg-bg-surface px-3 text-body text-text-primary"
            >
              {WEEKDAYS_AR.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>المادة (اختياري)</Label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="h-11 rounded-input border border-strong bg-bg-surface px-3 text-body text-text-primary"
            >
              <option value="">— بدون مادة —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_ar}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>من</Label>
            <Input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              dir="ltr"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>إلى</Label>
            <Input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              dir="ltr"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>العنوان (اختياري — يُشتق من المادة)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مراجعة وحدة التفاضل"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">
              <Plus aria-hidden /> أضف الفترة
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ============ مساعد + تلقائي ============ */
function GeneratorMode({
  mode,
  subjectName,
}: {
  mode: Mode;
  subjectName: (id: string | null) => string | undefined;
}) {
  const weighted = mode === "auto";
  const { subjects } = useCurriculum();
  const { exams } = useExams();
  const { subjectMastery } = useHeatmap();
  const { replaceWithGenerated } = useSchedule();
  const { autoScheduleApply } = useAppUser();

  const [hours, setHours] = useState<number[]>([2, 2, 2, 2, 2, 0, 2]);
  const [draft, setDraft] = useState<GeneratedSlot[] | null>(null);
  const [applied, setApplied] = useState(false);

  function generate() {
    const examBySubject = new Map(exams.map((e) => [e.subject_id, e.exam_date]));
    const schedulable: SchedulableSubject[] = subjects.map((s) => ({
      id: s.id,
      name: s.name_ar,
      examDate: examBySubject.get(s.id) ?? null,
      masteryRatio: subjectMastery(s.id),
    }));
    const generated = generateWeeklySlots(
      schedulable,
      { freeHoursByDay: hours, sessionLengthHours: 1, startHour: 16 },
      weighted
    );

    // النظام التلقائي مع تفعيل "طبّق تلقائياً" ⇒ اعتماد مباشر بلا مراجعة (خطة §أ.2)
    if (weighted && autoScheduleApply) {
      void replaceWithGenerated(generated);
      setApplied(true);
      setDraft(null);
    } else {
      setDraft(generated);
      setApplied(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-h3">كم ساعة فاضية عندك كل يوم؟</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {WEEKDAYS_AR.map((d, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Label>{d}</Label>
                <Input
                  type="number"
                  min={0}
                  max={12}
                  value={hours[i]}
                  onChange={(e) => {
                    const next = [...hours];
                    next[i] = Math.max(0, Number(e.target.value) || 0);
                    setHours(next);
                  }}
                  className="text-center"
                />
              </div>
            ))}
          </div>
          {weighted && (
            <p className="text-secondary text-text-muted">
              النظام التلقائي يرجّح المواد حسب قرب الامتحان ونقاط الضعف. حدّث
              تواريخ امتحاناتك من قسم «العد التنازلي» لنتيجة أدق.
            </p>
          )}
          <div>
            <Button onClick={generate}>
              <Wand2 aria-hidden /> ولّد اقتراحاً
            </Button>
          </div>
        </CardContent>
      </Card>

      {applied && (
        <p className="rounded-input border border-strong bg-bg-surface px-4 py-3 text-body text-status-done">
          تم اعتماد الجدول تلقائياً (فعّلت «طبّق تلقائياً بدون مراجعة»).
        </p>
      )}

      {/* معاينة المسودة قبل الاعتماد */}
      {draft && (
        <Card className="border-brand-500/40">
          <CardHeader>
            <CardTitle className="text-h3">مسودة مقترحة — تحتاج موافقتك</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {draft.length > 0 ? (
              <ScheduleWeekView slots={draft} subjectName={subjectName} />
            ) : (
              <p className="text-body text-text-muted">
                ما قدرنا نولّد فترات — تأكّد إنك حطّيت ساعات فاضية.
              </p>
            )}
            {draft.length > 0 && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    void replaceWithGenerated(draft);
                    setDraft(null);
                    setApplied(true);
                  }}
                >
                  <Check aria-hidden /> اعتمد هذا الجدول
                </Button>
                <Button variant="secondary" onClick={() => setDraft(null)}>
                  <X aria-hidden /> تجاهل
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
