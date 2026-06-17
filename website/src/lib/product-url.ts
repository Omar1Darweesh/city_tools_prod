/** URL slug for a product detail page — trims accidental spaces in product codes. */
export function productDetailPath(product: { code?: string | null; id: number }): string {
  const code = product.code?.trim();
  return `/products/${code || product.id}`;
}
