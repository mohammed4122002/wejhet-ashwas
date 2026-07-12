"use client";

import { masteryRatio } from "@/lib/domain/heatmap";
import type { RewardProgress } from "@/lib/domain/rewards";
import { Card, CardContent } from "@/components/ui/card";

/**
 * قالب "بسيط بدون رسوم" — أرقام ونسب فقط، لمين ما بحب التلعيب.
 */
export function Minimal({ progress }: { progress: RewardProgress }) {
  const pct = Math.round(progress.overallRatio * 100);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="التقدّم العام" value={`${pct}%`} />
        <Stat
          label="دروس متقنة"
          value={`${progress.masteredLessons}/${progress.totalLessons}`}
        />
        <Stat
          label="وحدات مكتملة"
          value={`${progress.masteredUnits}/${progress.totalUnits}`}
        />
        <Stat label="متبقٍّ" value={`${progress.totalLessons - progress.masteredLessons}`} />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          {progress.units
            .filter((u) => u.totalLessons > 0)
            .map((u) => (
              <div key={u.unitId} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-secondary">
                  <span className="text-text-secondary">{u.unitName}</span>
                  <span className="tabular-nums text-text-muted">
                    {u.masteredLessons}/{u.totalLessons}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-pill bg-bg-raised">
                  <div
                    className="h-full rounded-pill bg-brand-500"
                    style={{ width: `${Math.round(masteryRatio(u) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-card border border-subtle bg-bg-surface p-4">
      <span className="text-h1 tabular-nums text-brand-400">{value}</span>
      <span className="text-secondary text-text-muted">{label}</span>
    </div>
  );
}
