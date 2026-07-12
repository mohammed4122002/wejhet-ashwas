"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, Circle, Target } from "lucide-react";
import { useCurriculum } from "@/hooks/use-curriculum";
import { useHeatmap } from "@/hooks/use-heatmap";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { masteryRatio, heatLevel } from "@/lib/domain/heatmap";
import { cn } from "@/lib/utils";

/** لون خلية الخريطة الحرارية حسب درجة التشبّع (design.md §6). */
const HEAT: Record<number, string> = {
  0: "bg-bg-surface border border-strong",
  1: "bg-brand-500/20",
  2: "bg-brand-500/40",
  3: "bg-brand-500/70",
  4: "bg-brand-500",
};

export default function ProgressPage() {
  const { subjects, unitsOf, lessonsOf } = useCurriculum();
  const { progress, subjectMastery, masteredLessonIds } = useHeatmap();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 text-text-primary">خارطة رحلتك</h1>
        <p className="text-body text-text-secondary">
          كل وحدة محطة على طريقك — تُنجَز من مهامك الحقيقية وأسئلتك الصحيحة، محطة
          بعد محطة حتى الوجهة.
        </p>
      </header>

      {subjects.map((s) => {
        const pct = Math.round(subjectMastery(s.id) * 100);
        const units = unitsOf(s.id);
        const isOpen = expanded === s.id;

        // أضعف محطة بدأ فيها (0 < إتقان < 1) — «ركّز هنا»
        const startedRatios = units
          .map((u) => {
            const p = progress.get(u.id);
            return { id: u.id, ratio: p ? masteryRatio(p) : 0, started: (p?.masteredLessons ?? 0) > 0 };
          })
          .filter((x) => x.started && x.ratio < 1);
        const focusUnitId = startedRatios.length
          ? startedRatios.reduce((a, b) => (a.ratio <= b.ratio ? a : b)).id
          : null;

        return (
          <Card key={s.id}>
            <CardHeader>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : s.id)}
                className="flex w-full flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-h3 text-text-primary">{s.name_ar}</span>
                  <span className="flex items-center gap-2 text-secondary text-text-secondary">
                    {pct}%
                    <ChevronDown
                      className={cn("size-4 transition-transform", isOpen && "rotate-180")}
                      aria-hidden
                    />
                  </span>
                </div>
                {/* شريط التقدّم */}
                <div className="h-2 w-full overflow-hidden rounded-pill bg-bg-raised">
                  <div
                    className="h-full rounded-pill bg-brand-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {/* خريطة حرارية: خلية لكل وحدة */}
                <div className="flex flex-wrap gap-1.5">
                  {units.map((u) => {
                    const p = progress.get(u.id);
                    const level = p ? heatLevel(masteryRatio(p)) : 0;
                    return (
                      <span
                        key={u.id}
                        title={`${u.name_ar}: ${p?.masteredLessons ?? 0}/${p?.totalLessons ?? 0}`}
                        className={cn("size-6 rounded", HEAT[level])}
                      />
                    );
                  })}
                </div>
              </button>
            </CardHeader>

            {isOpen && (
              <CardContent className="flex flex-col">
                {units.length === 0 && (
                  <p className="text-secondary text-text-muted">
                    لا توجد وحدات لهذه المادة بعد.
                  </p>
                )}

                {/* مسار المحطات — وحدة بوحدة نحو الوجهة */}
                {units.map((u, idx) => {
                  const p = progress.get(u.id);
                  const ratio = p ? masteryRatio(p) : 0;
                  const unitPct = Math.round(ratio * 100);
                  const isDone = (p?.totalLessons ?? 0) > 0 && ratio >= 1;
                  const started = ratio > 0 && !isDone;
                  const isFocus = focusUnitId === u.id;
                  const isLast = idx === units.length - 1;
                  const lessons = lessonsOf(u.id);

                  return (
                    <div key={u.id} className="flex gap-3">
                      {/* عمود المحطة: رقم + خط واصل */}
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-pill text-secondary font-medium tabular-nums transition-colors",
                            isDone
                              ? "bg-status-done text-text-on-brand shadow-glow-success"
                              : started
                                ? "bg-brand-500 text-text-on-brand shadow-glow-brand"
                                : "border border-strong bg-bg-raised text-text-muted"
                          )}
                        >
                          {isDone ? <CheckCircle2 className="size-4" aria-hidden /> : idx + 1}
                        </span>
                        {!isLast && (
                          <div
                            className={cn(
                              "w-px flex-1 border-s",
                              isDone ? "border-status-done/40" : "border-subtle"
                            )}
                          />
                        )}
                      </div>

                      {/* محتوى المحطة */}
                      <div className={cn("flex min-w-0 flex-1 flex-col gap-2", !isLast && "pb-6")}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <h3 className="text-h3 text-text-primary">{u.name_ar}</h3>
                            {isFocus && (
                              <span className="inline-flex items-center gap-1 rounded-pill bg-accent-copper/10 px-2 py-0.5 text-secondary text-accent-copper">
                                <Target className="size-3" aria-hidden />
                                ركّز هنا
                              </span>
                            )}
                          </span>
                          <span className="text-secondary tabular-nums text-text-muted">
                            {p?.masteredLessons ?? 0}/{p?.totalLessons ?? 0} · {unitPct}%
                          </span>
                        </div>

                        <div className="h-1.5 w-full overflow-hidden rounded-pill bg-bg-raised">
                          <div
                            className={cn(
                              "h-full rounded-pill transition-all",
                              isDone ? "bg-status-done" : "bg-brand-500"
                            )}
                            style={{ width: `${unitPct}%` }}
                          />
                        </div>

                        <ul className="flex flex-col gap-1.5">
                          {lessons.map((l) => {
                            const done = masteredLessonIds.has(l.id);
                            return (
                              <li key={l.id} className="flex items-center gap-2 text-body">
                                {done ? (
                                  <CheckCircle2 className="size-4 shrink-0 text-status-done" aria-hidden />
                                ) : (
                                  <Circle className="size-4 shrink-0 text-status-todo" aria-hidden />
                                )}
                                <span className={done ? "text-text-primary" : "text-text-secondary"}>
                                  {l.name_ar}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
