"use client";

import { useState } from "react";
import { Award, Loader2, Upload } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  locale: string;
}

export default function BrandLogoUpload({ value, onChange, locale }: Props) {
  const isRtl = locale === "ar";
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(isRtl ? "الملف يجب أن يكون صورة" : "File must be an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(isRtl ? "حجم الصورة يجب أن يكون 5 ميجابايت أو أقل" : "Image must be 5 MB or smaller");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", "brands");
      const res = await fetch("/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error || (isRtl ? "فشل رفع الصورة" : "Upload failed"));
      }
      onChange(json.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (isRtl ? "فشل رفع الصورة" : "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="blu-root">
      <label className="blu-label">{isRtl ? "شعار الماركة" : "Brand Logo"}</label>
      <div className="blu-upload">
        <div className="blu-preview">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="blu-thumb" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="blu-placeholder">
              <Award className="size-8 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div className="blu-inputs">
          <div className="blu-row">
            <input
              className="blu-input"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={isRtl ? "رابط الشعار أو ارفع صورة" : "Logo URL or upload an image"}
            />
            <label className={`blu-upload-btn ${uploading ? "loading" : ""}`}>
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              <input type="file" accept="image/*" onChange={handleUpload} hidden disabled={uploading} />
            </label>
          </div>
          <p className="blu-hint">
            {isRtl ? "أدخل رابطاً أو انقر على زر الرفع — يظهر الشعار في الصفحة الرئيسية" : "Enter a URL or click upload — logo appears on the homepage"}
          </p>
          {error && <p className="blu-error">{error}</p>}
        </div>
      </div>

      <style>{`
        .blu-root { display: flex; flex-direction: column; gap: 0.375rem; grid-column: 1 / -1; }
        .blu-label { font-size: 0.78rem; font-weight: 700; color: var(--foreground); }
        .blu-upload { display: flex; gap: 1rem; align-items: flex-start; }
        .blu-preview { width: 88px; height: 88px; border-radius: 999px; border: 1.5px solid var(--border); background: var(--background); overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .blu-thumb { width: 100%; height: 100%; object-fit: contain; padding: 0.5rem; }
        .blu-placeholder { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
        .blu-inputs { flex: 1; display: flex; flex-direction: column; gap: 0.375rem; min-width: 0; }
        .blu-row { display: flex; gap: 0.5rem; align-items: center; }
        .blu-input { flex: 1; background: var(--background); border: 1.5px solid var(--border); border-radius: 0.75rem; padding: 0.6rem 0.875rem; font-size: 0.875rem; color: var(--foreground); font-family: inherit; outline: none; transition: border-color 0.2s, box-shadow 0.2s; min-width: 0; }
        .blu-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(192,22,27,0.12); }
        .blu-upload-btn { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 0.75rem; border: 1.5px solid var(--border); background: var(--card); cursor: pointer; transition: all 0.2s; flex-shrink: 0; color: var(--muted-foreground); }
        .blu-upload-btn:hover { border-color: var(--primary); color: var(--primary); background: rgba(192,22,27,0.05); }
        .blu-upload-btn.loading { pointer-events: none; opacity: 0.6; }
        .blu-hint { font-size: 0.7rem; color: var(--muted-foreground); margin: 0; }
        .blu-error { font-size: 0.75rem; color: #b91c1c; margin: 0; }
      `}</style>
    </div>
  );
}
