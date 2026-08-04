import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { QUESTION_BANK_ENABLED } from "@/lib/domain/feature-flags";
import { AdminQuestionsClient } from "./questions-client";

export default async function AdminQuestionsPage() {
  await requireAdmin();
  if (!QUESTION_BANK_ENABLED) redirect("/app/admin");
  return <AdminQuestionsClient />;
}
