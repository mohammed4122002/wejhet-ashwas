"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, Circle } from "lucide-react";
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
        <h1 className="text-h1 text-text-primary">تقدّمك</h1>
        <p className="text-body text-text-secondary">
          يتراكم من إنجازك الحقيقي — مهام مكتملة وأسئلة صحيحة. كل مادة تبدأ فارغة
          وتمتلئ مع الوقت.
        </p>
      </header>

      {subjects.map((s) => {
        const pct = Math.round(subjectMastery(s.id) * 100);
        const units = unitsOf(s.id);
        const isOpen = expanded === s.id;

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
              <CardContent className="flex flex-col gap-4">
                {units.length === 0 && (
                  <p className="text-secondary text-text-muted">
                    لا توجد وحدات لهذه المادة بعد.
                  </p>
                )}
                {units.map((u) => {
                  const p = progress.get(u.id);
                  const lessons = lessonsOf(u.id);
                  return (
                    <div key={u.id} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-h3 text-text-secondary">{u.name_ar}</h3>
                        <span className="text-secondary tabular-nums text-text-muted">
                          {p?.masteredLessons ?? 0}/{p?.totalLessons ?? 0}
                        </span>
                      </div>
                      <ul className="flex flex-col gap-1.5">
                        {lessons.map((l) => {
                          const done = masteredLessonIds.has(l.id);
                          return (
                            <li
                              key={l.id}
                              className="flex items-center gap-2 text-body"
                            >
                              {done ? (
                                <CheckCircle2 className="size-4 text-status-done" aria-hidden />
                              ) : (
                                <Circle className="size-4 text-status-todo" aria-hidden />
                              )}
                              <span className={done ? "text-text-primary" : "text-text-secondary"}>
                                {l.name_ar}
                              </span>
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
