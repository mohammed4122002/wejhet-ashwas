/**
 * منطق الخريطة الحرارية (خطة §أ.5) — دوال نقية.
 * الإتقان يتراكم من مهام "تمّت" + محاولات أسئلة صحيحة (تُحسب في view بقاعدة البيانات).
 * هون فقط تحويل النسبة لدرجة عرض بصري.
 */

export interface UnitProgress {
  unitId: string;
  unitName: string;
  totalLessons: number;
  masteredLessons: number;
}

/** نسبة الإتقان [0..1] لوحدة. آمنة عند القسمة على صفر. */
export function masteryRatio(u: Pick<UnitProgress, "totalLessons" | "masteredLessons">): number {
  if (!u.totalLessons) return 0;
  return Math.min(1, u.masteredLessons / u.totalLessons);
}

/**
 * درجة تشبّع الخريطة الحرارية (design.md §6): فاتح جداً = بداية، مشبّع = إتقان.
 * نعيد مستوى من 0 (لسا ما بدأ) إلى 4 (إتقان كامل) — يُترجَم لـ opacity/لون بالواجهة.
 */
export function heatLevel(ratio: number): 0 | 1 | 2 | 3 | 4 {
  if (ratio <= 0) return 0;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.85) return 3;
  return 4;
}
