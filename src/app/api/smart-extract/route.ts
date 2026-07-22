import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";

// استخراج الأسئلة قد يتطلب تحميل ملف كبير + معالجته عبر OpenAI،
// لذلك نرفع مهلة تنفيذ الدالة ونستخدم بيئة Node (نحتاج Buffer).
export const runtime = "nodejs";
export const maxDuration = 60;

interface MaterialRow {
  id: string;
  title: string;
  subject: string | null;
  file_type: string;
  source_type: string;
  file_url: string;
}

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) {
    return null;
  }
  return user;
}

export async function POST(request: NextRequest) {
  const user = await assertAdmin();
  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { material_id?: string };
    const { material_id } = body;

    if (!material_id) {
      return NextResponse.json({ error: "material_id مطلوب" }, { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY غير موجود",
          debug: "أضِف OPENAI_API_KEY في متغيّرات البيئة على Vercel.",
        },
        { status: 500 }
      );
    }

    const admin = createAdminClient();
    const { data: material, error: materialError } = await admin
      .from("materials")
      .select("id, title, subject, file_type, source_type, file_url")
      .eq("id", material_id)
      .single<MaterialRow>();

    if (materialError || !material) {
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
    }

    console.log("📥 Material:", material.title, "| type:", material.file_type);

    // 1) نزّل البايتات الفعلية للملف (يعالج روابط Google Drive الكبيرة أيضاً).
    const downloaded = await downloadMaterialBytes(material);
    if (!downloaded) {
      return NextResponse.json(
        {
          error: "تعذّر تنزيل الملف. تأكّد أنّ الرابط عام (Anyone with the link).",
        },
        { status: 502 }
      );
    }

    // 2) اكتشف النوع الحقيقي من البايتات (وليس من الامتداد فقط).
    const mime = detectMime(downloaded);
    console.log(
      `📦 Downloaded ${downloaded.length} bytes | detected: ${mime}`
    );

    // 3) وجّه حسب النوع الفعلي.
    let questions: unknown[] = [];
    let detectionInfo = "";

    if (mime === "application/pdf") {
      detectionInfo = "PDF (نص + صور)";
      questions = await extractFromPdf(downloaded, material, openaiApiKey);
    } else if (mime.startsWith("image/")) {
      detectionInfo = "صورة";
      questions = await extractFromImage(downloaded, mime, material, openaiApiKey);
    } else if (mime === "text/plain") {
      detectionInfo = "نص";
      questions = await extractFromText(
        downloaded.toString("utf8"),
        material,
        openaiApiKey
      );
    } else {
      return NextResponse.json(
        {
          error: `نوع الملف غير مدعوم (${mime}). المدعوم: PDF، صور (PNG/JPEG/GIF/WebP)، أو نص.`,
        },
        { status: 415 }
      );
    }

    // 4) حدّد المادة (subject_id) المطابقة لحفظ الأسئلة لاحقاً.
    const subjectId = await resolveSubjectId(admin, material.subject);

    console.log(`✅ Extracted ${questions.length} questions`);

    return NextResponse.json({
      success: true,
      extracted_questions: questions,
      resolved_subject_id: subjectId,
      material: {
        id: material.id,
        title: material.title,
        subject: material.subject,
        detection: detectionInfo,
      },
      summary: {
        total_questions_found: questions.length,
        total_questions_improved: questions.length,
        materials_processed: [material.id],
      },
      message: `تم استخراج ${questions.length} سؤالاً من ${detectionInfo}`,
    });
  } catch (e) {
    console.error("❌ Smart extraction error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل الاستخراج" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// تنزيل الملف
// ─────────────────────────────────────────────────────────────

async function downloadMaterialBytes(
  material: MaterialRow
): Promise<Buffer | null> {
  const url = material.file_url;

  if (url.includes("drive.google.com")) {
    const fileId =
      url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] ||
      url.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1];
    if (fileId) {
      return downloadFromGoogleDrive(fileId);
    }
  }

  // رابط مباشر (Supabase Storage أو غيره).
  const res = await fetch(url);
  if (!res.ok) {
    console.error("Direct download failed:", res.status);
    return null;
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * تنزيل ملف من Google Drive بشكل موثوق.
 * الملفات الكبيرة (> ~40MB أحياناً > بضع ميغابايت) تُرجع صفحة HTML لتأكيد
 * "فحص الفيروسات" بدل الملف؛ نتعامل مع هذه الحالة عبر endpoint
 * drive.usercontent.google.com مع confirm=t، ثم نُحلّل النموذج إن لزم.
 */
async function downloadFromGoogleDrive(fileId: string): Promise<Buffer | null> {
  const firstUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
  let res = await fetch(firstUrl);
  if (!res.ok) {
    console.error("Google Drive download failed:", res.status);
    return null;
  }
  let buf = Buffer.from(await res.arrayBuffer());

  // إذا رجعت صفحة HTML (تأكيد الفحص)، استخرج بيانات النموذج وأعد الطلب.
  if (looksLikeHtml(buf)) {
    const html = buf.toString("utf8");
    const action =
      html.match(/action="([^"]+)"/)?.[1]?.replace(/&amp;/g, "&") ||
      "https://drive.usercontent.google.com/download";
    const params = new URLSearchParams();
    for (const m of html.matchAll(/name="([^"]+)"\s+value="([^"]*)"/g)) {
      params.set(m[1], m[2]);
    }
    if (!params.has("id")) params.set("id", fileId);
    if (!params.has("export")) params.set("export", "download");
    if (!params.has("confirm")) params.set("confirm", "t");

    res = await fetch(`${action}?${params.toString()}`);
    if (!res.ok) {
      console.error("Google Drive confirm step failed:", res.status);
      return null;
    }
    buf = Buffer.from(await res.arrayBuffer());
  }

  if (looksLikeHtml(buf)) {
    console.error("Google Drive still returned HTML after confirm step");
    return null;
  }
  return buf;
}

function looksLikeHtml(buf: Buffer): boolean {
  const head = buf.subarray(0, 512).toString("utf8").trimStart().toLowerCase();
  return head.startsWith("<!doctype html") || head.startsWith("<html");
}

// ─────────────────────────────────────────────────────────────
// اكتشاف النوع من البايتات (magic numbers)
// ─────────────────────────────────────────────────────────────

function detectMime(buf: Buffer): string {
  if (buf.length >= 4 && buf.subarray(0, 4).toString("latin1") === "%PDF")
    return "application/pdf";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e)
    return "image/png";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return "image/jpeg";
  if (buf.length >= 4 && buf.subarray(0, 4).toString("latin1") === "GIF8")
    return "image/gif";
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString("latin1") === "RIFF" &&
    buf.subarray(8, 12).toString("latin1") === "WEBP"
  )
    return "image/webp";
  // نص عربي/إنجليزي بسيط؟ (لا بايتات تحكّم غير معتادة في البداية)
  const head = buf.subarray(0, 256);
  const hasControl = head.some(
    (b) => b < 0x09 || (b > 0x0d && b < 0x20)
  );
  if (!hasControl) return "text/plain";
  return "application/octet-stream";
}

