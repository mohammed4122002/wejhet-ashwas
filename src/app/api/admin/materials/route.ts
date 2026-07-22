import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";

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

export async function GET() {
  const user = await assertAdmin();
  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("materials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ materials: data ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await assertAdmin();
  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      subject,
      file_type,
      source_type,
      file_url,
      file_size,
      tags,
    } = body;

    if (!title || !file_type || !source_type || !file_url) {
      return NextResponse.json(
        { error: "البيانات المطلوبة ناقصة" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("materials")
      .insert({
        title,
        description,
        subject,
        file_type,
        source_type,
        file_url,
        file_size,
        tags: tags || [],
        created_by: user.id,
      })
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data?.[0]?.id, success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل المعالجة" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = await assertAdmin();
  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "معرّف الملف مطلوب" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("materials")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل المعالجة" },
      { status: 500 }
    );
  }
}
