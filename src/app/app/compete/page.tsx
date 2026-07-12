"use client";

import { useEffect, useState } from "react";
import { Trophy, Users, WifiOff, Plus, LogIn, Crown, Copy, Check } from "lucide-react";
import { useLeaderboard, useChallenges } from "@/hooks/use-competitive";
import { relativePercent } from "@/lib/domain/competitive";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type Participant = Database["public"]["Tables"]["challenge_participants"]["Row"];

export default function CompetePage() {
  const [tab, setTab] = useState<"board" | "challenges">("board");
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 text-text-primary">التنافسي</h1>
        <p className="text-body text-text-secondary">
          اختياري بالكامل، باسم مستعار، ومبني على الالتزام لا العلامات — تحفيز
          إيجابي بلا مقارنة قاسية.
        </p>
      </header>

      <div className="flex gap-2">
        {[
          { k: "board", label: "لوحة الصدارة", icon: Trophy },
          { k: "challenges", label: "التحديات", icon: Users },
        ].map(({ k, label, icon: Icon }) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k as typeof tab)}
            className={cn(
              "inline-flex items-center gap-2 rounded-pill px-4 py-2 text-secondary transition-colors",
              tab === k
                ? "bg-brand-500 text-text-on-brand"
                : "bg-bg-surface text-text-secondary hover:text-text-primary"
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {tab === "board" ? <LeaderboardTab /> : <ChallengesTab />}
    </div>
  );
}

function OfflineNote() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
        <WifiOff className="size-7 text-text-muted" aria-hidden />
        <p className="text-body text-text-secondary">
          هذه الميزة تحتاج اتصالاً بالإنترنت للتحديث. تأكّد من اتصالك وحاول مجدداً.
        </p>
      </CardContent>
    </Card>
  );
}

/* ============ لوحة الصدارة ============ */
function LeaderboardTab() {
  const { board, mine, status, optIn, setVisible } = useLeaderboard();
  const [alias, setAlias] = useState("");

  if (status === "offline") return <OfflineNote />;

  return (
    <div className="flex flex-col gap-4">
      {/* اشتراكي */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h3">مشاركتي</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {mine ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="text-body text-text-primary">
                  {mine.display_alias} · مؤشّر {mine.commitment_score}
                </span>
                <label className="flex items-center gap-2 text-secondary text-text-secondary">
                  ظاهر للآخرين
                  <Switch checked={mine.is_visible} onChange={(v) => void setVisible(v)} />
                </label>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
                onClick={() => void optIn(mine.display_alias, mine.is_visible)}
              >
                حدّث مؤشّري الآن
              </Button>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (alias.trim()) void optIn(alias.trim());
              }}
              className="flex flex-col gap-2"
            >
              <Label htmlFor="alias">اسمك المستعار (لا يُشترط اسمك الحقيقي)</Label>
              <div className="flex gap-2">
                <Input
                  id="alias"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="مثال: نجم المثابرة"
                />
                <Button type="submit" disabled={!alias.trim()}>
                  انضمّ للوحة
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* الترتيب */}
      <div className="flex flex-col gap-2">
        {board.length > 0 ? (
          board.map((row, i) => (
            <Card
              key={row.user_id}
              className={cn(
                "flex items-center justify-between gap-3 p-4",
                mine?.user_id === row.user_id && "border-brand-500/40"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-pill text-secondary tabular-nums",
                    i === 0 ? "bg-accent-gold/15 text-accent-gold" : "bg-bg-raised text-text-secondary"
                  )}
                >
                  {i === 0 ? <Crown className="size-4" aria-hidden /> : i + 1}
                </span>
                <span className="text-body text-text-primary">{row.display_alias}</span>
              </div>
              <span className="text-secondary tabular-nums text-text-secondary">
                مؤشّر {row.commitment_score} · {row.streak_days} يوم
              </span>
            </Card>
          ))
        ) : (
          <p className="text-center text-secondary text-text-muted">
            لا أحد ظاهر بعد — كن أول من ينضم!
          </p>
        )}
      </div>
    </div>
  );
}

