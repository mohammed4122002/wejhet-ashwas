import { requireAdmin } from "@/lib/supabase/require-admin";
import { TimeCapsuleAdminClient } from "./time-capsule-client";

export default async function TimeCapsuleAdminPage() {
  await requireAdmin();
  return <TimeCapsuleAdminClient />;
}
