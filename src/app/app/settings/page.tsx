"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Palette, SlidersHorizontal } from "lucide-react";
import { usePrefs } from "@/hooks/use-prefs";
import { REWARD_SYSTEMS } from "@/lib/domain/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioCard } from "@/components/ui/radio-card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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
