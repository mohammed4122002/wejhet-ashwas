"use client";

import { useMemo } from "react";
import { CalendarClock, Flame, AlertTriangle } from "lucide-react";
import { useExams } from "@/hooks/use-exams";
import { useCurriculum } from "@/hooks/use-curriculum";
import { useHeatmap } from "@/hooks/use-heatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  daysUntil,
  isInCountdownWindow,
  COUNTDOWN_THRESHOLD_DAYS,
} from "@/lib/domain/countdown";
import { masteryRatio } from "@/lib/domain/heatmap";
import { todayISO } from "@/lib/db/ids";
import { cn } from "@/lib/utils";

export default function ExamsPage() {
  const { exams, setExam } = useExams();
  const { subjects, unitsOf } = useCurriculum();
  const { progress } = useHeatmap();

  const examBySubject = useMemo(
    () => new Map(exams.map((e) => [e.subject_id, e])),
    [exams]
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 text-text-primary">العد التنازلي</h1>
        <p className="text-body text-text-secondary">
          حدّد تواريخ امتحاناتك. لما يقترب امتحان مادة (٦ أسابيع أو أقل)، بنرتّبلك
          وحداتها من الأضعف للأقوى.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {subjects.map((s) => {
          const exam = examBySubject.get(s.id);
          const d = exam ? daysUntil(exam.exam_date) : null;
          const countdown = exam
            ? isInCountdownWindow(exam.exam_date)
            : false;

          // وحدات المادة مرتّبة من الأضعف (أولوية المراجعة)
          const units = unitsOf(s.id)
            .map((u) => {
              const p = progress.get(u.id);
              return {
                unit: u,
                ratio: p ? masteryRatio(p) : 0,
                mastered: p?.masteredLessons ?? 0,
                total: p?.totalLessons ?? 0,
              };
            })
            .sort((a, b) => a.ratio - b.ratio);

          return (
            <Card
              key={s.id}
              className={cn(countdown && "border-brand-500/50 shadow-glow-brand")}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    {countdown && (
                      <Flame className="size-5 text-brand-500" aria-hidden />
                    )}
                    {s.name_ar}
                  </CardTitle>
                  {d !== null && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-secondary tabular-nums",
                        countdown
                          ? "bg-status-progress/10 text-brand-400"
                          : d < 0
                            ? "bg-bg-raised text-text-muted"
                            : "bg-bg-raised text-text-secondary"
                      )}
                    >
                      <CalendarClock className="size-4" aria-hidden />
                      {d < 0
                        ? "انتهى"
                        : d === 0
                          ? "اليوم!"
                          : `باقي ${d} يوم`}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`exam-${s.id}`}>تاريخ الامتحان</Label>
                  <Input
                    id={`exam-${s.id}`}
                    type="date"
                    dir="ltr"
                    min={todayISO()}
                    value={exam?.exam_date ?? ""}
                    onChange={(e) =>
                      e.target.value && setExam(s.id, e.target.value)
                    }
                    className="w-56"
                  />
                </div>

                {countdown && (
                  <div className="flex flex-col gap-2 rounded-input border border-strong bg-bg-surface p-4">
                    <p className="flex items-center gap-2 text-body text-brand-400">
                      <AlertTriangle className="size-4" aria-hidden />
                      وضع المراجعة المكثّفة — الأضعف أولاً
                    </p>
                    {units.length > 0 ? (
                      <ul className="flex flex-col gap-2">
                        {units.map(({ unit, ratio, mastered, total }) => (
                          <li
                            key={unit.id}
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="text-body text-text-primary">
                              {unit.name_ar}
                            </span>
                            <span className="text-secondary tabular-nums text-text-secondary">
                              {mastered}/{total} · {Math.round(ratio * 100)}%
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-secondary text-text-muted">
                        لا توجد وحدات لهذه المادة بعد.
                      </p>
                    )}
                  </div>
                )}

                {d !== null && d >= 0 && !countdown && (
                  <p className="text-secondary text-text-muted">
                    وضع المراجعة المكثّفة بينفتح تلقائياً لما يصير باقي{" "}
                    {COUNTDOWN_THRESHOLD_DAYS} يوم أو أقل.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
