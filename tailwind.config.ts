import type { Config } from "tailwindcss";

/**
 * كل التوكنز هون مستخرجة حرفياً من design.md.
 * ممنوع إضافة أي قيمة لونية/مسافة/خط خارج هذا الملف أو ملف design.md.
 */
/** يبني لون توكن من قناة RGB متغيّرة مع دعم شفافية Tailwind `/NN`. */
const c = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  // الوضع يُدار عبر متغيّرات CSS على <html.light> — التوكنز تتبدّل تلقائياً.
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ============ خلفيات (design.md §2) ============
        bg: {
          base: c("--bg-base"),
          surface: c("--bg-surface"),
          raised: c("--bg-raised"),
          overlay: "rgb(var(--overlay) / 0.85)",
        },
        // ============ التدرّج الأساسي (هوية العلامة) ============
        brand: {
          400: c("--brand-400"),
          500: c("--brand-500"),
          600: c("--brand-600"),
          glow: c("--brand-glow"),
        },
        // ============ النحاسي/الذهبي (القوس بالشعار) ============
        accent: {
          copper: c("--accent-copper"),
          gold: c("--accent-gold"),
        },
        // ============ نصوص ============
        text: {
          primary: c("--text-primary"),
          secondary: c("--text-secondary"),
          muted: c("--text-muted"),
          "on-brand": c("--text-on-brand"),
        },
        // ============ حالات دلالية (Kanban) ============
        status: {
          todo: c("--status-todo"),
          progress: c("--status-progress"),
          done: c("--status-done"),
        },
      },
      // ============ حدود وفواصل ============
      borderColor: {
        subtle: "rgb(var(--border) / 0.08)",
        strong: "rgb(var(--border) / 0.16)",
      },
      // ============ الحواف الدائرية (design.md §4) ============
      borderRadius: {
        card: "16px", // كروت وأزرار كبيرة
        input: "10px", // حقول إدخال
        pill: "999px", // أزرار صغيرة/شارات
      },
      // ============ الظلال/التوهّج (design.md §4) ============
      boxShadow: {
        "glow-brand": "0 0 24px rgba(224, 96, 63, 0.35)",
        "glow-success": "0 0 20px rgba(76, 175, 125, 0.3)",
      },
      // ============ الطباعة (design.md §3) ============
      fontFamily: {
        sans: ["var(--font-plex-arabic)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // السلّم من design.md §3
        h1: ["1.75rem", { lineHeight: "1.3", fontWeight: "700" }], // 28px
        h2: ["1.375rem", { lineHeight: "1.35", fontWeight: "600" }], // 22px
        h3: ["1.0625rem", { lineHeight: "1.4", fontWeight: "600" }], // 17px
        body: ["0.9375rem", { lineHeight: "1.6", fontWeight: "400" }], // 15px
        secondary: ["0.8125rem", { lineHeight: "1.6", fontWeight: "400" }], // 13px
        display: ["2.5rem", { lineHeight: "1.1", fontWeight: "700" }], // 40px أرقام كبيرة
      },
      // ============ الحركة (design.md §5) ============
      transitionDuration: {
        DEFAULT: "200ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0, 0, 0.2, 1)", // ease-out
      },
      keyframes: {
        "reward-unlock": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "reward-unlock": "reward-unlock 250ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
