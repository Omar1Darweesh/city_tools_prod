import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsEnum,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentTerm } from '@prisma/client';

export class GRNLineDto {
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @IsInt()
  @Min(1)
  qty: number;

  @IsNumber()
  @Min(0)
  cost: number;
}

export class CreateGRNDto {
  @IsInt()
  @IsNotEmpty()
  supplierId: number;

  @IsInt()
  @IsNotEmpty()
  branchId: number;

  @IsInt()
  @IsOptional()
  relatedPoId?: number;

  @IsInt()
  @IsOptional()
  stockLocationId?: number;

  @IsEnum(PaymentTerm)
  @IsOptional()
  paymentTerm?: PaymentTerm;

  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GRNLineDto)
  lines: GRNLineDto[];

  @IsOptional()
  notes?: string;
}

export class CreateSupplierDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  contact?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  address?: string;

  @IsOptional()
  paymentTerms?: string;
}

export class CreateSupplierPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsInt()
  @IsOptional()
  grnId?: number;

  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod;

  @IsOptional()
  notes?: string;

  @IsOptional()
  paymentDate?: string;
}
