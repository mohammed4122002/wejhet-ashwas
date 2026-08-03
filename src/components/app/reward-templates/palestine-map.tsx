"use client";

import { PALESTINE_CITIES, litCityCount } from "@/lib/domain/rewards";
import type { RewardProgress } from "@/lib/domain/rewards";

/**
 * مواضع المدن ضمن viewBox 270×620، مُسقطة من الإحداثيات الجغرافية الحقيقية
 * (خط الطول 34.20°→35.65° على المحور الأفقي، ودائرة العرض 33.35°→29.35° على
 * المحور الرأسي) — فتظهر كل مدينة بموقعها الفعلي من فلسطين التاريخية:
 * الغرب = الساحل، الشرق = الغور، الشمال = الجليل، الجنوب = النقب.
 *
 * `side` يحدّد جهة اسم المدينة لتفادي تراكب الأسماء، و`dy` إزاحة رأسية بسيطة
 * للمدن شديدة التقارب (اللد/الرملة، خان يونس/رفح).
 */
const CITY_POS: Record<
  string,
  { x: number; y: number; side: "left" | "right"; dy?: number }
> = {
  // الجليل والشمال
  صفد: { x: 197, y: 92, side: "right" },
  عكا: { x: 148, y: 97, side: "left" },
  طبريا: { x: 201, y: 115, side: "right" },
  حيفا: { x: 138, y: 115, side: "left" },
  الناصرة: { x: 174, y: 128, side: "right" },
  بيسان: { x: 197, y: 155, side: "right" },
  // شمال الضفة والساحل الأوسط
  جنين: { x: 174, y: 160, side: "left" },
  طولكرم: { x: 142, y: 180, side: "left" },
  نابلس: { x: 169, y: 192, side: "right" },
  يافا: { x: 110, y: 215, side: "left" },
  اللد: { x: 126, y: 229, side: "right" },
  الرملة: { x: 123, y: 232, side: "left" },
  // القدس ومحيطها
  "رام الله": { x: 163, y: 236, side: "right", dy: -3 },
  أريحا: { x: 191, y: 242, side: "right", dy: 4 },
  القدس: { x: 164, y: 254, side: "right" },
  "بيت لحم": { x: 162, y: 262, side: "left" },
  // الجنوب والنقب
  عسقلان: { x: 88, y: 267, side: "left" },
  الخليل: { x: 150, y: 285, side: "right" },
  غزة: { x: 76, y: 290, side: "left" },
  "خان يونس": { x: 57, y: 311, side: "left", dy: -3 },
  رفح: { x: 52, y: 318, side: "left", dy: 4 },
  "بئر السبع": { x: 114, y: 323, side: "right" },
};

/**
 * حدّ فلسطين التاريخية: الساحل غرباً، إصبع الجليل شمالاً، الغور والبحر الميت
 * شرقاً، ومثلّث النقب الذي ينتهي بنقطة عند خليج العقبة جنوباً.
 */
const BORDER_PATH =
  // الحدّ الشمالي مع لبنان ثم إصبع الجليل (شريط ضيّق يصعد شمالاً)
  "M152 75 L197 74 L201 52 L206 49 L209 73 " +
  // الحدّ الشرقي: الجولان فبحيرة طبريا فغور الأردن فالبحر الميت
  "L213 95 L215 112 L211 134 L206 155 L204 195 L202 230 L201 253 " +
  "L197 300 L194 344 " +
  // وادي عربة نزولاً إلى نقطة خليج العقبة، ثم الحدّ مع مصر صعوداً
  "L175 412 L154 484 L132 558 L107 468 L86 398 L70 355 L48 315 " +
  // الساحل من رفح شمالاً حتى رأس الناقورة (مع خليج حيفا)
  "L71 291 L85 267 L95 249 L105 216 L118 177 L127 164 L131 112 " +
  "L140 103 L144 91 Z";

