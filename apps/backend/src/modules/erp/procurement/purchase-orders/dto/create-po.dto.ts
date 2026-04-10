import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsDateString,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePoItemDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsString()
  productName!: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsNumber()
  @Min(1)
  orderedQty!: number;

  @IsOptional()
  @IsString()
  unit?: string;
}

export class CreatePoDto {
  @IsUUID()
  supplierId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePoItemDto)
  items!: CreatePoItemDto[];

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryAlertDays?: number;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
