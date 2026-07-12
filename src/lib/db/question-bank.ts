import { createClient } from "@/lib/supabase/client";
import { getDB } from "./dexie";

/**
 * تحميل انتقائي لبنك الأسئلة للعمل بدون نت (خطة §ب.5 بند 5).
 * يجيب كل أسئلة المادة من Supabase ويخزّنها بـ Dexie — بالمادة، مو الكل دفعة.
 */
export async function downloadSubjectQuestions(
  subjectId: string
): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("question_bank_items")
    .select("*")
    .eq("subject_id", subjectId);
  if (error) throw error;
  if (data?.length) {
    await getDB().question_bank_items.bulkPut(data);
  }
  return data?.length ?? 0;
}

/** يجيب أسئلة اختبار محاكاة (بمعرّفاتها) ويخزّنها محلياً للعمل بدون نت. */
export async function downloadMockExam(mockExamId: string): Promise<void> {
  const supabase = createClient();
  const { data: exam } = await supabase
    .from("mock_exams")
    .select("*")
    .eq("id", mockExamId)
    .maybeSingle();
  if (!exam) return;
  await getDB().mock_exams.put(exam);

  const { data: questions } = await supabase
    .from("question_bank_items")
    .select("*")
    .in("id", exam.question_ids);
  if (questions?.length) {
    await getDB().question_bank_items.bulkPut(questions);
  }
}
