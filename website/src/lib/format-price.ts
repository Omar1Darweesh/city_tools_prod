/** Normalize product rating to 0–5; bad DB values are hidden in the UI. */
export function normalizeRating(rating?: number | null): number {
  const value = Number(rating ?? 0);
  if (!Number.isFinite(value) || value <= 0 || value > 5) return 0;
  return value;
}

export function formatPrice(amount: number, locale: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return locale === "ar" ? "0 ج.م" : "0 EGP";

  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

  return locale === "ar" ? `${formatted} ج.م` : `${formatted} EGP`;
}

export function discountPercent(retail: number, sale: number): number {
  if (!retail || retail <= 0 || sale >= retail) return 0;
  return Math.round((1 - sale / retail) * 100);
}
