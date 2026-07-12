"use client";

import { CheckCircle2, Flame, Timer } from "lucide-react";
import { usePrefs } from "@/hooks/use-prefs";
import { useDailyStats } from "@/hooks/use-daily-stats";
import { WEEKDAYS_AR } from "@/lib/domain/constants";
import { todayISO } from "@/lib/db/ids";
import { cn } from "@/lib/utils";

/** ترويسة اليوم: تحية شخصية + ثلاث إحصائيات حيّة تحفّز بلا ضغط. */
export function TodayHero() {
  const { displayName } = usePrefs();
  const s = useDailyStats();

  const now = new Date();
  const greeting = now.getHours() < 12 ? "صباح الخير" : "مساء الخير";
  const allDone = s.todayTotal > 0 && s.todayDone >= s.todayTotal;

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-text-primary">
          {greeting}
          {displayName ? `، ${displayName}` : ""} 👋
        </h1>
        <p className="text-body text-text-secondary">
          {WEEKDAYS_AR[now.getDay()]} · {todayISO()}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile
          icon={<CheckCircle2 className={cn("size-4", allDone ? "text-status-done" : "text-brand-400")} aria-hidden />}
          value={`${s.todayDone}/${s.todayTotal}`}
          label="مهام اليوم"
          highlight={allDone}
        />
        <StatTile
          icon={<Flame className={cn("size-4", s.streak > 0 ? "text-brand-500" : "text-text-muted")} aria-hidden />}
          value={`${s.streak}`}
          label={s.streak === 1 ? "يوم متواصل" : "أيام متواصلة"}
          highlight={s.streak >= 3}
        />
        <StatTile
          icon={<Timer className="size-4 text-accent-copper" aria-hidden />}
          value={`${s.focusMinutes}`}
          label="دقيقة تركيز"
        />
      </div>
    </header>
  );
}

function StatTile({
  icon,
  value,
  label,
  highlight,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-card border bg-bg-surface p-3",
        highlight ? "border-brand-500/40 shadow-glow-brand" : "border-subtle"
      )}
    >
      <span className="text-h2 tabular-nums text-text-primary">{value}</span>
      <span className="flex items-center gap-1 text-secondary text-text-muted">
        {icon}
        {label}
      </span>
    </div>
  );
}