/**
 * قالب "خارطة فلسطين" (design.md §6).
 * كل مدينة معتمة بلون `--bg-surface` وتتحوّل إلى `--brand-500` مع توهّج
 * `--glow-brand` كلما تقدّم الطالب — بلا أي لون علم إضافي، الدلالة من شكل
 * الخارطة نفسها. ترتيب الإنارة يبدأ من القدس وينتشر خارجاً (rewards.ts).
 */
export function PalestineMap({ progress }: { progress: RewardProgress }) {
  const lit = litCityCount(progress.overallRatio);
  const nextCity = PALESTINE_CITIES[lit];

  return (
    <div className="flex flex-col gap-4">
      <div className="mx-auto w-full max-w-xs rounded-card border border-subtle bg-bg-base p-3">
        <svg
          viewBox="0 0 270 620"
          className="mx-auto h-auto w-full"
          role="img"
          aria-label={`خارطة فلسطين — أنرت ${lit} من ${PALESTINE_CITIES.length} مدينة`}
        >
          <defs>
            {/* توهّج المدن المُنارة — بلون العلامة نفسه لا بلون جديد */}
            <filter id="pm-glow" x="-150%" y="-150%" width="400%" height="400%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="3"
                floodColor="rgb(var(--brand-500))"
                floodOpacity="0.85"
              />
            </filter>
            {/* المسطّحات المائية تُقصّ على حدّ البلاد (الحدّ يمرّ بمنتصفها) */}
            <clipPath id="pm-land">
              <path d={BORDER_PATH} />
            </clipPath>
          </defs>

          <path
            d={BORDER_PATH}
            fill="rgb(var(--bg-surface))"
            fillOpacity="0.5"
            stroke="var(--border-strong)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* بحيرة طبريا والبحر الميت — الحدّ الشرقي يمرّ بمنتصفهما فيُقصّان عليه */}
          <g
            clipPath="url(#pm-land)"
            fill="rgb(var(--bg-base))"
            stroke="var(--border-strong)"
            strokeWidth="1"
          >
            <ellipse cx="206" cy="115" rx="5" ry="13" />
            <ellipse cx="191" cy="298" rx="5.5" ry="45" />
          </g>

          {/* اسم إقليم النقب في فراغ الجنوب — كما بالخارطة المرجعية */}
          <text
            x="150"
            y="440"
            textAnchor="middle"
            fontSize="12"
            letterSpacing="2"
            fill="rgb(var(--text-muted))"
          >
            النقب
          </text>

          {PALESTINE_CITIES.map((city, i) => {
            const pos = CITY_POS[city];
            if (!pos) return null;
            const isLit = i < lit;
            const isNext = i === lit;
            // نص عربي (RTL): "start" يثبّت الحافة اليمنى، و"end" يثبّت اليسرى
            const toLeft = pos.side === "left";
            return (
              <g key={city}>
                {isNext && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="8"
                    fill="none"
                    stroke="rgb(var(--brand-400))"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                    opacity="0.7"
                  />
                )}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isLit ? 5 : 3.5}
                  fill={
                    isLit ? "rgb(var(--brand-500))" : "rgb(var(--bg-surface))"
                  }
                  stroke={
                    isLit ? "rgb(var(--brand-glow))" : "var(--border-strong)"
                  }
                  strokeWidth="1.25"
                  filter={isLit ? "url(#pm-glow)" : undefined}
                />
                <text
                  x={toLeft ? pos.x - 7 : pos.x + 7}
                  y={pos.y + 3 + (pos.dy ?? 0)}
                  direction="rtl"
                  textAnchor={toLeft ? "start" : "end"}
                  fontSize="9"
                  fontWeight={isLit ? 600 : 400}
                  fill={
                    isLit
                      ? "rgb(var(--text-primary))"
                      : "rgb(var(--text-muted))"
                  }
                >
                  {city}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-secondary text-text-secondary">
          أنرت {lit} من {PALESTINE_CITIES.length} مدينة ·{" "}
          {Math.round(progress.overallRatio * 100)}% من المنهج
        </p>
        {nextCity && (
          <p className="text-secondary text-text-muted">
            المدينة التالية: {nextCity}
          </p>
        )}
      </div>
    </div>
  );
}
