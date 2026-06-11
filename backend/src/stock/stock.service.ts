import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MovementType, OrderStatus } from '@prisma/client';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async getStockOnHand(params: {
    productId?: number;
    stockLocationId?: number;
    branchId?: number;
  }) {
    const { productId, stockLocationId, branchId } = params;

    const where: any = {};
    if (productId) where.productId = productId;
    if (stockLocationId) where.stockLocationId = stockLocationId;

    // If branchId is provided, filter by stock locations in that branch
    if (branchId) {
      where.stockLocation = { branchId };
    }

    const movements = await this.prisma.stockMovement.findMany({
      where,
      include: {
        product: true,
        stockLocation: {
          include: {
            branch: true,
          },
        },
      },
    });

    // Aggregate by product and location
    const stockMap: Record<string, any> = {};

    movements.forEach((movement) => {
      const key = `${movement.productId}-${movement.stockLocationId}`;
      if (!stockMap[key]) {
        stockMap[key] = {
          product: movement.product,
          stockLocation: movement.stockLocation,
          onHandQty: 0,
        };
      }
      stockMap[key].onHandQty += movement.qtyChange;
    });

    return Object.values(stockMap);
  }

  async createAdjustment(data: {
    productId: number;
    stockLocationId: number;
    qtyChange: number;
    notes?: string;
    userId: number;
  }) {
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const location = await this.prisma.stockLocation.findUnique({
      where: { id: data.stockLocationId },
    });

    if (!location) {
      throw new NotFoundException('Stock location not found');
    }

    return this.prisma.stockMovement.create({
      data: {
        productId: data.productId,
        stockLocationId: data.stockLocationId,
        qtyChange: data.qtyChange,
        movementType: MovementType.ADJUSTMENT,
        notes: data.notes,
        createdBy: data.userId,
      },
      include: {
        product: true,
        stockLocation: true,
      },
    });
  }

  async getLocations(branchId?: number) {
    return this.prisma.stockLocation.findMany({
      where: branchId ? { branchId, active: true } : { active: true },
      include: {
        branch: true,
      },
    });
  }

  async getMovementHistory(params: {
    productId?: number;
    stockLocationId?: number;
    movementType?: MovementType;
    skip?: number;
    take?: number;
  }) {
    const MAX_TAKE = 500;
    const MAX_SKIP = 100000;
    const {
      productId,
      stockLocationId,
      movementType,
      skip = 0,
      take = 50,
    } = params;

    // ✅ FIXED: Add max limits to prevent resource exhaustion
    const validatedTake = Math.min(Math.max(1, Number(take) || 50), MAX_TAKE);
    const validatedSkip = Math.min(Math.max(0, Number(skip) || 0), MAX_SKIP);

    const where: any = {};
    if (productId) where.productId = productId;
    if (stockLocationId) where.stockLocationId = stockLocationId;
    if (movementType) where.movementType = movementType;

    const [total, movements] = await Promise.all([
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.findMany({
        where,
        skip: validatedSkip,
        take: validatedTake,
        include: {
          product: true,
          stockLocation: true,
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: movements,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
    };
  }

  async getReservedStock() {
    const result = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        sm.product_id AS "productId",
        p.code AS "productCode",
        p.name_ar AS "productNameAr",
        p.name_en AS "productNameEn",
        p.barcode,
        p.images AS "productImages",
        p.unit AS "productUnit",
        p.brand AS "productBrand",
        p.price_retail AS "productPriceRetail",
        p.price_wholesale AS "productPriceWholesale",
        cat.name AS "categoryName",
        cat.name_ar AS "categoryNameAr",
        it.name AS "itemTypeName",
        it.name_ar AS "itemTypeNameAr",
        CAST(ABS(SUM(sm.qty_change)) AS INTEGER) AS "reservedQty",
        sm.ref_id AS "invoiceId",
        si.invoiceno AS "invoiceNo",
        si.createdat AS "reservedAt",
        si.status AS "orderStatus",
        si.channel AS "orderChannel",
        si.paymentmethod AS "paymentMethod",
        si.paymentstatus AS "paymentStatus",
        si.shippingfee AS "shippingFee",
        si.total AS "invoiceTotal",
        si.notes AS "invoiceNotes",
        si.deliverydate AS "deliveryDate",
        c.id AS "customerId",
        c.name AS "customerName",
        c.phone AS "customerPhone",
        c.address AS "customerAddress",
        c.type AS "customerType"
      FROM stock_movements sm
      JOIN products p ON p.id = sm.product_id
      LEFT JOIN salesinvoices si ON si.id = sm.ref_id AND sm.ref_table = 'sales_invoices'
      LEFT JOIN customers c ON c.id = si.customerid
      LEFT JOIN categories cat ON cat.id = p.category_id
      LEFT JOIN item_types it ON it.id = p.item_type_id
      WHERE sm.movement_type = 'RESERVED'
        AND si.status NOT IN ('DELIVERED', 'CANCELLED')
        AND si.status IS NOT NULL
      GROUP BY sm.product_id, sm.ref_id, p.code, p.name_ar, p.name_en, p.barcode, p.images, p.unit, p.brand, p.price_retail, p.price_wholesale, cat.name, cat.name_ar, it.name, it.name_ar, si.invoiceno, si.createdat, si.status, si.channel, si.paymentmethod, si.paymentstatus, si.shippingfee, si.total, si.notes, si.deliverydate, c.id, c.name, c.phone, c.address, c.type
      HAVING SUM(sm.qty_change) < 0
      ORDER BY si.createdat DESC
    `);

    // Also fetch sales lines for these invoices
    const invoiceIds = [...new Set(result.map((r: any) => r.invoiceId).filter(Boolean))];
    if (invoiceIds.length > 0) {
      const lines = await this.prisma.$queryRawUnsafe<any[]>(`
        SELECT
          sl.sales_invoice_id AS "invoiceId",
          sl.product_id AS "productId",
          p.code AS "productCode",
          p.name_ar AS "productNameAr",
          p.name_en AS "productNameEn",
          sl.qty,
          sl.unit_price AS "unitPrice",
          sl.line_total AS "lineTotal",
          sl.pricetype AS "priceType"
        FROM sales_lines sl
        JOIN products p ON p.id = sl.product_id
        WHERE sl.sales_invoice_id IN (${invoiceIds.join(',')})
        ORDER BY sl.id
      `);
      const linesByInvoice: Record<number, any[]> = {};
      for (const line of lines) {
        const invId = Number(line.invoiceId);
        if (!linesByInvoice[invId]) linesByInvoice[invId] = [];
        linesByInvoice[invId].push(line);
      }
      for (const item of result) {
        (item as any).lines = linesByInvoice[Number(item.invoiceId)] || [];
      }
    }

    return { data: result };
  }

  async createBatchAdjustment(data: {
    stockLocationId: number;
    adjustments: Array<{
      productId: number;
      qtyChange: number;
    }>;
    notes?: string;
    userId: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const movements = [];

      for (const adj of data.adjustments) {
        const movement = await tx.stockMovement.create({
          data: {
            productId: adj.productId,
            stockLocationId: data.stockLocationId,
            qtyChange: adj.qtyChange,
            movementType: MovementType.ADJUSTMENT,
            notes: data.notes,
            createdBy: data.userId,
          },
          include: {
            product: true,
            stockLocation: true,
          },
        });
        movements.push(movement);
      }

      return movements;
    });
  }

  async createTransfer(data: {
    fromStockLocationId: number;
    toStockLocationId: number;
    items: Array<{
      productId: number;
      qty: number;
    }>;
    notes?: string;
    userId: number;
  }) {
    // Validate locations exist
    const fromLocation = await this.prisma.stockLocation.findUnique({
      where: { id: data.fromStockLocationId },
    });
    const toLocation = await this.prisma.stockLocation.findUnique({
      where: { id: data.toStockLocationId },
    });

    if (!fromLocation || !toLocation) {
      throw new NotFoundException('Stock location not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const transferOut = [];
      const transferIn = [];

      for (const item of data.items) {
        // Create outbound movement
        const outMovement = await tx.stockMovement.create({
          data: {
            productId: item.productId,
            stockLocationId: data.fromStockLocationId,
            qtyChange: -item.qty, // negative for outbound
            movementType: MovementType.TRANSFER_OUT,
            notes: data.notes,
            createdBy: data.userId,
          },
        });
        transferOut.push(outMovement);

        // Create inbound movement
        const inMovement = await tx.stockMovement.create({
          data: {
            productId: item.productId,
            stockLocationId: data.toStockLocationId,
            qtyChange: item.qty, // positive for inbound
            movementType: MovementType.TRANSFER_IN,
            notes: data.notes,
            createdBy: data.userId,
            refTable: 'stock_movements',
            refId: outMovement.id, // Link to outbound
          },
        });
        transferIn.push(inMovement);
      }

      return {
        transferOut,
        transferIn,
        fromLocation,
        toLocation,
      };
    });
  }
}
