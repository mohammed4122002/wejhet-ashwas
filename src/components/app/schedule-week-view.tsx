"use client";

import { Trash2, Clock } from "lucide-react";
import { WEEKDAYS_AR } from "@/lib/domain/constants";
import { Card } from "@/components/ui/card";

export interface DisplaySlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  title: string;
  subject_id: string | null;
}

/** عرض الجدول الأسبوعي مجمّعاً حسب اليوم (يُستخدم للعرض والمعاينة). */
export function ScheduleWeekView({
  slots,
  onDelete,
  subjectName,
}: {
  slots: DisplaySlot[];
  onDelete?: (id: string) => void;
  subjectName?: (id: string | null) => string | undefined;
}) {
  if (slots.length === 0) {
    return (
      <p className="text-body text-text-muted">لا توجد فترات بعد.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {WEEKDAYS_AR.map((dayName, day) => {
        const daySlots = slots
          .filter((s) => s.day_of_week === day)
          .sort((a, b) => a.start_time.localeCompare(b.start_time));
        if (daySlots.length === 0) return null;
        return (
          <div key={day} className="flex flex-col gap-2">
            <h3 className="text-h3 text-brand-400">{dayName}</h3>
            <div className="flex flex-col gap-2">
              {daySlots.map((s, i) => (
                <Card
                  key={s.id ?? `${day}-${i}`}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-pill bg-bg-raised px-2.5 py-1 text-secondary tabular-nums text-text-secondary">
                      <Clock className="size-3.5" aria-hidden />
                      {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-body text-text-primary">
                        {s.title}
                      </span>
                      {subjectName?.(s.subject_id) && (
                        <span className="text-secondary text-text-muted">
                          {subjectName(s.subject_id)}
                        </span>
                      )}
                    </div>
                  </div>
                  {onDelete && s.id && (
                    <button
                      type="button"
                      onClick={() => onDelete(s.id!)}
                      className="rounded-pill p-1.5 text-text-muted transition-colors hover:text-brand-400"
                      aria-label="حذف الفترة"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
