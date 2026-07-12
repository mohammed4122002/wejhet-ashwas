"use client";

import { PALESTINE_CITIES, litCityCount } from "@/lib/domain/rewards";
import type { RewardProgress } from "@/lib/domain/rewards";

/** إحداثيات تقريبية للمدن ضمن viewBox 160×380 (فلسطين طولية ضيقة). */
const CITY_POS: Record<string, [number, number]> = {
  "عكا": [70, 62],
  "صفد": [98, 58],
  "حيفا": [66, 88],
  "طبريا": [102, 82],
  "جنين": [86, 120],
  "نابلس": [90, 150],
  "يافا": [58, 178],
  "الرملة": [70, 192],
  "القدس": [92, 214],
  "بيت لحم": [88, 232],
  "الخليل": [86, 258],
  "غزة": [40, 288],
};

/**
 * قالب "خارطة فلسطين" (design.md §6).
 * كل مدينة تُنار تدريجياً مع التقدّم العام — لا ألوان علم إضافية، الدلالة من
 * شكل الخارطة والتوهّج بلون العلامة فقط.
 */
export function PalestineMap({ progress }: { progress: RewardProgress }) {
  const lit = litCityCount(progress.overallRatio);

  return (
    <div className="flex flex-col gap-4">
      <div className="mx-auto w-full max-w-xs rounded-card border border-subtle bg-bg-base p-4">
        <svg viewBox="0 0 160 380" className="mx-auto h-96 w-auto" role="img" aria-label="خارطة فلسطين">
          {/* حدّ تقريبي مبسّط لفلسطين */}
          <path
            d="M78 40 L104 52 L108 90 L96 120 L104 150 L100 185 L108 215 L100 250 L92 275 L60 300 L40 296 L52 250 L58 210 L54 180 L66 150 L70 120 L64 92 L70 60 Z"
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth="1.5"
          />
          {PALESTINE_CITIES.map((city, i) => {
            const pos = CITY_POS[city];
            if (!pos) return null;
            const isLit = i < lit;
            return (
              <g key={city}>
                <circle
                  cx={pos[0]}
                  cy={pos[1]}
                  r={isLit ? 6 : 4}
                  fill={isLit ? "var(--brand-500)" : "var(--bg-surface)"}
                  stroke={isLit ? "var(--brand-glow)" : "var(--border-strong)"}
                  strokeWidth="1.5"
                  style={isLit ? { filter: "drop-shadow(0 0 6px rgba(224,96,63,0.6))" } : undefined}
                />
                <text
                  x={pos[0] + 9}
                  y={pos[1] + 3}
                  fontSize="8"
                  fill={isLit ? "var(--text-primary)" : "var(--text-muted)"}
                >
                  {city}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-center text-secondary text-text-secondary">
        أنرت {lit} من {PALESTINE_CITIES.length} مدينة · {Math.round(progress.overallRatio * 100)}% من المنهج
      </p>
    </div>
  );
}
