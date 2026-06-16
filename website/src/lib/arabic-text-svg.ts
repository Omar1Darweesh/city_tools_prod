type ArabicTextSvgOptions = {
  text: string;
  fontBase64: string;
  fontSize: number;
  fontWeight?: number;
  color?: string;
  opacity?: number;
  width: number;
  height: number;
};

/** Render Arabic via SVG so ligatures and RTL shape correctly inside Satori. */
export function arabicTextSvg({
  text,
  fontBase64,
  fontSize,
  fontWeight = 700,
  color = "#ffffff",
  opacity = 1,
  width,
  height,
}: ArabicTextSvgOptions): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      @font-face {
        font-family: 'NotoArabic';
        src: url('data:font/ttf;base64,${fontBase64}') format('truetype');
        font-weight: ${fontWeight};
        font-style: normal;
      }
      .ar {
        font-family: 'NotoArabic', sans-serif;
        font-size: ${fontSize}px;
        font-weight: ${fontWeight};
        fill: ${color};
        fill-opacity: ${opacity};
        direction: rtl;
        unicode-bidi: bidi-override;
      }
    </style>
  </defs>
  <text x="${width / 2}" y="${height / 2 + fontSize * 0.35}" class="ar" text-anchor="middle">${escaped}</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf-8").toString("base64")}`;
}

export type ArabicOgText = {
  title: string;
  tagline1: string;
  tagline2: string;
};

export function buildArabicOgText(fontBoldB64: string, fontRegularB64: string, compact: boolean): ArabicOgText {
  const titleSize = compact ? 44 : 52;
  const tagSize = compact ? 17 : 20;

  return {
    title: arabicTextSvg({
      text: "سيتي تولز",
      fontBase64: fontBoldB64,
      fontSize: titleSize,
      fontWeight: 700,
      color: "#ffffff",
      width: 320,
      height: titleSize + 24,
    }),
    tagline1: arabicTextSvg({
      text: "مصدرك الموثوق للأدوات والمعدات",
      fontBase64: fontRegularB64,
      fontSize: tagSize,
      fontWeight: 400,
      color: "#ffffff",
      opacity: 0.45,
      width: 900,
      height: tagSize + 20,
    }),
    tagline2: arabicTextSvg({
      text: "الاحترافية في مصر",
      fontBase64: fontRegularB64,
      fontSize: tagSize,
      fontWeight: 400,
      color: "#ffffff",
      opacity: 0.45,
      width: 500,
      height: tagSize + 20,
    }),
  };
}
