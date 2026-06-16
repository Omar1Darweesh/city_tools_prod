/** Satori renders Arabic word order backwards — reverse words before rendering. */
export function satoriArabic(text: string): string {
  return text.split(/\s+/).reverse().join(" ");
}
