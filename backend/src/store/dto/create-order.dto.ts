import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, ValidateNested, IsInt, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class StoreOrderLineDto {
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @IsInt()
  @Min(1)
  qty: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateStoreOrderDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsInt()
  @IsOptional()
  deliveryZoneId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreOrderLineDto)
  items: StoreOrderLineDto[];
}
