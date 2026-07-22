import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import type { Database, SubjectTrack } from "@/lib/supabase/database.types";

const VALID_TRACKS: SubjectTrack[] = ["scientific", "literary", "shared"];

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
      track,
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

    if (track && !VALID_TRACKS.includes(track)) {
      return NextResponse.json({ error: "التخصص غير صحيح" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("materials")
      .insert({
        title,
        description,
        subject,
        track: (track as SubjectTrack) || "shared",
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

export async function PATCH(request: NextRequest) {
  const user = await assertAdmin();
  if (!user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, title, description, subject, track } = body;

    if (!id) {
      return NextResponse.json({ error: "معرّف الملف مطلوب" }, { status: 400 });
    }
    if (track && !VALID_TRACKS.includes(track)) {
      return NextResponse.json({ error: "التخصص غير صحيح" }, { status: 400 });
    }

    const updates: Database["public"]["Tables"]["materials"]["Update"] = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (subject !== undefined) updates.subject = subject;
    if (track !== undefined) updates.track = track;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "لا يوجد تغييرات لحفظها" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin.from("materials").update(updates).eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل التعديل" },
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
