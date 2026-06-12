import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DeliveryZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(activeOnly = false) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, name_ar AS "nameAr", fee, active, sort_order AS "sortOrder"
       FROM delivery_zones
       ${activeOnly ? 'WHERE active = true' : ''}
       ORDER BY sort_order ASC, name ASC`,
    );
    return rows.map((r) => ({ ...r, fee: Number(r.fee) }));
  }

  async create(data: { name: string; nameAr: string; fee: number; sortOrder?: number }) {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO delivery_zones (name, name_ar, fee, sort_order)
       VALUES ($1, $2, $3, $4)`,
      data.name,
      data.nameAr,
      data.fee,
      data.sortOrder ?? 99,
    );
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, name_ar AS "nameAr", fee, active, sort_order AS "sortOrder"
       FROM delivery_zones ORDER BY id DESC LIMIT 1`,
    );
    return { ...rows[0], fee: Number(rows[0].fee) };
  }

  async update(id: number, data: { name?: string; nameAr?: string; fee?: number; active?: boolean; sortOrder?: number }) {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined)      { sets.push(`name = $${idx++}`);       values.push(data.name); }
    if (data.nameAr !== undefined)    { sets.push(`name_ar = $${idx++}`);    values.push(data.nameAr); }
    if (data.fee !== undefined)       { sets.push(`fee = $${idx++}`);        values.push(data.fee); }
    if (data.active !== undefined)    { sets.push(`active = $${idx++}`);     values.push(data.active); }
    if (data.sortOrder !== undefined) { sets.push(`sort_order = $${idx++}`); values.push(data.sortOrder); }

    if (sets.length === 0) return this.findOne(id);

    values.push(id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE delivery_zones SET ${sets.join(', ')} WHERE id = $${idx}`,
      ...values,
    );
    return this.findOne(id);
  }

  async findOne(id: number) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, name_ar AS "nameAr", fee, active, sort_order AS "sortOrder"
       FROM delivery_zones WHERE id = $1`,
      id,
    );
    if (!rows[0]) return null;
    return { ...rows[0], fee: Number(rows[0].fee) };
  }

  async remove(id: number) {
    await this.prisma.$executeRawUnsafe(`DELETE FROM delivery_zones WHERE id = $1`, id);
    return { success: true };
  }
}
