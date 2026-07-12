/**
 * منطق التمرين والاختبار (خطة §أ.7 و§أ.12) — دوال نقية offline.
 * تحليل الجلسة (أضعف جزئية) + تصحيح اختبار المحاكاة + تحليل الضعف بالوحدة.
 */

export interface AttemptResult {
  lessonId: string | null;
  lessonName?: string;
  isCorrect: boolean;
}

export interface WeakestLesson {
  lessonId: string;
  lessonName?: string;
  correct: number;
  total: number;
  ratio: number;
}

/** أضعف درس في جلسة تمرين (أقل نسبة إجابات صحيحة). null لو ما في بيانات كافية. */
export function weakestLesson(results: AttemptResult[]): WeakestLesson | null {
  const byLesson = new Map<
    string,
    { correct: number; total: number; name?: string }
  >();
  for (const r of results) {
    if (!r.lessonId) continue;
    const e = byLesson.get(r.lessonId) ?? { correct: 0, total: 0, name: r.lessonName };
    e.total += 1;
    if (r.isCorrect) e.correct += 1;
    e.name = e.name ?? r.lessonName;
    byLesson.set(r.lessonId, e);
  }

  let worst: WeakestLesson | null = null;
  for (const [lessonId, e] of byLesson) {
    const ratio = e.correct / e.total;
    if (!worst || ratio < worst.ratio) {
      worst = { lessonId, lessonName: e.name, correct: e.correct, total: e.total, ratio };
    }
  }
  return worst;
}

export interface MockQuestion {
  id: string;
  unit_id: string | null;
  unit_name?: string;
  correct_answer: string;
}

export interface UnitWeakness {
  unitId: string;
  unitName?: string;
  correct: number;
  total: number;
  ratio: number;
}

export interface MockResult {
  scorePercent: number;
  correct: number;
  total: number;
  weaknessByUnit: UnitWeakness[]; // مرتّبة من الأضعف
}

/**
 * يصحّح اختبار محاكاة من إجابات الطالب.
 * @param answers خريطة question_id → المفتاح المختار.
 * @param questions أسئلة الاختبار مع الإجابة الصحيحة والوحدة.
 */
export function scoreMock(
  answers: Record<string, string>,
  questions: MockQuestion[]
): MockResult {
  const total = questions.length;
  let correct = 0;
  const byUnit = new Map<
    string,
    { correct: number; total: number; name?: string }
  >();

  for (const q of questions) {
    const isCorrect = answers[q.id] === q.correct_answer;
    if (isCorrect) correct += 1;
    if (q.unit_id) {
      const e = byUnit.get(q.unit_id) ?? { correct: 0, total: 0, name: q.unit_name };
      e.total += 1;
      if (isCorrect) e.correct += 1;
      byUnit.set(q.unit_id, e);
    }
  }

  const weaknessByUnit: UnitWeakness[] = [...byUnit.entries()]
    .map(([unitId, e]) => ({
      unitId,
      unitName: e.name,
      correct: e.correct,
      total: e.total,
      ratio: e.total ? e.correct / e.total : 0,
    }))
    .sort((a, b) => a.ratio - b.ratio);

  return {
    scorePercent: total ? Math.round((correct / total) * 100) : 0,
    correct,
    total,
    weaknessByUnit,
  };
}