/* ============ التحديات ============ */
function ChallengesTab() {
  const { challenges, status, createChallenge, joinByCode } = useChallenges();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [alias, setAlias] = useState("");
  const [code, setCode] = useState("");
  const [joinAlias, setJoinAlias] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  if (status === "offline") return <OfflineNote />;

  return (
    <div className="flex flex-col gap-4">
      {/* إنشاء + انضمام */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-h3">
              <Plus className="size-4 text-brand-400" aria-hidden /> أنشئ تحدياً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim() && alias.trim()) {
                  void createChallenge(name.trim(), goal.trim(), alias.trim());
                  setName("");
                  setGoal("");
                }
              }}
              className="flex flex-col gap-2"
            >
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم التحدي" />
              <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="الهدف (مثال: مين يخلّص وحدة التفاضل أول)" />
              <Input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="اسمك المستعار بالتحدي" />
              <Button type="submit" disabled={!name.trim() || !alias.trim()}>
                أنشئ
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-h3">
              <LogIn className="size-4 text-brand-400" aria-hidden /> انضمّ بكود
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setMsg(null);
                if (!code.trim() || !joinAlias.trim()) return;
                const cid = await joinByCode(code.trim(), joinAlias.trim());
                setMsg(cid ? "انضممت للتحدي!" : "كود الدعوة غير صحيح.");
                setCode("");
              }}
              className="flex flex-col gap-2"
            >
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="كود الدعوة" dir="ltr" />
              <Input value={joinAlias} onChange={(e) => setJoinAlias(e.target.value)} placeholder="اسمك المستعار" />
              <Button type="submit" disabled={!code.trim() || !joinAlias.trim()}>
                انضمّ
              </Button>
              {msg && <p className="text-secondary text-text-secondary">{msg}</p>}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* تحدياتي */}
      {challenges.length > 0 ? (
        challenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)
      ) : (
        <p className="text-center text-secondary text-text-muted">
          لسا ما عندك تحديات. أنشئ واحداً أو انضمّ بكود من صديق.
        </p>
      )}
    </div>
  );
}

function ChallengeCard({
  challenge,
}: {
  challenge: Database["public"]["Tables"]["challenges"]["Row"];
}) {
  const { loadParticipants, setMyProgress } = useChallenges();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState("");

  useEffect(() => {
    void loadParticipants(challenge.id).then(setParticipants);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge.id]);

  const maxProgress = Math.max(1, ...participants.map((p) => p.progress));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-h3">{challenge.name}</CardTitle>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(challenge.invite_code);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex items-center gap-1.5 rounded-pill bg-bg-raised px-3 py-1.5 text-secondary tabular-nums text-text-secondary"
          >
            {copied ? <Check className="size-4 text-status-done" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            كود: {challenge.invite_code}
          </button>
        </div>
        {challenge.goal && (
          <p className="text-secondary text-text-muted">{challenge.goal}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* تقدّم نسبي لطيف */}
        {participants.map((p) => (
          <div key={p.user_id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-secondary">
              <span className="text-text-secondary">{p.display_alias ?? "طالب"}</span>
              <span className="tabular-nums text-text-muted">{p.progress}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-pill bg-bg-raised">
              <div
                className="h-full rounded-pill bg-brand-500 transition-all"
                style={{ width: `${relativePercent(p.progress, maxProgress)}%` }}
              />
            </div>
          </div>
        ))}

        {/* تحديث تقدّمي */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const n = Number(progress);
            if (Number.isFinite(n)) {
              await setMyProgress(challenge.id, Math.max(0, n));
              setParticipants(await loadParticipants(challenge.id));
              setProgress("");
            }
          }}
          className="flex items-center gap-2"
        >
          <Input
            type="number"
            min={0}
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            placeholder="حدّث تقدّمي"
            className="w-40"
          />
          <Button type="submit" size="sm" variant="secondary">
            حفظ
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
