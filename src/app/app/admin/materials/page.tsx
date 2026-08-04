import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { QUESTION_BANK_ENABLED } from "@/lib/domain/feature-flags";
import { MaterialsClient } from "./materials-client";

export default async function MaterialsPage() {
  await requireAdmin();
  if (!QUESTION_BANK_ENABLED) redirect("/app/admin");
  return <MaterialsClient />;
}
