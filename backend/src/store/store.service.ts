import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MovementType, OrderStatus, Prisma } from '@prisma/client';
import { SalesService } from '../sales/sales.service';
import { PlatformSettingsService } from '../settings/platform-settings.service';
import { CreateStoreOrderDto } from './dto/create-order.dto';

const productInclude = {
  category: true,
};

function mapProduct(p: any, showRatings = true) {
  const availableStock = Math.max(0, (p as any).currentStock ?? 0);
  const reservedStock = (p as any).reservedStock ?? 0;
  return {
    id: p.id,
    code: String(p.code || '').trim(),
    nameEn: p.nameEn,
    nameAr: p.nameAr,
    priceRetail: Number(p.priceRetail),
    priceWholesale: Number(p.priceWholesale),
    discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
    categoryId: p.categoryId,
    brand: p.brand || '',
    description: p.description || '',
    images: Array.isArray(p.images) ? p.images : [],
    rating: showRatings ? (p.rating || 0) : 0,
    inStock: availableStock > 0,
    stock: availableStock,
    reservedStock,
    availableStock,
    badge: p.badge || null,
    isPopular: p.isPopular,
    isBestSale: p.isBestSale,
    createdAt: p.createdAt?.toISOString?.() || p.createdAt,
    unit: p.unit || 'PCS',
    minQty: p.minQty || 1,
    itemTypeId: p.itemTypeId ?? undefined,
    itemType: p.itemType ? {
      id: p.itemType.id,
      name: p.itemType.name,
      nameAr: p.itemType.nameAr || p.itemType.name,
    } : undefined,
    subcategory: p.itemType?.subcategory ? {
      id: p.itemType.subcategory.id,
      name: p.itemType.subcategory.name,
      nameAr: p.itemType.subcategory.nameAr || p.itemType.subcategory.name,
    } : undefined,
    category: p.category ? {
      id: p.category.id,
      name: p.category.name,
      nameAr: p.category.nameAr || p.category.name,
    } : undefined,
  };
}


