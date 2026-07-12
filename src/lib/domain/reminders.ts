/**
 * التذكيرات ثلاثية الطبقة (خطة §أ.8) — دوال نقية.
 * كل طبقة (دراسية/تحفيزية/دينية) تُشغَّل/تُطفأ باستقلال من الإعدادات.
 */

export type ReminderLayer = "study" | "motivational" | "religious";

export interface ReminderItem {
  id: string;
  layer: ReminderLayer;
  text: string;
}

export interface ReminderInput {
  todayTodo: number; // مهام اليوم غير المنجزة
  overdue: number; // مهام متأخرة (متراكمة)
  doneToday: number; // مهام أُنجزت اليوم
  unresolvedDoubts: number; // شكوك غير محلولة
  flags: {
    study_reminders: boolean;
    motivational_reminders: boolean;
    religious_reminders: boolean;
  };
}

/** يبني قائمة التذكيرات الظاهرة داخل التطبيق حسب الإعدادات المفعّلة. */
export function buildReminders(input: ReminderInput): ReminderItem[] {
  const out: ReminderItem[] = [];
  const { flags } = input;

  if (flags.study_reminders) {
    if (input.overdue > 0) {
      out.push({
        id: "overdue",
        layer: "study",
        text: `عندك ${input.overdue} مهمة متأخرة — أجّلها لليوم أو احذفها بدون ضغط.`,
      });
    }
    if (input.todayTodo > 0) {
      out.push({
        id: "today",
        layer: "study",
        text: `باقي ${input.todayTodo} مهمة من مهام اليوم.`,
      });
    }
    if (input.unresolvedDoubts >= 3) {
      out.push({
        id: "doubts",
        layer: "study",
        text: `عندك ${input.unresolvedDoubts} أسئلة معلّقة بصندوق الشكوك — خُذها لأستاذك.`,
      });
    }
  }

  if (flags.motivational_reminders) {
    if (input.doneToday > 0) {
      out.push({
        id: "done-today",
        layer: "motivational",
        text: `أحسنت! أنجزت ${input.doneToday} مهمة اليوم. استمر على هالوتيرة 🎉`,
      });
    } else if (input.todayTodo > 0) {
      out.push({
        id: "start",
        layer: "motivational",
        text: "خطوة وحدة بس تكفي تبلّش — أنت قادر.",
      });
    }
  }

  if (flags.religious_reminders) {
    out.push({
      id: "dua",
      layer: "religious",
      text: "«رب زدني علماً» — دعوة قصيرة قبل ما تبلّش مذاكرتك.",
    });
  }

  return out;
}
