import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Extract request received");

    const body = await request.json() as { material_id?: string };
    const { material_id } = body;

    if (!material_id) {
      console.error("❌ No material_id provided");
      return NextResponse.json(
        { error: "material_id مطلوب" },
        { status: 400 }
      );
    }

    console.log("📥 Fetching material:", material_id);

    const supabase = await createClient();
    const { data: material, error: materialError } = await supabase
      .from("materials")
      .select("*")
      .eq("id", material_id)
      .single();

    if (materialError || !material) {
      console.error("❌ Material not found:", materialError);
      return NextResponse.json(
        { error: "الملف غير موجود" },
        { status: 404 }
      );
    }

    console.log("✅ Material found:", material.title);

    // تحقق من OPENAI_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error("❌ OPENAI_API_KEY not found in environment");
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY غير موجود - أضفه في Vercel Environment Variables",
          debug: "تحقق من: https://vercel.com/dashboard/wejhet-ashwas/settings/environment-variables"
        },
        { status: 500 }
      );
    }

    console.log("🤖 Calling OpenAI API...");

    const prompt = buildExtractionPrompt(material);

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
              "أنت متخصص في استخراج وتحسين أسئلة الامتحانات. أرجع دائماً JSON صحيح.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    console.log("📊 OpenAI Response status:", openaiResponse.status);

    if (!openaiResponse.ok) {
      const openaiError = await openaiResponse.json();
      console.error("❌ OpenAI error:", openaiError);
      return NextResponse.json(
        {
          error: `خطأ من OpenAI: ${openaiError.error?.message || "غير معروف"}`,
          debug: openaiError,
        },
        { status: 500 }
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content || "";

    console.log("📝 OpenAI Response length:", content.length);

    // تحليل النتيجة
    let extractedData: Record<string, unknown> = { questions: [] };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
        console.log("✅ JSON parsed successfully, questions:", (extractedData.questions as unknown[])?.length || 0);
      } else {
        console.warn("⚠️ No JSON found in response");
      }
    } catch (parseErr) {
      console.error("❌ Failed to parse OpenAI response:", parseErr);
      return NextResponse.json(
        {
          error: "فشل تحليل رد OpenAI",
          debug: content.substring(0, 200),
        },
        { status: 500 }
      );
    }

    const questions = Array.isArray(extractedData.questions) ? extractedData.questions : [];

    console.log(`✅ Success! Extracted ${questions.length} questions`);

    return NextResponse.json({
      success: true,
      extracted_questions: questions,
      material: {
        id: material.id,
        title: material.title,
        file_type: material.file_type,
      },
      message: `تم استخراج ${questions.length} أسئلة بنجاح`,
    });
  } catch (e) {
    console.error("❌ Extract error:", e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "فشل الاستخراج",
        debug: e instanceof Error ? e.stack : "unknown error"
      },
      { status: 500 }
    );
  }
}

function buildExtractionPrompt(material: Record<string, unknown>): string {
  return `استخرج جميع الأسئلة من الملف التالي وحسّن صياغتها:

الملف: ${material.title}
نوع الملف: ${material.file_type}
المادة: ${material.subject || "غير محددة"}
الوصف: ${material.description || ""}

المطلوب:
1. استخرج جميع الأسئلة الموجودة
2. حسّن الصياغة العربية لكل سؤال
3. تأكد من وضوح الخيارات (إن وجدت)
4. حدد مستوى الصعوبة

أرجع النتيجة بالصيغة التالية (JSON):
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