// ─────────────────────────────────────────────────────────────
// استدعاءات OpenAI
// ─────────────────────────────────────────────────────────────

async function extractFromPdf(
  buf: Buffer,
  material: MaterialRow,
  apiKey: string
): Promise<unknown[]> {
  const base64 = buf.toString("base64");
  const dataUrl = `data:application/pdf;base64,${base64}`;

  const content = await callOpenAI(apiKey, [
    { type: "text", text: buildPrompt(material) },
    {
      type: "file",
      file: {
        filename: `${material.title || "material"}.pdf`,
        file_data: dataUrl,
      },
    },
  ]);
  return parseQuestions(content);
}

async function extractFromImage(
  buf: Buffer,
  mime: string,
  material: MaterialRow,
  apiKey: string
): Promise<unknown[]> {
  const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;
  const content = await callOpenAI(apiKey, [
    { type: "text", text: buildPrompt(material) },
    { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
  ]);
  return parseQuestions(content);
}

async function extractFromText(
  text: string,
  material: MaterialRow,
  apiKey: string
): Promise<unknown[]> {
  const content = await callOpenAI(apiKey, [
    { type: "text", text: `${buildPrompt(material)}\n\nالنص:\n${text.slice(0, 40000)}` },
  ]);
  return parseQuestions(content);
}

async function callOpenAI(
  apiKey: string,
  userContent: unknown[]
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "أنت متخصص في استخراج أسئلة الامتحانات الفلسطينية (التوجيهي) من الملفات. اقرأ النص والصور داخل الملف بدقّة، وأرجع JSON صحيحاً فقط دون أي شرح خارج JSON.",
        },
        { role: "user", content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 16000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${res.status}`;
    throw new Error(`OpenAI: ${msg}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ─────────────────────────────────────────────────────────────
// أدوات مساعدة
// ─────────────────────────────────────────────────────────────

function buildPrompt(material: MaterialRow): string {
  return `استخرج جميع الأسئلة الموجودة في هذا الملف الخاص بمادة "${
    material.subject || "غير محددة"
  }" (${material.title}).

التعليمات:
1. اقرأ كل الأسئلة سواء كانت نصاً مطبوعاً أو داخل صور أو مكتوبة بخط اليد.
2. حسّن الصياغة العربية والإملاء مع الحفاظ على المعنى الأصلي تماماً.
3. استخرج الخيارات (أ، ب، ج، د) إن وُجدت.
4. حدّد الإجابة الصحيحة إن أمكن تحديدها من الملف، وإلا اجعلها الخيار الأول.
5. حدّد مستوى الصعوبة: easy أو medium أو hard.
6. لا تختلق أسئلة غير موجودة، ولا تحذف أسئلة موجودة.

أرجع النتيجة بهذه الصيغة فقط (JSON):
{
  "questions": [
    {
      "original_text": "نص السؤال كما ورد",
      "improved_text": "نص السؤال بعد تحسين الصياغة",
      "choices": [
        {"key": "أ", "text": "..."},
        {"key": "ب", "text": "..."},
        {"key": "ج", "text": "..."},
        {"key": "د", "text": "..."}
      ],
      "correct_answer": "أ",
      "difficulty": "medium"
    }
  ]
}`;
}

function parseQuestions(content: string): unknown[] {
  try {
    // response_format=json_object يضمن JSON، لكن نبقي التحصين احتياطاً.
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    return Array.isArray(parsed.questions) ? parsed.questions : [];
  } catch (err) {
    console.error("Parse error:", err, "| content head:", content.slice(0, 200));
    return [];
  }
}

/**
 * يطابق اسم مادة الملف (نص حر مثل "تكنولوجيا"/"احياء") مع صف في جدول subjects،
 * ويُرجع الـ id أو null إن تعذّر. الحفظ يقبل null (العمود nullable).
 */
async function resolveSubjectId(
  admin: ReturnType<typeof createAdminClient>,
  subjectName: string | null
): Promise<string | null> {
  if (!subjectName) return null;

  const { data: subjects } = await admin
    .from("subjects")
    .select("id, name_ar");
  if (!subjects || subjects.length === 0) return null;

  const target = normalizeArabic(subjectName);
  for (const s of subjects) {
    const candidate = normalizeArabic(s.name_ar);
    if (candidate.includes(target) || target.includes(candidate)) {
      return s.id;
    }
  }
  return null;
}

function normalizeArabic(input: string): string {
  return input
    .replace(/[ً-ٰٟ]/g, "") // إزالة التشكيل
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^ء-ي]/g, ""); // إبقاء الحروف العربية فقط
}
