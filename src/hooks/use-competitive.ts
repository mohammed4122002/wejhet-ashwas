"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDB } from "@/lib/db/dexie";
import { useUserId } from "@/components/app/app-data-provider";
import { commitmentScore } from "@/lib/domain/competitive";
import { longestStreak } from "@/lib/domain/rewards";
import type { Database } from "@/lib/supabase/database.types";

type LeaderRow = Database["public"]["Tables"]["leaderboard_opt_in"]["Row"];
type ChallengeRow = Database["public"]["Tables"]["challenges"]["Row"];
type ParticipantRow =
  Database["public"]["Tables"]["challenge_participants"]["Row"];

/** يحسب مؤشّر التزام الطالب من بياناته المحلية (مهام مكتملة + سلسلة أيام). */
async function computeMyMetric(userId: string) {
  const done = await getDB()
    .tasks.where("user_id")
    .equals(userId)
    .and((t) => t.status === "done")
    .toArray();
  const dates = done.map((t) => (t.completed_at ?? t.task_date).slice(0, 10));
  const streak = longestStreak(dates);
  return { score: commitmentScore(done.length, streak), streak };
}

// ============ لوحة الصدارة ============
export function useLeaderboard() {
  const userId = useUserId();
  const [board, setBoard] = useState<LeaderRow[]>([]);
  const [mine, setMine] = useState<LeaderRow | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "offline">("loading");

  const refresh = useCallback(async () => {
    const supabase = createClient();
    try {
      const [{ data: rows, error: e1 }, { data: my }] = await Promise.all([
        supabase
          .from("leaderboard_opt_in")
          .select("*")
          .eq("is_visible", true)
          .order("commitment_score", { ascending: false })
          .limit(50),
        supabase.from("leaderboard_opt_in").select("*").eq("user_id", userId).maybeSingle(),
      ]);
      if (e1) throw e1;
      setBoard(rows ?? []);
      setMine(my ?? null);
      setStatus("ready");
    } catch {
      setStatus("offline");
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** يفعّل الظهور بلوحة الصدارة باسم مستعار + ينشر مؤشّر الالتزام الحالي. */
  async function optIn(alias: string, visible = true) {
    const supabase = createClient();
    const { score, streak } = await computeMyMetric(userId);
    const { error } = await supabase.from("leaderboard_opt_in").upsert(
      {
        user_id: userId,
        display_alias: alias,
        is_visible: visible,
        commitment_score: score,
        streak_days: streak,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) throw error;
    await refresh();
  }

  async function setVisible(visible: boolean) {
    if (!mine) return;
    await optIn(mine.display_alias, visible);
  }

  return { board, mine, status, refresh, optIn, setVisible };
}

// ============ التحديات الجماعية ============
export function useChallenges() {
  const userId = useUserId();
  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "offline">("loading");

  const refresh = useCallback(async () => {
    const supabase = createClient();
    try {
      // التحديات اللي أنا عضو فيها (سياسة القراءة تسمح بها)
      const { data: parts } = await supabase
        .from("challenge_participants")
        .select("challenge_id")
        .eq("user_id", userId);
      const ids = (parts ?? []).map((p) => p.challenge_id);
      const { data: created } = await supabase
        .from("challenges")
        .select("*")
        .eq("creator_id", userId);
      let joined: ChallengeRow[] = [];
      if (ids.length) {
        const { data } = await supabase.from("challenges").select("*").in("id", ids);
        joined = data ?? [];
      }
      const map = new Map<string, ChallengeRow>();
      [...(created ?? []), ...joined].forEach((c) => map.set(c.id, c));
      setChallenges([...map.values()]);
      setStatus("ready");
    } catch {
      setStatus("offline");
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function createChallenge(name: string, goal: string, alias: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("challenges")
      .insert({ creator_id: userId, name, goal })
      .select()
      .single();
    if (error) throw error;
    // ينضمّ المنشئ تلقائياً
    await supabase.from("challenge_participants").insert({
      challenge_id: data.id,
      user_id: userId,
      display_alias: alias,
    });
    await refresh();
    return data;
  }

  /** الانضمام بكود دعوة عبر دالة آمنة (لا تكشف بقية التحديات). */
  async function joinByCode(code: string, alias: string) {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("join_challenge", {
      code,
      alias,
    });
    if (error) throw error;
    await refresh();
    return data; // معرّف التحدي أو null لو الكود غير صحيح
  }

  async function loadParticipants(challengeId: string): Promise<ParticipantRow[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from("challenge_participants")
      .select("*")
      .eq("challenge_id", challengeId)
      .order("progress", { ascending: false });
    return data ?? [];
  }

  async function setMyProgress(challengeId: string, progress: number) {
    const supabase = createClient();
    await supabase
      .from("challenge_participants")
      .update({ progress, updated_at: new Date().toISOString() })
      .eq("challenge_id", challengeId)
      .eq("user_id", userId);
  }

  return {
    challenges,
    status,
    refresh,
    createChallenge,
    joinByCode,
    loadParticipants,
    setMyProgress,
  };
}
