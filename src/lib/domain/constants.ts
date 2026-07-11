import type { RewardSystem, Track } from "@/lib/supabase/database.types";

/** الفروع (خطة §أ.1: سؤال واحد إجباري بعد التسجيل). */
export const TRACKS: {
  value: Track;
  label: string;
  description: string;
}[] = [
  {
    value: "scientific",
    label: "علمي",
    description: "الرياضيات، الفيزياء، الكيمياء، الأحياء + المواد المشتركة",
  },
  {
    value: "literary",
    label: "أدبي",
    description: "التاريخ، الجغرافيا، علم النفس والاجتماع + المواد المشتركة",
  },
];

/**
 * قوالب المكافأة الخمسة (خطة §أ.9، design.md §6).
 * القالب الافتراضي المقترح عند أول تسجيل: "النجوم والأبراج" (الأقرب للشعار).
 */
export const REWARD_SYSTEMS: {
  value: RewardSystem;
  label: string;
  description: string;
}[] = [
  {
    value: "star_constellations",
    label: "النجوم والأبراج",
    description: "سماء ليلية، كل درس يُضيء نجمة، وإتمام وحدة يصنع كوكبة. (الافتراضي المقترح)",
  },
  {
    value: "palestine_map",
    label: "خارطة فلسطين",
    description: "خارطة تفاعلية، كل مدينة تُنار تدريجياً مع تقدّمك بالمنهج.",
  },
  {
    value: "city_builder",
    label: "بناء مدينة",
    description: "تبني حيّاً من الصفر، كل إنجاز يضيف مبنى جديد.",
  },
  {
    value: "garden_tree",
    label: "الشجرة والحديقة",
    description: "شكل تقليدي مألوف — حديقة تكبر مع تقدّمك.",
  },
  {
    value: "minimal",
    label: "بسيط بدون رسوم",
    description: "أرقام ونسب وشارات نصية فقط، بدون عناصر تلعيب.",
  },
];

export const DEFAULT_REWARD_SYSTEM: RewardSystem = "star_constellations";

/** أسماء أيام الأسبوع بالعربية (0 = الأحد، مطابق day_of_week بالمخطط). */
export const WEEKDAYS_AR = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;
