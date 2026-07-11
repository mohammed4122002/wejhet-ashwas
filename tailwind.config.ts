import type { Config } from "tailwindcss";

/**
 * كل التوكنز هون مستخرجة حرفياً من design.md.
 * ممنوع إضافة أي قيمة لونية/مسافة/خط خارج هذا الملف أو ملف design.md.
 */
const config: Config = {
  darkMode: "class", // الوضع الوحيد بالـMVP هو dark — نثبّته يدوياً على <html>
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
          base: "#150B0F",
          surface: "#221219",
          raised: "#2E1820",
          overlay: "rgba(21, 11, 15, 0.85)",
        },
        // ============ التدرّج الأساسي (هوية العلامة) ============
        brand: {
          400: "#F08157",
          500: "#E0603F",
          600: "#C6472C",
          glow: "#FBC79A",
        },
        // ============ النحاسي/الذهبي (القوس بالشعار) ============
        accent: {
          copper: "#D97757",
          gold: "#E0A868",
        },
        // ============ نصوص ============
        text: {
          primary: "#F5EDE8",
          secondary: "#B8A79E",
          muted: "#7A6B64",
          "on-brand": "#150B0F",
        },
        // ============ حالات دلالية (Kanban) ============
        status: {
          todo: "#7A6B64",
          progress: "#E0603F",
          done: "#4CAF7D",
        },
      },
      // ============ حدود وفواصل ============
      borderColor: {
        subtle: "rgba(245, 237, 232, 0.08)",
        strong: "rgba(245, 237, 232, 0.16)",
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
