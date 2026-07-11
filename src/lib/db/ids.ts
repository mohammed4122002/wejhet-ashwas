/** مولّدات معرّفات وتواريخ للكتابات المحلية (local-first). */

/** uuid v4 من واجهة المتصفّح (متوفّرة على كل المتصفّحات الحديثة + HTTPS/localhost). */
export function newId(): string {
  return crypto.randomUUID();
}

/** الوقت الحالي بصيغة ISO (timestamptz). */
export function nowISO(): string {
  return new Date().toISOString();
}

/** تاريخ اليوم بصيغة YYYY-MM-DD (نفس صيغة task_date/exam_date). */
export function todayISO(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** يوم الأسبوع 0..6 (0 = الأحد) مطابق day_of_week بالمخطط. */
export function weekday(d: Date = new Date()): number {
  return d.getDay();
}

/** يزيد/ينقص أيام على تاريخ YYYY-MM-DD ويعيد بنفس الصيغة. */
export function addDays(dateISO: string, days: number): string {
  const d = new Date(dateISO + "T00:00:00");
  d.setDate(d.getDate() + days);
  return todayISO(d);
}
