"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Link as LinkIcon,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileCode,
  Sheet,
  File,
  ExternalLink,
} from "lucide-react";

interface Material {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  file_type: "pdf" | "word" | "markdown" | "excel" | "google_drive";
  source_type: "supabase_storage" | "external_link";
  file_url: string;
  file_size?: number;
  tags: string[];
  created_at: string;
}

const FILE_TYPES = [
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "word", label: "Word (.docx)", icon: File },
  { value: "markdown", label: "Markdown (.md)", icon: FileCode },
  { value: "excel", label: "Excel (.xlsx)", icon: Sheet },
];

function getFileIcon(type: string) {
  const file = FILE_TYPES.find((f) => f.value === type);
  return file?.icon || FileText;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "drive">("upload");

  // Form state for file upload
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [fileType, setFileType] = useState("pdf");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Form state for Google Drive link
  const [driveTitle, setDriveTitle] = useState("");
  const [driveDescription, setDriveDescription] = useState("");
  const [driveSubject, setDriveSubject] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [driveTags, setDriveTags] = useState("");

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function fetchMaterials() {
    try {
      const res = await fetch("/api/admin/materials");
      if (!res.ok) throw new Error("فشل تحميل الملفات");
      const data = await res.json();
      setMaterials(data.materials || []);
    } catch (e) {
      setToast({
        type: "error",
        msg: e instanceof Error ? e.message : "فشل التحميل",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadFile() {
    if (!title.trim()) {
      setToast({ type: "error", msg: "أدخل اسم الملف" });
      return;
    }
    if (!file) {
      setToast({ type: "error", msg: "اختر ملفاً للرفع" });
      return;
    }

    setSaving(true);
    try {
      // Create FormData with file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", `materials/${Date.now()}-${file.name}`);
      formData.append("bucket", "all-materials");

      // Upload to Supabase Storage
      const uploadRes = await fetch("/api/admin/upload-material", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("فشل رفع الملف");
      const { publicUrl } = await uploadRes.json();

      // Save metadata to materials table
      const res = await fetch("/api/admin/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          subject: subject.trim() || null,
          file_type: fileType,
          source_type: "supabase_storage",
          file_url: publicUrl,
          file_size: file.size,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error("فشل حفظ البيانات");

      setToast({ type: "success", msg: "تم رفع الملف بنجاح" });
      setTitle("");
      setDescription("");
      setSubject("");
      setFileType("pdf");
      setTags("");
      setFile(null);
      fetchMaterials();
    } catch (e) {
      setToast({
        type: "error",
        msg: e instanceof Error ? e.message : "فشل الرفع",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddDriveLink() {
    if (!driveTitle.trim()) {
      setToast({ type: "error", msg: "أدخل اسم الملف" });
      return;
    }
    if (!driveUrl.trim()) {
      setToast({ type: "error", msg: "أدخل رابط Google Drive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: driveTitle.trim(),
          description: driveDescription.trim() || null,
          subject: driveSubject.trim() || null,
          file_type: "google_drive",
          source_type: "external_link",
          file_url: driveUrl.trim(),
          tags: driveTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error("فشل حفظ الرابط");

      setToast({ type: "success", msg: "تم إضافة الرابط بنجاح" });
      setDriveTitle("");
      setDriveDescription("");
      setDriveSubject("");
      setDriveUrl("");
      setDriveTags("");
      fetchMaterials();
    } catch (e) {
      setToast({
        type: "error",
        msg: e instanceof Error ? e.message : "فشل الإضافة",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد؟")) return;

    try {
      const res = await fetch("/api/admin/materials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("فشل الحذف");
      setToast({ type: "success", msg: "تم حذف الملف بنجاح" });
      fetchMaterials();
    } catch (e) {
      setToast({
        type: "error",
        msg: e instanceof Error ? e.message : "فشل الحذف",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 text-text-primary">إدارة الملفات والمصادر</h1>
        <p className="text-body text-text-secondary">
          رفع وإدارة ملفات الأسئلة والمحتوى (PDF, Word, Excel, Markdown, Google Drive)
        </p>
      </header>

      {toast && (
        <div
          className={`flex items-center gap-2 rounded-card border p-3 text-body ${
            toast.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-5 shrink-0" />
          ) : (
            <AlertCircle className="size-5 shrink-0" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-subtle">
        <button
          onClick={() => setActiveTab("upload")}
          className={`px-4 py-2 text-body transition-colors ${
            activeTab === "upload"
              ? "border-b-2 border-brand-400 text-brand-400"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <Upload className="inline size-4 me-2" />
          رفع ملف
        </button>
        <button
          onClick={() => setActiveTab("drive")}
          className={`px-4 py-2 text-body transition-colors ${
            activeTab === "drive"
              ? "border-b-2 border-brand-400 text-brand-400"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <LinkIcon className="inline size-4 me-2" />
          رابط Google Drive
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <Card className="flex flex-col gap-5 p-5">
          <h2 className="text-h2 text-text-primary">رفع ملف</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>اسم الملف *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: كتاب الفيزياء"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>المادة</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="مثال: فيزياء"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>نوع الملف *</Label>
              <div className="relative">
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="flex h-11 w-full appearance-none rounded-input border border-strong bg-bg-surface pe-10 ps-4 text-body text-text-primary"
                >
                  {FILE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>وسوم (فاصلة عشرية)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="أسئلة, 2024, مهم"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>الوصف</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="وصف مختصر للملف..."
              className="w-full rounded-input border border-strong bg-bg-surface p-4 text-body text-text-primary"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>اختر الملف *</Label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.docx,.md,.xlsx"
              className="block w-full text-sm text-text-muted file:me-3 file:py-2 file:px-4 file:rounded-input file:border-0 file:text-sm file:font-semibold file:bg-brand-400/20 file:text-brand-400 hover:file:bg-brand-400/30"
            />
            {file && <p className="text-secondary text-text-muted">{file.name}</p>}
          </div>

          <Button
            onClick={handleUploadFile}
            disabled={saving}
            size="lg"
          >
            {saving ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Upload className="size-5" />
            )}
            رفع الملف
          </Button>
        </Card>
      )}

      {/* Google Drive Tab */}
      {activeTab === "drive" && (
        <Card className="flex flex-col gap-5 p-5">
          <h2 className="text-h2 text-text-primary">إضافة رابط Google Drive</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>اسم الملف *</Label>
              <Input
                value={driveTitle}
                onChange={(e) => setDriveTitle(e.target.value)}
                placeholder="مثال: بنك أسئلة الأحياء"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>المادة</Label>
              <Input
                value={driveSubject}
                onChange={(e) => setDriveSubject(e.target.value)}
                placeholder="مثال: أحياء"
              />
            </div>
            <div className="col-span-full flex flex-col gap-2">
              <Label>رابط Google Drive *</Label>
              <Input
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/... أو https://docs.google.com/..."
              />
            </div>
            <div className="col-span-full flex flex-col gap-2">
              <Label>وسوم (فاصلة عشرية)</Label>
              <Input
                value={driveTags}
                onChange={(e) => setDriveTags(e.target.value)}
                placeholder="أسئلة, 2024, مهم"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>الوصف</Label>
            <textarea
              value={driveDescription}
              onChange={(e) => setDriveDescription(e.target.value)}
              rows={2}
              placeholder="وصف مختصر للملف..."
              className="w-full rounded-input border border-strong bg-bg-surface p-4 text-body text-text-primary"
            />
          </div>

          <Button
            onClick={handleAddDriveLink}
            disabled={saving}
            size="lg"
          >
            {saving ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <LinkIcon className="size-5" />
            )}
            إضافة الرابط
          </Button>
        </Card>
      )}

      {/* Materials List */}
      <Card className="flex flex-col gap-5 p-5">
        <h2 className="text-h2 text-text-primary">
          الملفات المحفوظة ({materials.length})
        </h2>

        {materials.length === 0 ? (
          <p className="text-body text-text-muted">لا توجد ملفات محفوظة بعد</p>
        ) : (
          <div className="flex flex-col gap-3">
            {materials.map((material) => {
              const Icon = getFileIcon(material.file_type);
              return (
                <div
                  key={material.id}
                  className="flex items-start justify-between gap-3 rounded-card border border-subtle bg-bg-raised p-4"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="size-5 shrink-0 text-brand-400 mt-1" />
                    <div className="flex flex-col gap-1">
                      <p className="text-body font-semibold text-text-primary">
                        {material.title}
                      </p>
                      {material.description && (
                        <p className="text-secondary text-text-muted">
                          {material.description}
                        </p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {material.subject && (
                          <span className="text-secondary bg-brand-400/10 text-brand-400 rounded px-2 py-1">
                            {material.subject}
                          </span>
                        )}
                        {material.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-secondary bg-bg-surface text-text-muted rounded px-2 py-1"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={material.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-pill hover:bg-brand-400/10"
                      title="فتح الملف"
                    >
                      <ExternalLink className="size-5 text-brand-400" />
                    </a>
                    <button
                      onClick={() => handleDelete(material.id)}
                      className="p-2 rounded-pill hover:bg-red-500/10"
                      title="حذف"
                    >
                      <Trash2 className="size-5 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
