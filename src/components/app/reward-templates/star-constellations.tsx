"use client";

import { masteryRatio } from "@/lib/domain/heatmap";
import { constellationName } from "@/lib/domain/rewards";
import type { RewardProgress } from "@/lib/domain/rewards";
import { cn } from "@/lib/utils";

/**
 * قالب "النجوم والأبراج" (الافتراضي) — design.md §6.
 * كل درس مُتقن يُضيء نجمة، وكل وحدة مكتملة تصير كوكبة باسمها.
 */
export function StarConstellations({ progress }: { progress: RewardProgress }) {
  const total = Math.max(progress.totalLessons, 1);
  const stars = Array.from({ length: total });
  const masteredUnits = progress.units.filter(
    (u) => u.totalLessons > 0 && masteryRatio(u) >= 1
  );

  return (
    <div className="flex flex-col gap-4">
      {/* سماء ليلية */}
      <div className="relative h-72 w-full overflow-hidden rounded-card border border-subtle bg-bg-base">
        {stars.map((_, i) => {
          const lit = i < progress.masteredLessons;
          const top = (i * 57 + 11) % 92;
          const left = (i * 97 + 7) % 94;
          return (
            <span
              key={i}
              className={cn(
                "absolute rounded-full transition-all",
                lit ? "bg-brand-glow shadow-glow-brand" : "bg-text-muted/30"
              )}
              style={{
                top: `${top}%`,
                left: `${left}%`,
                width: lit ? 9 : 5,
                height: lit ? 9 : 5,
              }}
            />
          );
        })}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg-base to-transparent p-4 text-center">
          <span className="text-secondary text-text-secondary">
            {progress.masteredLessons} من {progress.totalLessons} نجمة مضيئة
          </span>
        </div>
      </div>

      {/* الكوكبات المكتملة */}
      {masteredUnits.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {masteredUnits.map((u) => (
            <span
              key={u.unitId}
              className="inline-flex items-center gap-1.5 rounded-pill border border-strong bg-bg-surface px-3 py-1.5 text-secondary text-accent-copper"
            >
              ✦ {constellationName(u.unitName)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
