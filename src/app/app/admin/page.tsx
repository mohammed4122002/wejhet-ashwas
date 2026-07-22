"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Plus, FileText, ChevronLeft, Sparkles } from "lucide-react";

const ADMIN_OPTIONS = [
  {
    href: "/app/admin/generate",
    label: "توليد الأسئلة التلقائي",
    description: "استخدم الذكاء الاصطناعي لتوليد أسئلة من المصادر",
    icon: Sparkles,
  },
  {
    href: "/app/admin/questions",
    label: "إدارة الأسئلة",
    description: "إضافة وتعديل أسئلة بنك الأسئلة يدوياً",
    icon: Plus,
  },
  {
    href: "/app/admin/materials",
    label: "إدارة الملفات والمصادر",
    description: "رفع ملفات PDF, Word, Excel, Markdown وروابط Google Drive",
    icon: FileText,
  },
];

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 text-text-primary">لوحة الإدارة</h1>
        <p className="text-body text-text-secondary">إدارة المحتوى والملفات والبيانات</p>
      </header>

      <div className="flex flex-col gap-3">
        {ADMIN_OPTIONS.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:border-brand-400">
              <span className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-bg-raised">
                  <Icon className="size-5 text-brand-400" aria-hidden />
                </span>
                <span className="flex flex-col">
                  <span className="text-h3 text-text-primary">{label}</span>
                  <span className="text-secondary text-text-muted">{description}</span>
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
