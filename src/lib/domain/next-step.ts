/**
 * «الخطوة التالية» و«خارطة البداية» — منطق إرشاد تربوي نقي.
 *
 * المبدأ التربوي: الطالب المتوتر يحتاج إجراءً واحداً واضحاً الآن، لا قائمة
 * خيارات. الأولويات مرتّبة حسب الأثر التعليمي: أساس (جدول) ← تصفية الضغط
 * (المتراكم) ← التنفيذ (مهام اليوم) ← المعالجة (أضعف وحدة) ← الاستفادة
 * القصوى (شكوك للأستاذ، تجهيز offline) ← الإثراء (محاكاة).
 */

export interface NextStepInput {
  hasSchedule: boolean;
  overdue: number;
  todayTodo: number;
  todayDone: number;
  /** أضعف وحدة بدأ فيها الطالب فعلاً (0 < الإتقان < 1). */
  weakestStartedUnit: { unitName: string; ratio: number } | null;
  unresolvedDoubts: number;
  hasDownloadedQuestions: boolean;
}

export interface NextStep {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}

/** يعيد توصية واحدة فقط — الأعلى أولوية تربوياً. */
export function nextStep(i: NextStepInput): NextStep {
  if (!i.hasSchedule) {
    return {
      id: "build-schedule",
      title: "ابنِ جدولك الأسبوعي",
      description:
        "خمس دقائق تبني فيها أساس أسبوعك كله — يدوياً، أو باقتراح جاهز تعدّله كما تحب.",
      href: "/app/schedule",
      cta: "ابنِ الجدول",
    };
  }
  if (i.overdue > 0) {
    return {
      id: "clear-overdue",
      title: "صفِّ المتراكم أولاً",
      description: `عندك ${i.overdue} مهمة متراكمة — أجّلها لليوم أو احذفها بلا ضغط، وابدأ بصفحة نظيفة.`,
      href: "/app",
      cta: "راجع المتراكم",
    };
  }
  if (i.todayTodo > 0) {
    return {
      id: "focus-today",
      title: "ابدأ جلسة تركيز",
      description: `باقي ${i.todayTodo} ${i.todayTodo === 1 ? "مهمة" : "مهام"} اليوم — افتح أولها وشغّل البومودورو.`,
      href: "/app",
      cta: "ابدأ الآن",
    };
  }
  if (i.weakestStartedUnit && i.weakestStartedUnit.ratio < 0.6) {
    return {
      id: "strengthen-weakest",
      title: `قوِّ نقطتك الأضعف: ${i.weakestStartedUnit.unitName}`,
      description:
        "مراجعة قصيرة الآن أثمن من ساعة قبل الامتحان — تمرّن على أسئلتها من البنك.",
      href: "/app/bank",
      cta: "تمرّن عليها",
    };
  }
  if (i.unresolvedDoubts >= 3) {
    return {
      id: "take-doubts",
      title: "خُذ أسئلتك لأستاذك",
      description: `عندك ${i.unresolvedDoubts} أسئلة معلّقة بصندوق الشكوك — انسخها أو اطبعها قبل ما تروح.`,
      href: "/app/doubts",
      cta: "افتح الشكوك",
    };
  }
  if (!i.hasDownloadedQuestions) {
    return {
      id: "download-bank",
      title: "جهّز تمرينك بدون نت",
      description:
        "حمّل مادة من بنك الأسئلة مرة وحدة وأنت متصل، وتمرّن بأي وقت حتى لو انقطع النت.",
      href: "/app/bank",
      cta: "حمّل مادة",
    };
  }
  return {
    id: "day-done",
    title: "أنجزت مهام اليوم — أحسنت! 🎉",
    description: "خذ استراحة مستحقة، أو اختبر نفسك باختبار محاكاة قصير.",
    href: "/app/mock",
    cta: "جرّب محاكاة",
  };
}

// ============ خارطة البداية (للطالب الجديد) ============

export interface ChecklistItem {
  id: string;
  label: string;
  href: string;
  done: boolean;
}

export interface ChecklistInput {
  hasSchedule: boolean;
  completedTasks: number;
  pomodoroCount: number;
  hasDownloadedQuestions: boolean;
}

/** أربع خطوات تأسيسية تظهر للطالب الجديد حتى يكملها. */
export function buildChecklist(c: ChecklistInput): ChecklistItem[] {
  return [
    {
      id: "schedule",
      label: "ابنِ جدولك الأسبوعي",
      href: "/app/schedule",
      done: c.hasSchedule,
    },
    {
      id: "first-task",
      label: "أنجز أول مهمة",
      href: "/app",
      done: c.completedTasks > 0,
    },
    {
      id: "first-pomodoro",
      label: "شغّل أول بومودورو",
      href: "/app",
      done: c.pomodoroCount > 0,
    },
    {
      id: "download",
      label: "حمّل مادة للتمرين بدون نت",
      href: "/app/bank",
      done: c.hasDownloadedQuestions,
    },
  ];
}

export function checklistComplete(items: ChecklistItem[]): boolean {
  return items.every((i) => i.done);
}
