"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDB } from "@/lib/db/dexie";
import { useUserId } from "@/components/app/app-data-provider";
import { commitmentScore, type ChallengeGoalType } from "@/lib/domain/competitive";
import { longestStreak, currentStreak } from "@/lib/domain/rewards";
import { todayISO } from "@/lib/db/ids";
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

/**
 * تقدّم حقيقي بتحدٍّ محسوب تلقائياً من البيانات المحلية — بدون أي إدخال يدوي
 * قابل للغش. `sinceDate` هو تاريخ بداية التحدي (أو تاريخ إنشائه لو ما حُدِّد).
 */
async function computeChallengeMetric(
  userId: string,
  goalType: ChallengeGoalType,
  sinceDate: string
): Promise<number> {
  const db = getDB();
  switch (goalType) {
    case "tasks": {
      const done = await db.tasks
        .where("user_id")
        .equals(userId)
        .and((t) => t.status === "done" && (t.completed_at ?? t.task_date).slice(0, 10) >= sinceDate)
        .toArray();
      return done.length;
    }
    case "focus_minutes": {
      const sessions = await db.pomodoro_sessions
        .where("user_id")
        .equals(userId)
        .and((s) => s.session_type === "focus" && s.started_at.slice(0, 10) >= sinceDate)
        .toArray();
      return sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
    }
    case "streak_days": {
      const done = await db.tasks
        .where("user_id")
        .equals(userId)
        .and((t) => t.status === "done")
        .toArray();
      const dates = done.map((t) => (t.completed_at ?? t.task_date).slice(0, 10));
      return currentStreak(dates, todayISO());
    }
    case "lessons_mastered": {
      const [tasks, attempts, questions] = await Promise.all([
        db.tasks.where("user_id").equals(userId).toArray(),
        db.question_attempts.where("user_id").equals(userId).toArray(),
        db.question_bank_items.toArray(),
      ]);
      const questionLesson = new Map(questions.map((q) => [q.id, q.lesson_id]));
      const mastered = new Set<string>();
      for (const t of tasks) {
        if (t.status === "done" && t.lesson_id && (t.completed_at ?? t.task_date).slice(0, 10) >= sinceDate) {
          mastered.add(t.lesson_id);
        }
      }
      for (const a of attempts) {
        if (a.is_correct && a.question_id && (a.answered_at ?? "").slice(0, 10) >= sinceDate) {
          const lessonId = questionLesson.get(a.question_id);
          if (lessonId) mastered.add(lessonId);
        }
      }
      return mastered.size;
    }
    case "questions_solved": {
      const attempts = await db.question_attempts
        .where("user_id")
        .equals(userId)
        .and((a) => a.is_correct && (a.answered_at ?? "").slice(0, 10) >= sinceDate)
        .toArray();
      return attempts.length;
    }
  }
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

  async function createChallenge(
    name: string,
    goalType: ChallengeGoalType,
    note: string,
    alias: string
  ) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("challenges")
      .insert({ creator_id: userId, name, goal: note || null, goal_type: goalType })
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

  /**
   * يحسب تقدّمي الحقيقي بالتحدي من بياناتي المحلية ويرفعه — بدل الإدخال
   * اليدوي القابل للغش. يُستدعى تلقائياً عند فتح التحدي.
   */
  async function syncMyProgress(challenge: ChallengeRow): Promise<number> {
    const sinceDate = (challenge.start_date ?? challenge.created_at ?? "").slice(0, 10) || "2000-01-01";
    const progress = await computeChallengeMetric(
      userId,
      challenge.goal_type as ChallengeGoalType,
      sinceDate
    );
    const supabase = createClient();
    await supabase
      .from("challenge_participants")
      .update({ progress, updated_at: new Date().toISOString() })
      .eq("challenge_id", challenge.id)
      .eq("user_id", userId);
    return progress;
  }

  return {
    challenges,
    status,
    refresh,
    createChallenge,
    joinByCode,
    loadParticipants,
    syncMyProgress,
  };
}
