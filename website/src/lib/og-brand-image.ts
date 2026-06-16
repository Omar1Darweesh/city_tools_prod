import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const BRAND = {
  red: "#C0161B",
  redLight: "#e83030",
  black: "#111111",
  blackSoft: "#1a1a1a",
} as const;

const FONT_DIR = path.join(process.cwd(), "src/assets/fonts");

async function readFontFile(name: string): Promise<ArrayBuffer> {
  const data = await readFile(path.join(FONT_DIR, name));
  return Uint8Array.from(data).buffer;
}

export async function loadLogoSrc(): Promise<string> {
  const candidates = [
    path.join(process.cwd(), "public/assets/CT Logo.jpg.jpeg"),
    path.join(process.cwd(), "public/assets/CT Logo.png"),
    path.join(process.cwd(), "src/assets/ct-logo.jpeg"),
    path.join(process.cwd(), "src/app/icon.png"),
  ];

  for (const filePath of candidates) {
    if (existsSync(filePath)) {
      const buf = await readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mime = ext === ".png" ? "image/png" : "image/jpeg";
      return `data:${mime};base64,${buf.toString("base64")}`;
    }
  }

  throw new Error("Brand logo not found");
}

/** Noto Arabic only — Satori crashes when mixing Inter + Arabic fonts. */
export async function getOgImageFonts() {
  const [arabicBold, arabicRegular] = await Promise.all([
    readFontFile("NotoSansArabic-Bold.ttf"),
    readFontFile("NotoSansArabic-Regular.ttf"),
  ]);

  return [
    { name: "NotoArabic", data: arabicBold, weight: 700 as const, style: "normal" as const },
    { name: "NotoArabic", data: arabicRegular, weight: 400 as const, style: "normal" as const },
  ];
}
