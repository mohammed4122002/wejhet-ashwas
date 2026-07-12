"use client";

import { growthStage } from "@/lib/domain/rewards";
import type { RewardProgress } from "@/lib/domain/rewards";

const STAGE_LABEL = [
  "بذرة",
  "برعم",
  "شتلة",
  "شجرة صغيرة",
  "شجرة يانعة",
  "شجرة مثمرة",
];

/**
 * قالب "الشجرة/الحديقة" — تكبر مع التقدّم (6 مراحل).
 */
export function GardenTree({ progress }: { progress: RewardProgress }) {
  const stage = growthStage(progress.overallRatio);
  const canopy = 8 + stage * 16; // نصف قطر التاج يكبر مع المرحلة
  const trunkH = 10 + stage * 14;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-72 items-end justify-center rounded-card border border-subtle bg-bg-base p-4">
        <svg viewBox="0 0 200 200" className="h-full w-auto" role="img" aria-label="شجرة التقدّم">
          {/* الأرض */}
          <ellipse cx="100" cy="185" rx="70" ry="8" fill="var(--bg-surface)" />
          {/* الجذع */}
          <rect
            x="96"
            y={180 - trunkH}
            width="8"
            height={trunkH}
            rx="3"
            fill="var(--accent-copper)"
          />
          {/* التاج (يظهر من المرحلة 1) */}
          {stage >= 1 && (
            <circle
              cx="100"
              cy={180 - trunkH - canopy / 2}
              r={canopy}
              fill="var(--brand-500)"
              opacity={0.85}
              style={{ filter: "drop-shadow(0 0 12px rgba(224,96,63,0.35))" }}
            />
          )}
          {/* ثمار عند المرحلة الأخيرة */}
          {stage >= 5 &&
            [-1, 0, 1].map((d) => (
              <circle
                key={d}
                cx={100 + d * 22}
                cy={180 - trunkH - canopy / 2 + 6}
                r="4"
                fill="var(--brand-glow)"
              />
            ))}
        </svg>
      </div>
      <p className="text-center text-secondary text-text-secondary">
        {STAGE_LABEL[stage]} · {Math.round(progress.overallRatio * 100)}% من المنهج
      </p>
    </div>
  );
}