function extractHex(color: any): string {
  if (typeof color !== 'string') return '#C0161B';
  const parts = color.split(',');
  for (const p of parts) {
    const t = p.trim();
    if (t.startsWith('#')) {
      const m = t.match(/^#[0-9a-fA-F]+/);
      if (m) return m[0];
    }
  }
  return '#C0161B';
}

function mapCategory(c: any) {
  return {
    id: c.id,
    name: c.name,
    nameAr: c.nameAr || c.name,
    slug: c.slug || c.name?.toLowerCase().replace(/\s+/g, '-') || String(c.id),
    color: c.color || '#2563eb',
    icon: c.icon || 'Wrench',
    productCount: (c as any)._count?.products ?? 0,
  };
}

@Injectable()
export class StoreService {
  private readonly PLATFORM = 'ONLINE_STORE';

  constructor(
    private readonly prisma: PrismaService,
    private readonly salesService: SalesService,
    private readonly platformSettings: PlatformSettingsService,
  ) {}

  private async getAvailableStockInTx(
    tx: Prisma.TransactionClient,
    productId: number,
  ): Promise<number> {
    const total = await tx.stockMovement.aggregate({
      where: { productId },
      _sum: { qtyChange: true },
    });
    return Math.max(0, total._sum.qtyChange ?? 0);
  }

  private async assertSufficientStock(
    items: Array<{ productId: number; qty: number }>,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    for (const item of items) {
      await tx.$executeRawUnsafe(
        'SELECT pg_advisory_xact_lock($1::bigint)',
        item.productId,
      );
    }

    for (const item of items) {
      const available = await this.getAvailableStockInTx(tx, item.productId);
      if (available < item.qty) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { nameEn: true, nameAr: true, code: true },
        });
        const label = product?.nameEn || product?.code || `Product #${item.productId}`;
        throw new BadRequestException(
          `Insufficient stock for ${label}. Available: ${available}, requested: ${item.qty}`,
        );
      }
    }
  }

  private async getAvailableStock(productId: number): Promise<number> {
    const total = await this.prisma.stockMovement.aggregate({
      where: { productId },
      _sum: { qtyChange: true },
    });
    return Math.max(0, total._sum.qtyChange ?? 0);
  }

  private async getReservedStock(productId: number): Promise<number> {
    const result = await this.prisma.stockMovement.aggregate({
      where: { productId, movementType: MovementType.RESERVED },
      _sum: { qtyChange: true },
    });
    const total = result._sum.qtyChange ?? 0;
    return total < 0 ? -total : 0;
  }

  private async attachStock(products: any[]): Promise<any[]> {
    return Promise.all(
      products.map(async (p) => {
        const [available, reserved] = await Promise.all([
          this.getAvailableStock(p.id),
          this.getReservedStock(p.id),
        ]);
        return { ...p, currentStock: available, reservedStock: reserved };
      }),
    );
  }

  private async shouldShowRatings(): Promise<boolean> {
    try {
      const settings = await this.platformSettings.getPlatform('ONLINE_STORE');
      return settings?.showRatings ?? true;
    } catch {
      return true;
    }
  }

  private async getDefectiveCategoryVisibility() {
    const [settings, defectiveCategory] = await Promise.all([
      this.platformSettings.getPlatform('ONLINE_STORE'),
      this.prisma.category.findFirst({
        where: {
          OR: [
            { name: { equals: 'Defective', mode: 'insensitive' } },
            { nameAr: 'تلافيات' },
          ],
        },
        select: { id: true },
      }),
    ]);

    return {
      show: settings?.showDefectiveCategory ?? false,
      categoryId: defectiveCategory?.id ?? null,
    };
  }

  private isDefectiveCategory(category: { id?: number; name?: string; nameAr?: string | null }) {
    if (!category) return false;
    const name = category.name?.toLowerCase() ?? '';
    return name === 'defective' || category.nameAr === 'تلافيات';
  }

  private applyDefectiveProductFilter(
    where: Prisma.ProductWhereInput,
    visibility: { show: boolean; categoryId: number | null },
  ): Prisma.ProductWhereInput {
    if (visibility.show || !visibility.categoryId) return where;

    if (where.categoryId === visibility.categoryId) {
      return { ...where, id: { in: [] } };
    }

    if (where.categoryId !== undefined) {
      return where;
    }

    return {
      ...where,
      categoryId: { not: visibility.categoryId },
    };
  }

  async getFeatured() {
    const [showR, visibility] = await Promise.all([
      this.shouldShowRatings(),
      this.getDefectiveCategoryVisibility(),
    ]);
    const products = await this.prisma.product.findMany({
      where: this.applyDefectiveProductFilter({ active: true, isPopular: true }, visibility),
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { category: true },
    });
    const withStock = await this.attachStock(products);
    return { data: withStock.map((p) => mapProduct(p, showR)), success: true, total: withStock.length, page: 1, limit: 50, totalPages: 1 };
  }

  async getBestSelling() {
    const [showR, visibility] = await Promise.all([
      this.shouldShowRatings(),
      this.getDefectiveCategoryVisibility(),
    ]);
    const products = await this.prisma.product.findMany({
      where: this.applyDefectiveProductFilter({ active: true, isBestSale: true }, visibility),
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { category: true },
    });
    const withStock = await this.attachStock(products);
    return { data: withStock.map((p) => mapProduct(p, showR)), success: true, total: withStock.length, page: 1, limit: 50, totalPages: 1 };
  }

  async getPopular() {
    return this.getFeatured();
  }

  async getProducts(params: { page?: number; limit?: number; categoryId?: number; subcategoryId?: number; itemTypeId?: number; search?: string; sort?: string; isPopular?: boolean; isBestSale?: boolean; discounted?: boolean; badge?: string; brand?: string }) {
    const { page = 1, limit = 50, categoryId, subcategoryId, itemTypeId, search, sort, isPopular, isBestSale, discounted, badge, brand } = params;
    const visibility = await this.getDefectiveCategoryVisibility();

    if (!visibility.show && visibility.categoryId && categoryId === visibility.categoryId) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const where: Prisma.ProductWhereInput = { active: true };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (subcategoryId) {
      where.itemType = { subcategoryId };
    }

    if (itemTypeId) {
      where.itemTypeId = itemTypeId;
    }

    if (isPopular) {
      where.isPopular = true;
    }

    if (isBestSale) {
      where.isBestSale = true;
    }

    if (discounted) {
      where.discountPrice = { not: null };
    }

    if (badge) {
      where.badge = badge;
    }

    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { priceRetail: 'asc' };
    else if (sort === 'price_desc') orderBy = { priceRetail: 'desc' };
    else if (sort === 'name_asc') orderBy = { nameEn: 'asc' };
    else if (sort === 'name_desc') orderBy = { nameEn: 'desc' };

    const filteredWhere = this.applyDefectiveProductFilter(where, visibility);

    const [data, total, showR] = await Promise.all([
      this.prisma.product.findMany({
        where: filteredWhere,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true },
      }),
      this.prisma.product.count({ where: filteredWhere }),
      this.shouldShowRatings(),
    ]);

    const withStock = await this.attachStock(data);
    return {
      data: withStock.map((p) => mapProduct(p, showR)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProduct(code: string) {
    const normalized = code.trim();
    const include = {
      category: true,
      itemType: {
        include: { subcategory: true },
      },
    };
    let product = await this.prisma.product.findFirst({
      where: {
        active: true,
        OR: [
          { code: normalized },
          { barcode: normalized },
          { code: { equals: normalized, mode: 'insensitive' } },
          { barcode: { equals: normalized, mode: 'insensitive' } },
        ],
      },
      include,
    });

    if (!product) {
      const trimmed = await this.prisma.$queryRawUnsafe<{ id: number }[]>(
        `SELECT id FROM products WHERE active = true AND (
          LOWER(TRIM(code)) = LOWER($1) OR LOWER(TRIM(barcode)) = LOWER($1)
        ) LIMIT 1`,
        normalized,
      );
      if (trimmed.length > 0) {
        product = await this.prisma.product.findFirst({
          where: { id: trimmed[0].id, active: true },
          include,
        });
      }
    }

    if (!product) {
      const id = parseInt(normalized, 10);
      if (!isNaN(id) && String(id) === normalized) {
        product = await this.prisma.product.findFirst({
          where: { id, active: true },
          include,
        });
      }
    }

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const visibility = await this.getDefectiveCategoryVisibility();
    if (
      !visibility.show &&
      visibility.categoryId &&
      product.categoryId === visibility.categoryId
    ) {
      throw new NotFoundException('Product not found');
    }

    const [withStock, showR] = await Promise.all([
      this.attachStock([product]),
      this.shouldShowRatings(),
    ]);
    return { data: mapProduct(withStock[0], showR), success: true };
  }

  async getCategories() {
    const visibility = await this.getDefectiveCategoryVisibility();
    const cats = await this.prisma.category.findMany({
      where: { active: true },
    });
    const visibleCats = !visibility.show && visibility.categoryId
      ? cats.filter((c) => c.id !== visibility.categoryId)
      : cats;
    const activeCounts = await this.prisma.product.groupBy({
      by: ['categoryId'],
      where: {
        active: true,
        ...(!visibility.show && visibility.categoryId
          ? { categoryId: { not: visibility.categoryId } }
          : {}),
      },
      _count: { id: true },
    });
    const countMap = new Map(activeCounts.map(c => [c.categoryId, c._count.id]));
    return {
      data: visibleCats.map(c => mapCategory({ ...c, _count: { products: countMap.get(c.id) ?? 0 } })),
      success: true,
    };
  }

  async getCategory(slug: string) {
    const visibility = await this.getDefectiveCategoryVisibility();
    const id = parseInt(slug, 10);
    let cat;

    if (!isNaN(id) && String(id) === slug) {
      cat = await this.prisma.category.findFirst({
        where: { id, active: true },
      });
    } else {
      cat = await this.prisma.category.findFirst({
        where: {
          OR: [
            { name: { equals: slug, mode: 'insensitive' } },
            { name: { equals: slug.replace(/-/g, ' '), mode: 'insensitive' } },
          ],
          active: true,
        },
      });
    }

    if (!cat) return { data: null, success: false };

    if (
      !visibility.show &&
      (cat.id === visibility.categoryId || this.isDefectiveCategory(cat))
    ) {
      return { data: null, success: false };
    }

    const activeCount = await this.prisma.product.count({
      where: { categoryId: cat.id, active: true },
    });
    return { data: mapCategory({ ...cat, _count: { products: activeCount } }), success: true };
  }

  async getSubcategories(categoryId?: number) {
    const where = categoryId ? `WHERE sc.active = true AND sc.category_id = $1` : `WHERE sc.active = true`;
    const rows = await this.prisma.$queryRawUnsafe<{ id: number; name: string; name_ar: string; category_id: number; product_count: bigint }[]>(
      `SELECT sc.id, sc.name, sc.name_ar, sc.category_id, COUNT(p.id) AS product_count
       FROM subcategories sc
       LEFT JOIN item_types it ON it.subcategory_id = sc.id
       LEFT JOIN products p ON p.item_type_id = it.id AND p.active = true
       ${where}
       GROUP BY sc.id, sc.name, sc.name_ar, sc.category_id
       ORDER BY sc.name ASC`,
      ...(categoryId ? [categoryId] : []),
    );
    return {
      data: rows.map(r => ({
        id: r.id,
        name: r.name,
        nameAr: r.name_ar || r.name,
        categoryId: r.category_id,
        productCount: Number(r.product_count),
      })),
    };
  }

  async getItemTypes(subcategoryId?: number) {
    const where = subcategoryId ? `WHERE it.active = true AND it.subcategory_id = $1` : `WHERE it.active = true`;
    const rows = await this.prisma.$queryRawUnsafe<{ id: number; name: string; name_ar: string; subcategory_id: number; product_count: bigint }[]>(
      `SELECT it.id, it.name, it.name_ar, it.subcategory_id, COUNT(p.id) AS product_count
       FROM item_types it
       LEFT JOIN products p ON p.item_type_id = it.id AND p.active = true
       ${where}
       GROUP BY it.id, it.name, it.name_ar, it.subcategory_id
       ORDER BY it.name ASC`,
      ...(subcategoryId ? [subcategoryId] : []),
    );
    return {
      data: rows.map(r => ({
        id: r.id,
        name: r.name,
        nameAr: r.name_ar || r.name,
        subcategoryId: r.subcategory_id,
        productCount: Number(r.product_count),
      })),
    };
  }

  async getBrands(categoryId?: number) {
    const sql = categoryId
      ? `SELECT TRIM(brand) AS brand, COUNT(*) AS count FROM products WHERE active = true AND category_id = $1 AND brand IS NOT NULL AND brand != '' GROUP BY TRIM(brand) ORDER BY brand ASC`
      : `SELECT TRIM(brand) AS brand, COUNT(*) AS count FROM products WHERE active = true AND brand IS NOT NULL AND brand != '' GROUP BY TRIM(brand) ORDER BY brand ASC`;
    const rows = await this.prisma.$queryRawUnsafe<{ brand: string; count: bigint }[]>(
      sql, ...(categoryId ? [categoryId] : []),
    );
    return {
      data: rows.map(r => ({
        name: r.brand,
        productCount: Number(r.count),
      })),
    };
  }

  async getTrustedBrands() {
    await this.ensureBrandsTable();
    const products = await this.prisma.product.findMany({
      where: { active: true },
      select: { brand: true },
    });
    const brandMap = new Map<string, { original: string; count: number }>();
    for (const p of products) {
      if (p.brand && p.brand.trim() !== '') {
        const key = p.brand.toLowerCase().trim();
        if (brandMap.has(key)) {
          brandMap.get(key)!.count++;
        } else {
          brandMap.set(key, { original: p.brand, count: 1 });
        }
      }
    }
    // Merge with saved brands from the store_brands table
    const savedBrands = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, name_ar, logo, is_trusted, sort_order, product_count FROM store_brands ORDER BY sort_order ASC, name ASC`,
    );
    const savedMap = new Map<string, any>();
    for (const sb of savedBrands) {
      savedMap.set(sb.id.toLowerCase(), sb);
    }
    return {
      data: Array.from(brandMap.entries()).map(([key, { original, count }]) => {
        const saved = savedMap.get(key);
        return {
          id: key.replace(/\s+/g, '-'),
          name: saved?.name || original,
          nameAr: saved?.name_ar || original,
          logo: saved?.logo || null,
          isTrusted: saved ? saved.is_trusted : true,
          sortOrder: saved?.sort_order || 0,
          productCount: count,
        };
      }),
    };
  }

  async getBrand(id: string) {
    const normalized = id.replace(/-/g, ' ').toLowerCase();
    // Try the saved brands table first
    const saved = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, name_ar, logo, is_trusted, sort_order, product_count FROM store_brands WHERE LOWER(id) = $1`,
      normalized,
    );
    if (saved.length > 0) {
      const sb = saved[0];
      return {
        data: {
          id: sb.id,
          name: sb.name,
          nameAr: sb.name_ar || sb.name,
          logo: sb.logo || null,
          isTrusted: sb.is_trusted,
          sortOrder: sb.sort_order,
          productCount: sb.product_count,
        },
      };
    }
    // Fallback to computing from products
    const products = await this.prisma.product.findMany({
      where: { active: true, brand: { equals: normalized, mode: 'insensitive' } },
      select: { brand: true },
    });
    if (products.length === 0) {
      throw new NotFoundException('Brand not found');
    }
    return {
      data: {
        id: id,
        name: products[0].brand,
        nameAr: products[0].brand,
        logo: null,
        isTrusted: true,
        sortOrder: 0,
        productCount: products.length,
      },
    };
  }

  async createBrand(body: any) {
    const id = (body.name || '').toLowerCase().replace(/\s+/g, '-');
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO store_brands (id, name, name_ar, logo, is_trusted, sort_order, product_count) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      id,
      body.name || '',
      body.nameAr || body.name || '',
      body.logo || null,
      body.isTrusted ?? true,
      body.sortOrder ?? 0,
      body.productCount ?? 0,
    );
    return { data: { id, ...body }, success: true };
  }

  async updateBrand(id: string, body: any) {
    const normalized = id.replace(/-/g, ' ').toLowerCase();
    // Ensure the table exists
    await this.ensureBrandsTable();
    // Upsert: update if exists, insert if not
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO store_brands (id, name, name_ar, logo, is_trusted, sort_order, product_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         name_ar = EXCLUDED.name_ar,
         logo = EXCLUDED.logo,
         is_trusted = EXCLUDED.is_trusted,
         sort_order = EXCLUDED.sort_order,
         product_count = EXCLUDED.product_count`,
      normalized,
      body.name || '',
      body.nameAr || body.name || '',
      body.logo || null,
      body.isTrusted ?? true,
      body.sortOrder ?? 0,
      body.productCount ?? 0,
    );
    return { data: { id: normalized, ...body }, success: true };
  }

  async deleteBrand(id: string) {
    const normalized = id.replace(/-/g, ' ').toLowerCase();
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM store_brands WHERE LOWER(id) = $1`,
      normalized,
    );
    return { success: true };
  }

  private async ensureBrandsTable() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS store_brands (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        name_ar VARCHAR(255),
        logo TEXT,
        is_trusted BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        product_count INTEGER DEFAULT 0
      )
    `);
  }

  // ── Statistics CRUD ──────────────────────────────────────────

  async getAllStatistics() {
    const stats = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, value, label_en, label_ar, sort_order, active FROM store_statistics ORDER BY sort_order ASC`,
    );
    const mapped = (stats || []).map((s: any) => ({
      id: s.id,
      value: s.value,
      labelEn: s.label_en,
      labelAr: s.label_ar || s.label_en,
      sortOrder: s.sort_order,
      isActive: s.active,
    }));
    return { data: mapped };
  }

  async getActiveStatistics() {
    const stats = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, value, label_en, label_ar, sort_order FROM store_statistics WHERE active = true ORDER BY sort_order ASC`,
    );
    const mapped = (stats || []).map((s: any) => ({
      id: s.id,
      value: s.value,
      labelEn: s.label_en,
      labelAr: s.label_ar || s.label_en,
    }));
    return { data: mapped };
  }

  async createStatistic(body: any) {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO store_statistics (value, label_en, label_ar, sort_order, active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      body.value, body.labelEn, body.labelAr || body.labelEn, body.sortOrder ?? 0, body.isActive ?? true,
    );
    return { data: body, success: true };
  }

  async updateStatistic(id: number, body: any) {
    await this.prisma.$executeRawUnsafe(
      `UPDATE store_statistics SET value = $1, label_en = $2, label_ar = $3, sort_order = $4, active = $5, updated_at = NOW() WHERE id = $6`,
      body.value, body.labelEn, body.labelAr || body.labelEn, body.sortOrder ?? 0, body.isActive ?? true, id,
    );
    return { data: { id, ...body }, success: true };
  }

  async deleteStatistic(id: number) {
    await this.prisma.$executeRawUnsafe(`DELETE FROM store_statistics WHERE id = $1`, id);
    return { success: true };
  }

  // ── Discount Cards CRUD ─────────────────────────────────────

  async getAllDiscountCards() {
    try { await this.prisma.$executeRawUnsafe(`ALTER TABLE store_discount_cards ADD COLUMN IF NOT EXISTS bg_image VARCHAR(300) DEFAULT '/assets/discountCards/11.jpg'`); } catch {}
    const cards = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, badge_en, badge_ar, title_en, title_ar, desc_en, desc_ar, link_url, link_label_en, link_label_ar, bg_color, COALESCE(bg_image, '/assets/discountCards/11.jpg') AS bg_image, active, sort_order, created_at, updated_at FROM store_discount_cards ORDER BY sort_order ASC`,
    );
    const mapped = (cards || []).map((c: any) => ({
      id: c.id,
      badgeEn: c.badge_en || '',
      badgeAr: c.badge_ar || c.badge_en || '',
      titleEn: c.title_en,
      titleAr: c.title_ar || c.title_en,
      descEn: c.desc_en || '',
      descAr: c.desc_ar || c.desc_en || '',
      linkUrl: c.link_url || '/products',
      linkLabelEn: c.link_label_en || 'Shop Now',
      linkLabelAr: c.link_label_ar || 'تسوق الآن',
      bgColor: c.bg_color || '#C0161B',
      bgImage: c.bg_image || '/assets/discountCards/11.jpg',
      sortOrder: c.sort_order,
      isActive: c.active,
    }));
    return { data: mapped };
  }

  async getActiveDiscountCards() {
    try { await this.prisma.$executeRawUnsafe(`ALTER TABLE store_discount_cards ADD COLUMN IF NOT EXISTS bg_image VARCHAR(300) DEFAULT '/assets/discountCards/11.jpg'`); } catch {}
    const cards = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, badge_en, badge_ar, title_en, title_ar, desc_en, desc_ar, link_url, link_label_en, link_label_ar, bg_color, COALESCE(bg_image, '/assets/discountCards/11.jpg') AS bg_image, active, sort_order, created_at, updated_at FROM store_discount_cards WHERE active = true ORDER BY sort_order ASC`,
    );
    const mapped = (cards || []).map((c: any) => ({
      id: c.id,
      badgeEn: c.badge_en || '',
      badgeAr: c.badge_ar || c.badge_en || '',
      titleEn: c.title_en,
      titleAr: c.title_ar || c.title_en,
      descEn: c.desc_en || '',
      descAr: c.desc_ar || c.desc_en || '',
      linkUrl: c.link_url || '/products',
      linkLabelEn: c.link_label_en || 'Shop Now',
      linkLabelAr: c.link_label_ar || 'تسوق الآن',
      bgColor: c.bg_color || '#C0161B',
      bgImage: c.bg_image || '/assets/discountCards/11.jpg',
    }));
    return { data: mapped };
  }

  async createDiscountCard(body: any) {
    try { await this.prisma.$executeRawUnsafe(`ALTER TABLE store_discount_cards ADD COLUMN IF NOT EXISTS bg_image VARCHAR(300) DEFAULT '/assets/discountCards/11.jpg'`); } catch {}
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO store_discount_cards (badge_en, badge_ar, title_en, title_ar, desc_en, desc_ar, link_url, link_label_en, link_label_ar, bg_color, bg_image, active, sort_order, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
      body.badgeEn || '', body.badgeAr || body.badgeEn || '',
      body.titleEn, body.titleAr || body.titleEn,
      body.descEn || '', body.descAr || body.descEn || '',
      body.linkUrl || '/products', body.linkLabelEn || 'Shop Now', body.linkLabelAr || 'تسوق الآن',
      extractHex(body.bgColor),
      body.bgImage || '/assets/discountCards/11.jpg',
      body.isActive ?? true, body.sortOrder ?? 0,
    );
    return { data: body, success: true };
  }

  async updateDiscountCard(id: number, body: any) {
    try { await this.prisma.$executeRawUnsafe(`ALTER TABLE store_discount_cards ADD COLUMN IF NOT EXISTS bg_image VARCHAR(300) DEFAULT '/assets/discountCards/11.jpg'`); } catch {}
    await this.prisma.$executeRawUnsafe(
      `UPDATE store_discount_cards SET badge_en = $1, badge_ar = $2, title_en = $3, title_ar = $4, desc_en = $5, desc_ar = $6, link_url = $7, link_label_en = $8, link_label_ar = $9, bg_color = $10, bg_image = $11, active = $12, sort_order = $13, updated_at = NOW() WHERE id = $14`,
      body.badgeEn || '', body.badgeAr || body.badgeEn || '',
      body.titleEn, body.titleAr || body.titleEn,
      body.descEn || '', body.descAr || body.descEn || '',
      body.linkUrl || '/products', body.linkLabelEn || 'Shop Now', body.linkLabelAr || 'تسوق الآن',
      extractHex(body.bgColor),
      body.bgImage || '/assets/discountCards/11.jpg',
      body.isActive ?? true, body.sortOrder ?? 0, id,
    );
    return { data: { id, ...body }, success: true };
  }

  async deleteDiscountCard(id: number) {
    await this.prisma.$executeRawUnsafe(`DELETE FROM store_discount_cards WHERE id = $1`, id);
    return { success: true };
  }

  // ── Trust Features CRUD ─────────────────────────────────────

  async getAllTrustFeatures() {
    const items = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM store_trust_features ORDER BY sort_order ASC`,
    );
    const mapped = (items || []).map((t: any) => ({
      id: t.id,
      icon: t.icon || 'Shield',
      titleEn: t.title_en,
      titleAr: t.title_ar || t.title_en,
      subtitleEn: t.subtitle_en || '',
      subtitleAr: t.subtitle_ar || t.subtitle_en || '',
      sortOrder: t.sort_order,
      isActive: t.active,
    }));
    return { data: mapped };
  }

  async getActiveTrustFeatures() {
    const items = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM store_trust_features WHERE active = true ORDER BY sort_order ASC`,
    );
    const mapped = (items || []).map((t: any) => ({
      id: t.id,
      icon: t.icon || 'Shield',
      titleEn: t.title_en,
      titleAr: t.title_ar || t.title_en,
      subtitleEn: t.subtitle_en || '',
      subtitleAr: t.subtitle_ar || t.subtitle_en || '',
    }));
    return { data: mapped };
  }

  async createTrustFeature(body: any) {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO store_trust_features (icon, title_en, title_ar, subtitle_en, subtitle_ar, sort_order, active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      body.icon || 'Shield', body.titleEn, body.titleAr || body.titleEn,
      body.subtitleEn || '', body.subtitleAr || body.subtitleEn || '',
      body.sortOrder ?? 0, body.isActive ?? true,
    );
    return { data: body, success: true };
  }

  async updateTrustFeature(id: number, body: any) {
    await this.prisma.$executeRawUnsafe(
      `UPDATE store_trust_features SET icon = $1, title_en = $2, title_ar = $3, subtitle_en = $4, subtitle_ar = $5, sort_order = $6, active = $7, updated_at = NOW() WHERE id = $8`,
      body.icon || 'Shield', body.titleEn, body.titleAr || body.titleEn,
      body.subtitleEn || '', body.subtitleAr || body.subtitleEn || '',
      body.sortOrder ?? 0, body.isActive ?? true, id,
    );
    return { data: { id, ...body }, success: true };
  }

  async deleteTrustFeature(id: number) {
    await this.prisma.$executeRawUnsafe(`DELETE FROM store_trust_features WHERE id = $1`, id);
    return { success: true };
  }

  // ── Hero Slides CRUD ────────────────────────────────────────

  async getAllHeroSlides() {
    await this.ensureHeroSlidesTable();
    const slides = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM store_hero_slides ORDER BY sort_order ASC`,
    );
    const mapped = (slides || []).map((s: any) => ({
      id: s.id,
      bgImg: s.bg_img || '/assets/1.jpg',
      tagEn: s.tag_en || '',
      tagAr: s.tag_ar || s.tag_en || '',
      titleEn: s.title_en || '',
      titleAr: s.title_ar || s.title_en || '',
      subEn: s.sub_en || '',
      subAr: s.sub_ar || s.sub_en || '',
      accent: s.accent || '#C0161B',
      bgGradient: s.bg_gradient || 'from-[#0f1923] via-[#1a2535] to-[#0f1923]',
      sortOrder: s.sort_order,
      isActive: s.active,
    }));
    return { data: mapped };
  }

  async getActiveHeroSlides() {
    await this.ensureHeroSlidesTable();
    const slides = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM store_hero_slides WHERE active = true ORDER BY sort_order ASC`,
    );
    const mapped = (slides || []).map((s: any) => ({
      id: s.id,
      bgImg: s.bg_img || '/assets/1.jpg',
      tagEn: s.tag_en || '',
      tagAr: s.tag_ar || s.tag_en || '',
      titleEn: s.title_en || '',
      titleAr: s.title_ar || s.title_en || '',
      subEn: s.sub_en || '',
      subAr: s.sub_ar || s.sub_en || '',
      accent: s.accent || '#C0161B',
      bgGradient: s.bg_gradient || 'from-[#0f1923] via-[#1a2535] to-[#0f1923]',
    }));
    return { data: mapped };
  }

  async createHeroSlide(body: any) {
    await this.ensureHeroSlidesTable();
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO store_hero_slides (bg_img, tag_en, tag_ar, title_en, title_ar, sub_en, sub_ar, accent, bg_gradient, sort_order, active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
      body.bgImg || '/assets/1.jpg',
      body.tagEn || '', body.tagAr || body.tagEn || '',
      body.titleEn || '', body.titleAr || body.titleEn || '',
      body.subEn || '', body.subAr || body.subEn || '',
      body.accent || '#C0161B', body.bgGradient || 'from-[#0f1923] via-[#1a2535] to-[#0f1923]',
      body.sortOrder ?? 0, body.isActive ?? true,
    );
    return { data: body, success: true };
  }

  async updateHeroSlide(id: number, body: any) {
    await this.prisma.$executeRawUnsafe(
      `UPDATE store_hero_slides SET bg_img = $1, tag_en = $2, tag_ar = $3, title_en = $4, title_ar = $5, sub_en = $6, sub_ar = $7, accent = $8, bg_gradient = $9, sort_order = $10, active = $11, updated_at = NOW() WHERE id = $12`,
      body.bgImg || '/assets/1.jpg',
      body.tagEn || '', body.tagAr || body.tagEn || '',
      body.titleEn || '', body.titleAr || body.titleEn || '',
      body.subEn || '', body.subAr || body.subEn || '',
      body.accent || '#C0161B', body.bgGradient || 'from-[#0f1923] via-[#1a2535] to-[#0f1923]',
      body.sortOrder ?? 0, body.isActive ?? true, id,
    );
    return { data: { id, ...body }, success: true };
  }

  async deleteHeroSlide(id: number) {
    await this.prisma.$executeRawUnsafe(`DELETE FROM store_hero_slides WHERE id = $1`, id);
    return { success: true };
  }

  private async ensureHeroSlidesTable() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS store_hero_slides (
        id SERIAL PRIMARY KEY,
        bg_img VARCHAR(500) NOT NULL DEFAULT '/assets/1.jpg',
        tag_en VARCHAR(100) DEFAULT '',
        tag_ar VARCHAR(100) DEFAULT '',
        title_en VARCHAR(255) DEFAULT '',
        title_ar VARCHAR(255) DEFAULT '',
        sub_en VARCHAR(500) DEFAULT '',
        sub_ar VARCHAR(500) DEFAULT '',
        accent VARCHAR(50) DEFAULT '#C0161B',
        bg_gradient VARCHAR(200) DEFAULT 'from-[#0f1923] via-[#1a2535] to-[#0f1923]',
        sort_order INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  // ── Footer Settings ──────────────────────────────────────────
  private async ensureFooterSettingsTable() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS store_footer_settings (
        id SERIAL PRIMARY KEY,
        settings JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  async getFooterSettings() {
    await this.ensureFooterSettingsTable();
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`SELECT settings FROM store_footer_settings LIMIT 1`);
    const defaults = {
      email: "info@citytools.sa",
      phone: "+966 50 000 0000",
      addressEn: "Cairo, Egypt",
      addressAr: "القاهرة، مصر",
      socialLinks: [
        { label: "Facebook", url: "#", icon: "facebook" },
        { label: "Instagram", url: "#", icon: "instagram" },
        { label: "YouTube", url: "#", icon: "youtube" },
        { label: "X (Twitter)", url: "#", icon: "x" },
      ],
      workingHours: [
        { dayEn: "Sat–Thu", dayAr: "السبت – الخميس", hoursEn: "9:00 AM – 9:00 PM", hoursAr: "9:00 ص – 9:00 م" },
        { dayEn: "Friday", dayAr: "الجمعة", hoursEn: "2:00 PM – 9:00 PM", hoursAr: "2:00 م – 9:00 م" },
      ],
    };
    if (!rows || rows.length === 0) {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO store_footer_settings (settings) VALUES ($1::jsonb)`,
        JSON.stringify(defaults),
      );
      return defaults;
    }
    return { ...defaults, ...rows[0].settings };
  }

  async updateFooterSettings(body: any) {
    await this.ensureFooterSettingsTable();
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`SELECT id FROM store_footer_settings LIMIT 1`);
    const settings = {
      email: body.email || '',
      phone: body.phone || '',
      addressEn: body.addressEn || '',
      addressAr: body.addressAr || '',
      socialLinks: body.socialLinks || [],
      workingHours: body.workingHours || [],
    };
    if (rows && rows.length > 0) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE store_footer_settings SET settings = $1::jsonb, updated_at = NOW() WHERE id = $2`,
        JSON.stringify(settings),
        rows[0].id,
      );
    } else {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO store_footer_settings (settings) VALUES ($1::jsonb)`,
        JSON.stringify(settings),
      );
    }
    return settings;
  }

  // ── Support Pages ──────────────────────────────────────────
  private stripHtml(text: string): string {
    return text
      .replace(/<\/?p[^>]*>/g, '\n')
      .replace(/<\/?h4[^>]*>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+/, '')
      .replace(/\n+$/, '')
      .trim();
  }

  private async ensureSupportPagesTable() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS store_support_pages (
        id SERIAL PRIMARY KEY,
        content JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  async getSupportPages() {
    await this.ensureSupportPagesTable();
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`SELECT content FROM store_support_pages LIMIT 1`);
    const defaults = {
      terms: {
        en: "Welcome to City Tools. By accessing or using our website, you agree to be bound by these Terms & Conditions.\n\n1. General\nAll products and services provided by City Tools are subject to these terms. We reserve the right to update them at any time.\n\n2. Use of Website\nYou agree to use our website only for lawful purposes and in a manner that does not infringe the rights of others.\n\n3. Intellectual Property\nAll content, logos, and materials on this site are owned by City Tools and may not be reproduced without permission.\n\n4. Limitation of Liability\nCity Tools shall not be liable for any indirect or consequential losses arising from the use of our products or services.\n\n5. Governing Law\nThese terms are governed by the laws of the Kingdom of Saudi Arabia.",
        ar: "مرحباً بكم في مدينة العدد. باستخدامكم لهذا الموقع، فإنكم توافقون على الالتزام بهذه الشروط والأحكام.\n\n1. أحكام عامة\nجميع المنتجات والخدمات المقدمة من مدينة العدد تخضع لهذه الشروط. نحتفظ بالحق في تحديثها في أي وقت.\n\n2. استخدام الموقع\nتتعهد باستخدام موقعنا للأغراض المشروعة فقط وبطريقة لا تنتهك حقوق الآخرين.\n\n3. الملكية الفكرية\nجميع المحتويات والشعارات والمواد الموجودة على هذا الموقع مملوكة لمدينة العدد ولا يجوز إعادة إنتاجها دون إذن.\n\n4. حدود المسؤولية\nلا تتحمل مدينة العدد أي مسؤولية عن أي خسائر غير مباشرة أو تبعية ناشئة عن استخدام منتجاتنا أو خدماتنا.\n\n5. القانون الواجب التطبيق\nتخضع هذه الشروط لقوانين المملكة العربية السعودية.",
      },
      privacy: {
        en: "Your privacy is important to us. This policy explains how we collect, use, and protect your personal data.\n\n1. Information We Collect\nWe collect name, email, phone number, shipping address, and payment details when you place an order.\n\n2. How We Use Your Data\nWe use your data to process orders, provide customer support, and send relevant updates if you opt in.\n\n3. Data Protection\nWe implement appropriate security measures to protect your data from unauthorized access.\n\n4. Third Parties\nWe do not sell your data. We may share it with trusted partners solely for order fulfillment.\n\n5. Contact\nFor privacy inquiries, email us at privacy@citytools.sa.",
        ar: "خصوصيتكم مهمة بالنسبة لنا. توضح هذه السياسة كيفية جمع واستخدام وحماية بياناتكم الشخصية.\n\n1. المعلومات التي نجمعها\nنجمع الاسم والبريد الإلكتروني ورقم الهاتف وعنوان الشحن وتفاصيل الدفع عند تقديم طلب.\n\n2. كيفية استخدام بياناتكم\nنستخدم بياناتكم لمعالجة الطلبات وتقديم الدعم الفني وإرسال التحديثات إذا اشتركتم في ذلك.\n\n3. حماية البيانات\nنطبق إجراءات أمنية مناسبة لحماية بياناتكم من الوصول غير المصرح به.\n\n4. الأطراف الثالثة\nلا نبيع بياناتكم. قد نشاركها مع شركاء موثوقين فقط لتنفيذ الطلبات.\n\n5. الاتصال بنا\nلاستفسارات الخصوصية، راسلنا على privacy@citytools.sa.",
      },
      returns: {
        en: "We want you to be satisfied with your purchase. If something isn't right, here's our return policy.\n\n1. Return Window\nYou may return most products within 14 days of delivery for a full refund or exchange.\n\n2. Condition\nItems must be unused, in original packaging, with all accessories and documentation.\n\n3. Non-Returnable Items\nCustom orders, clearance items, and certain hygiene-related products are final sale.\n\n4. Refund Process\nRefunds are processed within 5–7 business days after we receive the returned item.\n\n5. Shipping Costs\nReturn shipping is free for defective items; otherwise the customer covers the cost.",
        ar: "نريدك أن تكون راضياً عن مشترياتك. إذا كان هناك خطأ ما، إليك سياسة الاسترداد الخاصة بنا.\n\n1. فترة الإرجاع\nيمكنك إرجاع معظم المنتجات خلال 14 يوماً من تاريخ الاستلام لاسترداد كامل المبلغ أو الاستبدال.\n\n2. حالة المنتج\nيجب أن تكون المنتجات غير مستخدمة وفي عبوتها الأصلية مع جميع الملحقات والمستندات.\n\n3. المنتجات غير القابلة للإرجاع\nالطلبات المخصصة ومواد التصفية وبعض منتجات النظافة الشخصية تعتبر بيعاً نهائياً.\n\n4. عملية الاسترداد\nتتم معالجة المبالغ المستردة في غضون 5–7 أيام عمل بعد استلامنا للمنتج المرتجع.\n\n5. تكاليف الشحن\nشحن الإرجاع مجاني للمنتجات المعيبة، وفي الحالات الأخرى يتحمل العميل التكلفة.",
      },
      shipping: {
        en: "We offer reliable shipping options across Saudi Arabia. Below are the details.\n\n1. Delivery Areas\nWe deliver to all cities and regions within the Kingdom of Saudi Arabia.\n\n2. Shipping Fees\nFees are calculated based on your delivery zone at checkout. Free shipping on orders over 500 SAR.\n\n3. Processing Time\nOrders are processed within 1–2 business days after payment confirmation.\n\n4. Delivery Time\nDelivery typically takes 2–5 business days depending on your location.\n\n5. Tracking\nYou will receive a tracking number via SMS and email once your order ships.",
        ar: "نقدم خيارات شحن موثوقة في جميع أنحاء المملكة العربية السعودية. فيما يلي التفاصيل.\n\n1. مناطق التوصيل\nنوصل إلى جميع المدن والمناطق داخل المملكة العربية السعودية.\n\n2. رسوم الشحن\nتُحتسب الرسوم بناءً على منطقتك عند الدفع. الشحن مجاني للطلبات فوق 500 ريال.\n\n3. وقت التجهيز\nتتم معالجة الطلبات في غضون 1–2 أيام عمل بعد تأكيد الدفع.\n\n4. وقت التوصيل\nيستغرق التوصيل من 2–5 أيام عمل حسب منطقتك.\n\n5. التتبع\nستتلقى رقم تتبع عبر الرسائل النصية والبريد الإلكتروني بمجرد شحن طلبك.",
      },
      heroImage: "/assets/supportPages/111.jpg",
      faq: [
        {
          questionEn: "How do I place an order?",
          questionAr: "كيف يمكنني تقديم طلب؟",
          answerEn: "Browse our catalog, add items to your cart, and proceed to checkout. You can pay online or on delivery.",
          answerAr: "تصفح كتالوجنا، أضف العناصر إلى سلة التسوق، ثم تابع إلى الدفع. يمكنك الدفع أونلاين أو عند الاستلام.",
        },
        {
          questionEn: "What payment methods do you accept?",
          questionAr: "ما هي طرق الدفع المقبولة؟",
          answerEn: "We accept Visa, Mastercard, Mada, and cash on delivery (COD).",
          answerAr: "نقبل فيزا، وماستركارد، ومدى، والدفع عند الاستلام.",
        },
        {
          questionEn: "Can I cancel my order?",
          questionAr: "هل يمكنني إلغاء طلبي؟",
          answerEn: "Yes, you can cancel within 1 hour of placing the order before it is processed.",
          answerAr: "نعم، يمكنك الإلغاء في غضون ساعة من تقديم الطلب قبل معالجته.",
        },
        {
          questionEn: "How do I contact customer support?",
          questionAr: "كيف يمكنني التواصل مع الدعم الفني؟",
          answerEn: "Call us at +966 50 000 0000 or email info@citytools.sa. We are available Sat–Thu 9 AM–9 PM.",
          answerAr: "اتصل بنا على +966 50 000 0000 أو راسلنا على info@citytools.sa. نحن متاحون السبت–الخميس 9 ص–9 م.",
        },
        {
          questionEn: "Do you offer warranties?",
          questionAr: "هل توفرون ضمانات؟",
          answerEn: "Yes, all products come with a manufacturer warranty. Contact us for warranty claims.",
          answerAr: "نعم، جميع المنتجات تأتي مع ضمان الشركة المصنعة. اتصل بنا للمطالبات.",
        },
      ],
    };
    if (!rows || rows.length === 0) {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO store_support_pages (content) VALUES ($1::jsonb)`,
        JSON.stringify(defaults),
      );
      return defaults;
    }
    const stored = rows[0].content || {};
    const merged: any = { ...defaults, ...stored };
    for (const key of ['terms', 'privacy', 'returns', 'shipping']) {
      if (merged[key]) {
        merged[key] = {
          en: this.stripHtml(merged[key].en || ''),
          ar: this.stripHtml(merged[key].ar || ''),
        };
      }
    }
    return merged;
  }

  async updateSupportPages(body: any) {
    await this.ensureSupportPagesTable();
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`SELECT id FROM store_support_pages LIMIT 1`);
    const content = {
      heroImage: body.heroImage || '/assets/supportPages/111.jpg',
      terms: body.terms || { en: '', ar: '' },
      privacy: body.privacy || { en: '', ar: '' },
      returns: body.returns || { en: '', ar: '' },
      shipping: body.shipping || { en: '', ar: '' },
      faq: body.faq || [],
    };
    if (rows && rows.length > 0) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE store_support_pages SET content = $1::jsonb, updated_at = NOW() WHERE id = $2`,
        JSON.stringify(content),
        rows[0].id,
      );
    } else {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO store_support_pages (content) VALUES ($1::jsonb)`,
        JSON.stringify(content),
      );
    }
    return content;
  }

  async createOrder(dto: CreateStoreOrderDto, userId: number = 2) {
    // Find or create customer by phone
    let customer = await this.prisma.customer.findUnique({
      where: { phone: dto.customerPhone },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          name: dto.customerName,
          phone: dto.customerPhone,
          address: `${dto.city}, ${dto.shippingAddress}`,
        },
      });
    }

    // Build lines for the sale with platform tax rate
    const taxRate = await this.platformSettings.getTaxRate(this.PLATFORM);
    let shippingFee = await this.platformSettings.getShippingFee(this.PLATFORM);

    // Override shipping fee with the selected delivery zone fee
    if (dto.deliveryZoneId) {
      const zoneRows = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT fee, name FROM delivery_zones WHERE id = $1 AND active = true`,
        dto.deliveryZoneId,
      );
      if (zoneRows.length > 0) {
        shippingFee = Number(zoneRows[0].fee);
      }
    }

    const lines = dto.items.map((item) => ({
      productId: item.productId,
      qty: item.qty,
      unitPrice: item.unitPrice,
      taxRate,
    }));

    for (const item of dto.items) {
      const available = await this.getAvailableStock(item.productId);
      if (available < item.qty) {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: { nameEn: true, nameAr: true, code: true },
        });
        const label = product?.nameEn || product?.code || `Product #${item.productId}`;
        throw new BadRequestException(
          `Insufficient stock for ${label}. Available: ${available}, requested: ${item.qty}`,
        );
      }
    }

    // Build notes with zone info
    const zoneNote = dto.deliveryZoneId
      ? ` | منطقة التوصيل: ${dto.deliveryZoneId}`
      : '';
    const notesStr = dto.notes
      ? `${dto.city} | ${dto.shippingAddress}${zoneNote} | ${dto.notes}`
      : `${dto.city} | ${dto.shippingAddress}${zoneNote}`;

    // Delegate to SalesService.createSale
    const sale = await this.salesService.createSale(
      {
        branchId: 1,
        customerId: customer.id,
        lines,
        paymentMethod: dto.paymentMethod,
        notes: notesStr,
        channel: this.PLATFORM,
        shippingFee,
        delivered: false,
      },
      userId,
    );

    const location = await this.prisma.stockLocation.findFirst({
      where: { branchId: 1, active: true },
    });

    if (!location) {
      throw new BadRequestException('No active stock location found');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.assertSufficientStock(dto.items, tx);

        await tx.salesInvoice.update({
          where: { id: sale.id },
          data: { status: OrderStatus.PENDING },
        });

        await tx.stockMovement.createMany({
          data: dto.items.map((item) => ({
            productId: item.productId,
            stockLocationId: location.id,
            qtyChange: -item.qty,
            movementType: MovementType.RESERVED,
            refTable: 'sales_invoices',
            refId: sale.id,
            createdBy: userId,
          })),
        });
      });
    } catch (error) {
      try {
        await this.salesService.cancelSale(sale.id, userId);
      } catch {
        // Best-effort cleanup if reservation fails after invoice creation
      }
      throw error;
    }

    return { data: { id: sale.id, invoiceNo: sale.invoiceNo }, success: true };
  }

  async getOrders(userId: number) {

    const invoices = await this.prisma.salesInvoice.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        lines: {
          include: { product: true },
        },
      },
    });

    return {
      data: invoices.map((inv) => ({
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        customerId: inv.customerId,
        customerName: inv.customer?.name || '',
        subtotal: Number(inv.subtotal),
        total: Number(inv.total),
        status: inv.paymentStatus,
        paymentMethod: inv.paymentMethod,
        notes: inv.notes || '',
        createdAt: inv.createdAt.toISOString(),
        items: inv.lines.map((l) => ({
          productId: l.productId,
          productName: l.product.nameEn,
          quantity: l.qty,
          unitPrice: Number(l.unitPrice),
          lineTotal: Number(l.lineTotal),
        })),
      })),
      success: true,
    };
  }
}
