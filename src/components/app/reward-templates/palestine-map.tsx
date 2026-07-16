"use client";

import { PALESTINE_CITIES, litCityCount } from "@/lib/domain/rewards";
import type { RewardProgress } from "@/lib/domain/rewards";

/**
 * إحداثيات جغرافية تقريبية للمدن ضمن viewBox 160×380.
 * فلسطين طولية: الغرب (الساحل) = x صغير، الشرق (الداخل/الغور) = x كبير،
 * الشمال = y صغير، الجنوب = y كبير. المدن مرتّبة شمالاً ← جنوباً لتطابق الواقع.
 */
const CITY_POS: Record<string, [number, number]> = {
  // الشمال
  "صفد": [104, 58], // أقصى الشمال الشرقي (إصبع الجليل)
  "عكا": [56, 68], // ساحل الشمال
  "طبريا": [110, 84], // الشمال الشرقي (بحيرة طبريا)
  "حيفا": [58, 92], // ساحل، جنوب عكا
  // شمال الضفة
  "جنين": [90, 122],
  "نابلس": [95, 150],
  // الوسط الساحلي
  "يافا": [50, 182],
  "الرملة": [70, 196],
  // منطقة القدس
  "القدس": [96, 214],
  "بيت لحم": [93, 234],
  // الجنوب
  "الخليل": [90, 262],
  "غزة": [40, 284], // ساحل الجنوب
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
          {/* حدّ تقريبي لفلسطين التاريخية: ساحل غربي، غور شرقي، ومثلّث النقب جنوباً */}
          <path
            d="M90 48 L112 46 L113 60 L112 92 L110 150 L108 214 L106 250 L102 285 L92 320 L80 372 L56 338 L30 285 L34 240 L40 185 L44 150 L50 95 L54 66 L68 52 Z"
            fill="var(--bg-surface)"
            fillOpacity="0.35"
            stroke="var(--border-strong)"
            strokeWidth="1.5"
            strokeLinejoin="round"
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
