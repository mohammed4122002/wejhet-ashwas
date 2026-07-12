/**
 * سكربت استيراد بنك الأسئلة (خطة §أ.7).
 *
 * الاستخدام:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/import-questions.ts <path-to-file.json|.csv>
 *
 * ------------------------------------------------------------------------
 * مهم: محتوى الأسئلة الرسمي يجي بملفات جاهزة من صاحب المشروع، وصيغتها الدقيقة
 * (Excel/CSV/Word/PDF) غير معروفة بعد. **أول خطوة عند وصول الملفات الفعلية:
 * افحص بنيتها وعدّل الدالة mapRow() بالأسفل لتطابقها** — لا تفترض صيغة قبل ما
 * تشوفها. باقي السكربت (حلّ المعرّفات + الإدراج) عام ولا يحتاج تعديلاً غالباً.
 * ------------------------------------------------------------------------
 *
 * الصيغة الافتراضية المدعومة الآن:
 * - JSON: مصفوفة كائنات، كل كائن بالحقول أدناه (RawRow).
 * - CSV: صف ترويسة بنفس أسماء الحقول، ثم صفوف البيانات (choices كسلسلة JSON).
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

/** صف خام من ملف المصدر — عدّله ليطابق الملفات الفعلية عند وصولها. */
interface RawRow {
  subject_slug: string; // مثل 'math' — أو استخدم subject_name
  subject_name?: string; // بديل عن slug (يُطابق subjects.name_ar)
  unit_name: string; // اسم الوحدة (units.name_ar)
  lesson_name: string; // اسم الدرس (lessons.name_ar)
  skill_type?: "understanding" | "application" | "analysis";
  difficulty?: "easy" | "medium" | "hard";
  source?: "past_exam" | "practice";
  exam_year?: number | null;
  question_text: string;
  choices: { key: string; text: string }[] | string; // مصفوفة أو سلسلة JSON
  correct_answer: string;
  explanation_text: string;
  explanation_video_url?: string | null;
}

function parseFile(path: string): RawRow[] {
  const raw = readFileSync(path, "utf8");
  if (path.endsWith(".json")) return JSON.parse(raw) as RawRow[];
  if (path.endsWith(".csv")) return parseCsv(raw);
  throw new Error("صيغة غير مدعومة: استخدم .json أو .csv");
}

/** محلّل CSV بسيط يدعم الحقول المقتبسة بعلامات تنصيص. */
function parseCsv(text: string): RawRow[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (field !== "" || row.length) {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      }
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...data] = rows;
  return data.map((cells) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => (obj[h.trim()] = cells[i] ?? ""));
    return obj as unknown as RawRow;
  });
}

/** حوّل صفاً خاماً إلى سجل جاهز للإدراج (عدّل هنا عند اختلاف صيغة الملفات). */
function mapRow(r: RawRow) {
  const choices =
    typeof r.choices === "string" ? JSON.parse(r.choices) : r.choices;
  return {
    subject_slug: r.subject_slug,
    subject_name: r.subject_name,
    unit_name: r.unit_name,
    lesson_name: r.lesson_name,
    skill_type: r.skill_type ?? null,
    difficulty: r.difficulty ?? null,
    source: r.source ?? "practice",
    exam_year: r.exam_year ?? null,
    question_text: r.question_text,
    choices,
    correct_answer: r.correct_answer,
    explanation_text: r.explanation_text,
    explanation_video_url: r.explanation_video_url ?? null,
  };
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("مرّر مسار ملف: npx tsx scripts/import-questions.ts <file>");
    process.exit(1);
  }
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("مطلوب SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY بالبيئة.");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  // خرائط الحلّ: slug/اسم المادة → id، و(subject_id + اسم الوحدة/الدرس) → id
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, slug, name_ar");
  const { data: units } = await supabase
    .from("units")
    .select("id, subject_id, name_ar");
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, unit_id, name_ar");

  const subjBySlug = new Map((subjects ?? []).map((s) => [s.slug, s]));
  const subjByName = new Map((subjects ?? []).map((s) => [s.name_ar, s]));

  const rows = parseFile(file).map(mapRow);
  const toInsert: Record<string, unknown>[] = [];
  const errors: string[] = [];

  for (const [i, r] of rows.entries()) {
    const subject =
      (r.subject_slug && subjBySlug.get(r.subject_slug)) ||
      (r.subject_name && subjByName.get(r.subject_name));
    if (!subject) {
      errors.push(`صف ${i + 1}: مادة غير معروفة (${r.subject_slug ?? r.subject_name})`);
      continue;
    }
    const unit = (units ?? []).find(
      (u) => u.subject_id === subject.id && u.name_ar === r.unit_name
    );
    if (!unit) {
      errors.push(`صف ${i + 1}: وحدة غير معروفة (${r.unit_name})`);
      continue;
    }
    const lesson = (lessons ?? []).find(
      (l) => l.unit_id === unit.id && l.name_ar === r.lesson_name
    );
    if (!lesson) {
      errors.push(`صف ${i + 1}: درس غير معروف (${r.lesson_name})`);
      continue;
    }
    toInsert.push({
      subject_id: subject.id,
      unit_id: unit.id,
      lesson_id: lesson.id,
      skill_type: r.skill_type,
      difficulty: r.difficulty,
      source: r.source,
      exam_year: r.exam_year,
      question_text: r.question_text,
      choices: r.choices,
      correct_answer: r.correct_answer,
      explanation_text: r.explanation_text,
      explanation_video_url: r.explanation_video_url,
    });
  }

  if (errors.length) {
    console.warn(`تحذيرات (${errors.length}):\n` + errors.join("\n"));
  }
  if (toInsert.length === 0) {
    console.error("لا صفوف صالحة للإدراج.");
    process.exit(1);
  }

  // إدراج على دفعات
  const BATCH = 200;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    const { error } = await supabase.from("question_bank_items").insert(batch);
    if (error) {
      console.error("فشل إدراج دفعة:", error.message);
      process.exit(1);
    }
    inserted += batch.length;
  }
  console.log(`تم استيراد ${inserted} سؤالاً بنجاح.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
