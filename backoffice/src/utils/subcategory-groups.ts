export interface SubcategoryGroup {
    key: string;
    name: string;
    nameAr: string;
    ids: number[];
}

interface SubcategoryLike {
    id: number;
    name: string;
    nameAr: string;
}

/** Merge subcategories that share the same display name (e.g. اكسسوارات under multiple brands). */
export function groupSubcategoriesByName(subcats: SubcategoryLike[]): SubcategoryGroup[] {
    const map = new Map<string, SubcategoryGroup>();

    for (const sub of subcats) {
        const nameAr = (sub.nameAr || sub.name || '').trim();
        const name = (sub.name || sub.nameAr || '').trim();
        const key = nameAr.toLowerCase() || name.toLowerCase();
        if (!key) continue;

        const existing = map.get(key);
        if (existing) {
            existing.ids.push(sub.id);
        } else {
            map.set(key, { key, name, nameAr, ids: [sub.id] });
        }
    }

    return Array.from(map.values()).sort((a, b) =>
        (a.nameAr || a.name).localeCompare(b.nameAr || b.name, 'ar'),
    );
}
