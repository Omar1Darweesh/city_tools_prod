"use client";

import { useRef, useState } from "react";
import { ImageUp, Link, Loader2, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  locale: string;
}

export default function ProductImageUpload({ value, onChange, locale }: Props) {
  const isRtl = locale === "ar";
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const parseImages = (v: string): string[] => {
    if (!v) return [];
    if (v.includes("||")) {
      return v.split("||").map((s) => s.trim()).filter(Boolean);
    }
    return [v.trim()].filter(Boolean);
  };

  const images: string[] = parseImages(value);

  const addImage = (url: string) => {
    if (url.startsWith("data:")) {
      setError(isRtl ? "يرجى رفع الصورة مرة أخرى — لا يتم حفظ الصور المضمنة" : "Please upload again — embedded images cannot be saved");
      return;
    }
    const next = images.length > 0 ? [...images, url] : [url];
    onChange(next.join("||"));
    setError("");
  };

  const removeImage = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    onChange(next.join("||"));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      body.append("folder", "products");
      const res = await fetch("/upload", { method: "POST", body });
      const text = await res.text();
      let json: { url?: string; error?: string };
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(isRtl ? "فشل رفع الصورة — استجابة غير صالحة من الخادم" : "Upload failed — invalid server response");
      }
      if (!res.ok || !json.url) {
        throw new Error(json.error || (isRtl ? "فشل رفع الصورة" : "Upload failed"));
      }
      addImage(json.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (isRtl ? "فشل رفع الصورة" : "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const handleUrlAdd = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("data:")) {
      setError(isRtl ? "لا يمكن استخدام صورة مضمنة — استخدم رابطاً أو ارفع ملفاً" : "Embedded images are not supported — use a URL or upload a file");
      return;
    }
    addImage(trimmed);
    setUrlInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {images.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {images.map((url, i) => (
            <div
              key={`${url}-${i}`}
              style={{
                position: "relative",
                width: 80,
                height: 80,
                borderRadius: "0.625rem",
                overflow: "hidden",
                border: "1.5px solid var(--border)",
                flexShrink: 0,
              }}
            >
              <img
                src={url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                style={{
                  position: "absolute",
                  top: 2,
                  insetInlineEnd: 2,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.625rem",
            border: "1.5px dashed var(--border)",
            background: "var(--background)",
            color: "var(--muted-foreground)",
            cursor: uploading ? "wait" : "pointer",
            fontSize: "0.8rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            opacity: uploading ? 0.7 : 1,
          }}
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageUp size={14} />}
          {uploading ? (isRtl ? "جاري الرفع..." : "Uploading...") : (isRtl ? "رفع صورة" : "Upload Image")}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileUpload}
          style={{ display: "none" }}
          disabled={uploading}
        />
        <div style={{ display: "flex", flex: 1, gap: "0.375rem", minWidth: 200 }}>
          <input
            className="pf-input"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleUrlAdd())}
            placeholder={isRtl ? "أو أدخل رابط الصورة" : "Or paste image URL"}
            style={{ flex: 1, minWidth: 0 }}
            disabled={uploading}
          />
          <button
            type="button"
            onClick={handleUrlAdd}
            disabled={!urlInput.trim() || uploading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.375rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.625rem",
              border: "1.5px solid var(--border)",
              background: "var(--background)",
              color: urlInput.trim() ? "var(--foreground)" : "var(--muted-foreground)",
              cursor: urlInput.trim() && !uploading ? "pointer" : "default",
              fontSize: "0.8rem",
              fontWeight: 600,
              opacity: urlInput.trim() && !uploading ? 1 : 0.5,
            }}
          >
            <Link size={14} />
            {isRtl ? "إضافة" : "Add"}
          </button>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: "0.75rem", color: "#ef4444", margin: 0 }}>{error}</p>
      )}

      <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", margin: 0 }}>
        {isRtl
          ? "ارفع صورة (حتى 5 ميجابايت) أو أدخل رابطاً. يُحفظ رابط الصورة فقط — وليس الملف نفسه داخل النموذج."
          : "Upload an image (max 5 MB) or paste a URL. Only the image link is saved — not the file embedded in the form."}
      </p>
    </div>
  );
}
