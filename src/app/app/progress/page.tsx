"use client";

import { useState } from "react";
import { ChevronDown, Check, Target } from "lucide-react";
import { useCurriculum } from "@/hooks/use-curriculum";
import { useHeatmap } from "@/hooks/use-heatmap";
import { useTasks } from "@/hooks/use-tasks";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { masteryRatio } from "@/lib/domain/heatmap";
import { cn } from "@/lib/utils";

export default function ProgressPage() {
  const { subjects, unitsOf, lessonsOf } = useCurriculum();
  const { progress, subjectMastery, masteredLessonIds } = useHeatmap();
  const { toggleLessonDone } = useTasks();
  const [openSubject, setOpenSubject] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 text-text-primary">خارطة رحلتك</h1>
        <p className="text-body text-text-secondary">
          فهرس موادك — علّم كل درس تخلّصه ✓، وشوف تقدّمك يمتلئ محطة بعد محطة نحو
          الوجهة.
        </p>
      </header>

      {subjects.map((s) => {
        const pct = Math.round(subjectMastery(s.id) * 100);
        const units = unitsOf(s.id);
        const isOpen = openSubject === s.id;

        // أضعف وحدة بدأ فيها (للتركيز)
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
                onClick={() => setOpenSubject(isOpen ? null : s.id)}
                className="flex w-full flex-col gap-2"
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
                <div className="h-2 w-full overflow-hidden rounded-pill bg-bg-raised">
                  <div
                    className="h-full rounded-pill bg-brand-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            </CardHeader>

            {isOpen && (
              <CardContent className="flex flex-col gap-5">
                {units.length === 0 && (
                  <p className="text-secondary text-text-muted">
                    لا توجد وحدات لهذه المادة بعد.
                  </p>
                )}

                {units.map((u) => {
                  const p = progress.get(u.id);
                  const lessons = lessonsOf(u.id);
                  const isFocus = focusUnitId === u.id;

                  return (
                    <div key={u.id} className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <h3 className="text-h3 text-text-secondary">{u.name_ar}</h3>
                          {isFocus && (
                            <span className="inline-flex items-center gap-1 rounded-pill bg-accent-copper/10 px-2 py-0.5 text-secondary text-accent-copper">
                              <Target className="size-3" aria-hidden />
                              ركّز هنا
                            </span>
                          )}
                        </span>
                        <span className="text-secondary tabular-nums text-text-muted">
                          {p?.masteredLessons ?? 0}/{p?.totalLessons ?? 0}
                        </span>
                      </div>

                      {/* دروس الوحدة كعناصر فهرس قابلة للتعليم */}
                      <ul className="flex flex-col">
                        {lessons.map((l) => {
                          const done = masteredLessonIds.has(l.id);
                          return (
                            <li key={l.id}>
                              <button
                                type="button"
                                onClick={() =>
                                  void toggleLessonDone(l.id, l.name_ar, s.id, !done)
                                }
                                className="flex w-full items-center gap-3 rounded-input px-2 py-2.5 text-start transition-colors hover:bg-bg-raised"
                              >
                                <span
                                  className={cn(
                                    "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                                    done
                                      ? "border-status-done bg-status-done text-text-on-brand"
                                      : "border-strong bg-transparent"
                                  )}
                                >
                                  {done && <Check className="size-3.5" aria-hidden />}
                                </span>
                                <span
                                  className={cn(
                                    "text-body",
                                    done
                                      ? "text-text-muted line-through"
                                      : "text-text-primary"
                                  )}
                                >
                                  {l.name_ar}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
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
