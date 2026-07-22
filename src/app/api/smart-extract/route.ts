import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    console.log("🧠 Smart extraction request received");

    const body = await request.json() as { material_id?: string };
    const { material_id } = body;

    if (!material_id) {
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
      return NextResponse.json(
        { error: "الملف غير موجود" },
        { status: 404 }
      );
    }

    console.log("✅ Material found:", material.title, "Type:", material.file_type);

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY غير موجود",
          debug: "أضفه في Vercel Environment Variables"
        },
        { status: 500 }
      );
    }

    let extractedQuestions: unknown[] = [];
    let detectionInfo = "";

    // تحديد نوع الملف والاستراتيجية
    const isImageFile = material.file_type?.toLowerCase() === "pdf" ||
                       material.file_type?.toLowerCase() === "image" ||
                       material.file_url?.includes("drive.google.com");

    if (isImageFile) {
      console.log("🖼️ Detected as image/PDF file - using Vision API");
      detectionInfo = "ملف صور (Vision API)";

      const result = await extractFromImageFile(
        material,
        openaiApiKey
      );
      extractedQuestions = result.questions;
    } else {
      console.log("📄 Detected as text file");
      detectionInfo = "ملف نصي";

      const result = await extractFromTextFile(
        material,
        openaiApiKey
      );
      extractedQuestions = result.questions;
    }

    console.log(`✅ Extracted ${extractedQuestions.length} questions`);

    return NextResponse.json({
      success: true,
      extracted_questions: extractedQuestions,
      material: {
        id: material.id,
        title: material.title,
        file_type: material.file_type,
        detection: detectionInfo,
      },
      message: `تم استخراج ${extractedQuestions.length} أسئلة من ${detectionInfo}`,
    });
  } catch (e) {
    console.error("❌ Smart extraction error:", e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "فشل الاستخراج",
        debug: e instanceof Error ? e.message : "unknown error"
      },
      { status: 500 }
    );
  }
}

async function extractFromImageFile(
  material: Record<string, unknown>,
  openaiApiKey: string
): Promise<{ questions: unknown[] }> {
  console.log("🖼️ Extracting from image file");

  let imageUrl = material.file_url as string;
  let imageMediaType: string | undefined = undefined;

  // تحويل رابط Google Drive - استخدم export=download للحصول على الصورة الفعلية
  if (material.source_type === "external_link" && imageUrl.includes("drive.google.com")) {
    const fileId = imageUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1] ||
                   imageUrl.match(/id=([a-zA-Z0-9-_]+)/)?.[1];
    if (fileId) {
      // استخدم download بدلاً من view للحصول على الملف الفعلي
      imageUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      console.log("🔄 Converted Google Drive URL to download format");
    }
  }

  // حاول تحديد نوع الصورة من امتداد الملف أو الـ URL
  if (imageUrl.toLowerCase().includes(".png")) {
    imageMediaType = "image/png";
  } else if (imageUrl.toLowerCase().includes(".jpg") || imageUrl.toLowerCase().includes(".jpeg")) {
    imageMediaType = "image/jpeg";
  } else if (imageUrl.toLowerCase().includes(".gif")) {
    imageMediaType = "image/gif";
  } else if (imageUrl.toLowerCase().includes(".webp")) {
    imageMediaType = "image/webp";
  }

  console.log("🔗 Image URL:", imageUrl.substring(0, 100) + "...");
  console.log("📸 Media type:", imageMediaType || "auto-detect");

  const imageUrlContent = imageMediaType ?
    { url: imageUrl, detail: "high" as const } :
    { url: imageUrl };

  const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "أنت متخصص في استخراج أسئلة الامتحانات من الصور. أرجع JSON صحيح فقط.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildImageExtractionPrompt(material),
            },
            {
              type: "image_url",
              image_url: imageUrlContent,
            },
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!openaiResponse.ok) {
    const error = await openaiResponse.json();
    const errorMsg = error.error?.message || "Unknown error";
    console.error("❌ OpenAI error response:", errorMsg);

    // إذا كان الخطأ عن صيغة الصورة، جرّب بدون تحديد media type
    if (errorMsg.includes("unsupported") && imageMediaType) {
      console.log("⚠️ Retrying without explicit media type...");
      return retryWithoutMediaType(material, openaiApiKey, imageUrl);
    }

    throw new Error(`OpenAI: ${errorMsg}`);
  }

  const data = await openaiResponse.json();
  const content = data.choices?.[0]?.message?.content || "";

  return parseQuestionsFromResponse(content);
}

async function extractFromTextFile(
  material: Record<string, unknown>,
  openaiApiKey: string
): Promise<{ questions: unknown[] }> {
  console.log("📄 Extracting from text file");

  // للملفات النصية، نستخدم الـ URL مباشرة أو محتوى الملف
  const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "أنت متخصص في استخراج أسئلة الامتحانات من النصوص. أرجع JSON صحيح فقط.",
        },
        {
          role: "user",
          content: buildTextExtractionPrompt(material),
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!openaiResponse.ok) {
    const error = await openaiResponse.json();
    throw new Error(`OpenAI: ${error.error?.message || "Unknown error"}`);
  }

  const data = await openaiResponse.json();
  const content = data.choices?.[0]?.message?.content || "";

  return parseQuestionsFromResponse(content);
}

async function retryWithoutMediaType(
  material: Record<string, unknown>,
  openaiApiKey: string,
  imageUrl: string
): Promise<{ questions: unknown[] }> {
  const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "أنت متخصص في استخراج أسئلة الامتحانات من الصور. أرجع JSON صحيح فقط.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildImageExtractionPrompt(material),
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!openaiResponse.ok) {
    const error = await openaiResponse.json();
    throw new Error(`OpenAI (retry): ${error.error?.message || "Unknown error"}`);
  }

  const data = await openaiResponse.json();
  const content = data.choices?.[0]?.message?.content || "";

  return parseQuestionsFromResponse(content);
}

function parseQuestionsFromResponse(content: string): { questions: unknown[] } {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      };
    }
  } catch (err) {
    console.error("Parse error:", err);
  }

  return { questions: [] };
}

function buildImageExtractionPrompt(material: Record<string, unknown>): string {
  return `استخرج جميع الأسئلة من هذه الصورة/الملف:

المادة: ${material.subject || "غير محددة"}
الملف: ${material.title}

المطلوب:
1. اقرأ كل الأسئلة الموجودة (سواء كانت مطبوعة أو مكتوبة بخط يد)
2. استخرج النص كاملاً
3. حسّن الصياغة والإملاء
4. استخرج الخيارات (أ، ب، ج، د)
5. حدّد مستوى الصعوبة

أرجع النتيجة بصيغة JSON:
{
  "questions": [
    {
      "original_text": "النص الأصلي",
      "improved_text": "النص المحسّن",
      "choices": [{"key": "أ", "text": "..."}, {"key": "ب", "text": "..."}],
      "difficulty": "medium"
    }
  ]
}`;
}

function buildTextExtractionPrompt(material: Record<string, unknown>): string {
  return `استخرج جميع الأسئلة من النص التالي:

المادة: ${material.subject || "غير محددة"}
الملف: ${material.title}
الوصف: ${material.description || ""}

المطلوب:
1. استخرج كل الأسئلة
2. حسّن الصياغة
3. استخرج الخيارات
4. حدّد الصعوبة

أرجع JSON:
{
  "questions": [
    {
      "original_text": "النص الأصلي",
      "improved_text": "النص المحسّن",
      "choices": [{"key": "أ", "text": "..."}, {"key": "ب", "text": "..."}],
      "difficulty": "medium"
    }
  ]
}`;
}
