"use client";

import type { RewardProgress } from "@/lib/domain/rewards";
import { cn } from "@/lib/utils";

/**
 * قالب "بناء مدينة" — كل درس مُتقن يضيف مبنى للحيّ.
 */
export function CityBuilder({ progress }: { progress: RewardProgress }) {
  const built = progress.completedTasks; // كل مهمة مُنجزة تضيف مبنى
  const total = Math.max(12, built, progress.totalLessons);
  const buildings = Array.from({ length: total });
  const heights = [64, 96, 48, 112, 80, 56, 100, 72]; // ارتفاعات متنوّعة

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-72 items-end gap-1.5 overflow-x-auto rounded-card border border-subtle bg-bg-base p-4">
        {buildings.map((_, i) => {
          const isBuilt = i < built;
          const h = heights[i % heights.length];
          return (
            <div
              key={i}
              className={cn(
                "relative w-8 shrink-0 rounded-t transition-all",
                isBuilt ? "bg-brand-500 shadow-glow-brand" : "bg-bg-surface border border-strong"
              )}
              style={{ height: h }}
            >
              {/* نوافذ */}
              {isBuilt && (
                <div className="absolute inset-x-1 top-2 grid grid-cols-2 gap-1">
                  {Array.from({ length: 4 }).map((__, w) => (
                    <span key={w} className="h-1.5 rounded-sm bg-brand-glow/70" />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center text-secondary text-text-secondary">
        بنيت {built} مبنى · كل مهمة تنجزها تضيف مبنى
      </p>
    </div>
  );
}
