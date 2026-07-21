import Link from "next/link";
import {
  Sparkles,
  Trophy,
  HelpCircle,
  Settings,
  Zap,
  ChevronLeft,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const ITEMS = [
  {
    href: "/app/challenge",
    label: "التحدي اليومي",
    desc: "سؤال عشوائي — 30 ثانية فقط!",
    icon: Zap,
  },
  {
    href: "/app/rewards",
    label: "إنجازي",
    desc: "مكافآتك البصرية وشاراتك",
    icon: Sparkles,
  },
  {
    href: "/app/compete",
    label: "التنافسي",
    desc: "لوحة الصدارة والتحديات مع أصدقائك",
    icon: Trophy,
  },
  {
    href: "/app/doubts",
    label: "صندوق الشكوك",
    desc: "أسئلتك المعلّقة — خذها لأستاذك",
    icon: HelpCircle,
  },
  {
    href: "/app/settings",
    label: "الإعدادات",
    desc: "ملفك الشخصي، قالب المكافأة، التذكيرات",
    icon: Settings,
  },
  {
    href: "/app/admin",
    label: "إدارة الأسئلة",
    desc: "إضافة وإدارة بنك الأسئلة (للمشرفين)",
    icon: ShieldCheck,
  },
];

export default function MorePage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 text-text-primary">المزيد</h1>
        <p className="text-body text-text-secondary">بقية أقسام المنصة.</p>
      </header>

      <div className="flex flex-col gap-3">
        {ITEMS.map(({ href, label, desc, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:border-brand-400">
              <span className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-bg-raised">
                  <Icon className="size-5 text-brand-400" aria-hidden />
                </span>
                <span className="flex flex-col">
                  <span className="text-h3 text-text-primary">{label}</span>
                  <span className="text-secondary text-text-muted">{desc}</span>
                </span>
              </span>
              <ChevronLeft className="size-5 shrink-0 text-text-muted" aria-hidden />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
