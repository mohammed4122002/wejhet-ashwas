"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Bell,
  BellRing,
  Palette,
  SlidersHorizontal,
  UserRound,
  Lock,
  Camera,
  Loader2,
} from "lucide-react";
import { usePrefs } from "@/hooks/use-prefs";
import { REWARD_SYSTEMS } from "@/lib/domain/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioCard } from "@/components/ui/radio-card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  notificationPermission,
  requestNotificationPermission,
} from "@/lib/notifications";
import type { RewardSystem } from "@/lib/supabase/database.types";

export default function SettingsPage() {
  const {
    rewardSystem,
    autoScheduleApply,
    reminders,
    setRewardSystem,
    setAutoScheduleApply,
    setReminder,
  } = usePrefs();

  const [perm, setPerm] = useState<string>("default");
  useEffect(() => setPerm(notificationPermission()), []);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 text-text-primary">الإعدادات</h1>
        <p className="text-body text-text-secondary">
          كل شي بيدك — بدّل ما بدّك بدون ما تخسر أي تقدّم.
        </p>
      </header>

      <ProfileSection />
      <SecuritySection />

      {/* نظام المكافأة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-5 text-brand-400" aria-hidden />
            قالب المكافأة
          </CardTitle>
          <CardDescription>
            بدّل القالب أي وقت — نفس بياناتك، عرض مختلف فقط.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {REWARD_SYSTEMS.map((r) => (
            <RadioCard
              key={r.value}
              name="reward_system"
              value={r.value}
              checked={rewardSystem === r.value}
              onChange={(v) => void setRewardSystem(v as RewardSystem)}
              title={r.label}
              description={r.description}
            />
          ))}
        </CardContent>
      </Card>

      {/* التذكيرات ثلاثية الطبقة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5 text-brand-400" aria-hidden />
            التذكيرات
          </CardTitle>
          <CardDescription>كل نوع تشغّله أو تطفيه باستقلال.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ToggleRow
            title="تذكيرات دراسية"
            desc="قبل موعد مهمة أو عند تأخّرها + ملخّص الشكوك."
            checked={reminders.study_reminders}
            onChange={(v) => void setReminder("study_reminders", v)}
          />
          <ToggleRow
            title="تذكيرات تحفيزية"
            desc="رسائل قصيرة داعمة عند الإنجاز أو البداية."
            checked={reminders.motivational_reminders}
            onChange={(v) => void setReminder("motivational_reminders", v)}
          />
          <ToggleRow
            title="تذكيرات دينية"
            desc="أدعية قصيرة قبل المذاكرة (مطفأة افتراضياً)."
            checked={reminders.religious_reminders}
            onChange={(v) => void setReminder("religious_reminders", v)}
          />

          {/* إشعارات المتصفّح */}
          <div className="flex flex-col gap-2 rounded-input border border-strong bg-bg-surface p-4">
            <div className="flex items-center gap-2 text-body text-text-primary">
              <BellRing className="size-4 text-brand-400" aria-hidden />
              إشعارات المتصفّح
            </div>
            {perm === "granted" ? (
              <p className="text-secondary text-status-done">مفعّلة ✓</p>
            ) : perm === "unsupported" ? (
              <p className="text-secondary text-text-muted">
                متصفّحك لا يدعم الإشعارات.
              </p>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
                onClick={async () => setPerm(await requestNotificationPermission())}
              >
                فعّل إشعارات المتصفّح
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* الجدولة التلقائية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="size-5 text-brand-400" aria-hidden />
            الجدولة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleRow
            title="طبّق الجدول التلقائي بدون مراجعة"
            desc="لما تولّد جدولاً تلقائياً، يُعتمد مباشرة بدون شاشة موافقة. (معطّل افتراضياً — أنت صاحب القرار)"
            checked={autoScheduleApply}
            onChange={(v) => void setAutoScheduleApply(v)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

/* ============ الملف الشخصي: الاسم + الصورة ============ */
function ProfileSection() {
  const { displayName, avatarUrl, email, setDisplayName, uploadAvatar } = usePrefs();
  const [name, setName] = useState(displayName ?? "");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setName(displayName ?? ""), [displayName]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    setUploading(true);
    try {
      await uploadAvatar(file);
    } catch {
      setMsg("تعذّر رفع الصورة — تأكّد من اتصالك.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="size-5 text-brand-400" aria-hidden />
          الملف الشخصي
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="flex size-20 items-center justify-center overflow-hidden rounded-pill border border-strong bg-bg-raised">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="صورة البروفايل" width={80} height={80} className="size-full object-cover" />
              ) : (
                <UserRound className="size-8 text-text-muted" aria-hidden />
              )}
            </span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -left-1 flex size-8 items-center justify-center rounded-pill bg-brand-500 text-text-on-brand shadow-glow-brand"
              aria-label="غيّر الصورة"
            >
              {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Camera className="size-4" aria-hidden />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
          </div>
          <div className="flex flex-col">
            <span className="text-body text-text-primary">{displayName || "طالب"}</span>
            <span className="text-secondary text-text-muted" dir="ltr">{email}</span>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void setDisplayName(name);
            setMsg("تم حفظ الاسم.");
          }}
          className="flex flex-col gap-2"
        >
          <Label htmlFor="display-name">الاسم المعروض</Label>
          <div className="flex gap-2">
            <Input id="display-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك" />
            <Button type="submit">حفظ</Button>
          </div>
        </form>
        {msg && <p className="text-secondary text-text-secondary">{msg}</p>}
      </CardContent>
    </Card>
  );
}

/* ============ الأمان: تغيير كلمة المرور ============ */
function SecuritySection() {
  const { changePassword } = usePrefs();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (pw.length < 6) return setMsg({ ok: false, text: "كلمة المرور 6 أحرف على الأقل." });
    if (pw !== pw2) return setMsg({ ok: false, text: "الكلمتان غير متطابقتين." });
    setSaving(true);
    try {
      await changePassword(pw);
      setMsg({ ok: true, text: "تم تغيير كلمة المرور." });
      setPw("");
      setPw2("");
    } catch {
      setMsg({ ok: false, text: "تعذّر التغيير — تأكّد من اتصالك وأعد المحاولة." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="size-5 text-brand-400" aria-hidden />
          كلمة المرور
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-pw">كلمة مرور جديدة</Label>
            <Input id="new-pw" type="password" dir="ltr" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-pw2">تأكيد كلمة المرور</Label>
            <Input id="new-pw2" type="password" dir="ltr" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
          </div>
          <Button type="submit" disabled={saving} className="self-start">
            {saving && <Loader2 className="animate-spin" aria-hidden />}
            غيّر كلمة المرور
          </Button>
          {msg && (
            <p className={msg.ok ? "text-secondary text-status-done" : "text-secondary text-brand-400"}>
              {msg.text}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col">
        <span className="text-body text-text-primary">{title}</span>
        <span className="text-secondary text-text-muted">{desc}</span>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}
