"use client";

import { useRef, useState } from "react";
import { ImageUp, Link, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  locale: string;
}

export default function ProductImageUpload({ value, onChange, locale }: Props) {
  const isRtl = locale === "ar";
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");

  const parseImages = (v: string): string[] => {
    if (!v) return [];
    if (v.includes("||")) {
      return v.split("||").map((s) => s.trim()).filter(Boolean);
    }
    return [v.trim()].filter(Boolean);
  };

  const images: string[] = parseImages(value);

  const addImage = (url: string) => {
    const next = images.length > 0 ? [...images, url] : [url];
    onChange(next.join("||"));
  };

  const removeImage = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    onChange(next.join("||"));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        addImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleUrlAdd = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    addImage(trimmed);
    setUrlInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Previews */}
      {images.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {images.map((url, i) => (
            <div
              key={i}
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

      {/* Upload & URL row */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.625rem",
            border: "1.5px dashed var(--border)",
            background: "var(--background)",
            color: "var(--muted-foreground)",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          <ImageUp size={14} />
          {isRtl ? "رفع صورة" : "Upload Image"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
        <div style={{ display: "flex", flex: 1, gap: "0.375rem", minWidth: 200 }}>
          <input
            className="pf-input"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleUrlAdd())}
            placeholder={isRtl ? "أو أدخل رابط الصورة" : "Or paste image URL"}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button
            type="button"
            onClick={handleUrlAdd}
            disabled={!urlInput.trim()}
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
              cursor: urlInput.trim() ? "pointer" : "default",
              fontSize: "0.8rem",
              fontWeight: 600,
              opacity: urlInput.trim() ? 1 : 0.5,
            }}
          >
            <Link size={14} />
            {isRtl ? "إضافة" : "Add"}
          </button>
        </div>
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", margin: 0 }}>
        {isRtl
          ? "يمكنك رفع صورة أو إدخال رابط. سيتم حفظ جميع الصور كروابط مفصولة بفواصل."
          : "You can upload an image or paste a URL. All images are stored as comma-separated links."}
      </p>
    </div>
  );
}
