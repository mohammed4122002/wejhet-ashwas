import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";

async function assertAdmin() {
  const supabase = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) {
    return null;
  }
  return user;
}

interface ExtractedQuestion {
  original_text: string;
  improved_text: string;
  choices?: Array<{ key: string; text: string }>;
  difficulty?: string;
  material_id: string;
}

export async function POST(request: NextRequest) {
  const user = await assertAdmin();
  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  try {
    const body = await request.json() as { material_id?: string };
    const admin = createAdminClient();

    // احصل على قائمة الملفات
    let materialsQuery = admin.from("materials").select("*");

    if (body.material_id) {
      materialsQuery = materialsQuery.eq("id", body.material_id);
    }

    const { data: materials, error: materialsError } = await materialsQuery;

    if (materialsError) {
      return NextResponse.json(
        { error: `Failed to fetch materials: ${materialsError.message}` },
        { status: 500 }
      );
    }

    if (!materials || materials.length === 0) {
      return NextResponse.json(
        { error: "No materials found" },
        { status: 404 }
      );
    }

    const extractedQuestions: ExtractedQuestion[] = [];
    const summaryStats = {
      total_materials: materials.length,
      total_questions_found: 0,
      total_questions_improved: 0,
      materials_processed: [] as Array<{
        id: string;
        title: string;
        file_type: string;
        questions_found: number;
      }>,
    };

    // معالجة كل ملف
    for (const material of materials) {
      console.log(`Processing material: ${material.title}`);

      // التعليمات لاستخراج الأسئلة حسب نوع الملف
      const instructions = buildExtractionInstructions(
        material.title,
        material.file_type,
        material.subject || "غير محددة"
      );

      // يجب تنزيل الملف من Supabase Storage
      try {
        // إذا كان الملف من Google Drive أو رابط خارجي
        if (material.source_type !== "external_link" && material.source_type !== "supabase_storage") {
          continue;
        }
      } catch (err) {
        console.error(`Error processing material ${material.id}:`, err);
        continue;
      }

      // استدعاء OpenAI لاستخراج وتحسين الأسئلة
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return NextResponse.json(
          { error: "OPENAI_API_KEY غير مُعرّف" },
          { status: 500 }
        );
      }

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "أنت متخصص في استخراج وتحسين أسئلة الامتحانات من الملفات التعليمية. أرجع دائماً JSON صحيح.",
            },
            {
              role: "user",
              content: instructions,
            },
          ],
          temperature: 0.7,
          max_tokens: 3000,
        }),
      });

      if (!openaiResponse.ok) {
        const openaiError = await openaiResponse.json();
        console.error("OpenAI error:", openaiError);
        continue;
      }

      const openaiData = await openaiResponse.json();
      const content = openaiData.choices?.[0]?.message?.content || "";

      // تحليل النتيجة
      let extractedData: Record<string, unknown> = { questions: [] };
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        }
      } catch (parseErr) {
        console.error("Failed to parse OpenAI response:", parseErr);
      }

      const questions = Array.isArray(extractedData.questions) ? extractedData.questions : [];

      if (questions.length > 0) {
        summaryStats.total_questions_found += questions.length;
        summaryStats.total_questions_improved += questions.length;
        summaryStats.materials_processed.push({
          id: material.id,
          title: material.title,
          file_type: material.file_type,
          questions_found: questions.length,
        });

        extractedQuestions.push(
          ...questions.map((q: Record<string, unknown>) => ({
            original_text: String(q.original_text || ""),
            improved_text: String(q.improved_text || ""),
            choices: q.choices as Array<{ key: string; text: string }> | undefined,
            difficulty: String(q.difficulty || ""),
            material_id: material.id,
          }))
        );
      }
    }

    return NextResponse.json({
      success: true,
      extracted_questions: extractedQuestions,
      summary: summaryStats,
      message: `تم استخراج ${summaryStats.total_questions_found} أسئلة من ${summaryStats.materials_processed.length} ملف`,
    });
  } catch (e) {
    console.error("Extract questions error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل الاستخراج" },
      { status: 500 }
    );
  }
}

function buildExtractionInstructions(
  title: string,
  fileType: string,
  subject: string
): string {
  return `استخرج جميع الأسئلة من الملف الموصوف أدناه وحسّن صياغتها:

الملف: ${title}
نوع الملف: ${fileType}
المادة: ${subject}

المطلوب:
1. استخرج جميع الأسئلة الموجودة
2. حسّن الصياغة العربية لكل سؤال
3. تأكد من وضوح الخيارات (إن وجدت)
4. حدد مستوى الصعوبة إن أمكن

أرجع النتيجة بالصيغة التالية:
{
  "questions": [
    {
      "original_text": "النص الأصلي للسؤال",
      "improved_text": "النص المحسّن للسؤال",
      "choices": [
        {"key": "أ", "text": "الخيار الأول"},
        {"key": "ب", "text": "الخيار الثاني"},
        {"key": "ج", "text": "الخيار الثالث"},
        {"key": "د", "text": "الخيار الرابع"}
      ],
      "difficulty": "medium"
    }
  ]
}`;
}
