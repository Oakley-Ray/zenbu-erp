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

export class CreateRfqItemDto {
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
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  unit?: string;
}

export class CreateRfqDto {
  @IsString()
  title!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRfqItemDto)
  items!: CreateRfqItemDto[];

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  invitedSupplierIds?: string[];

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class SubmitQuotationDto {
  @IsUUID()
  supplierId!: string;

  @IsString()
  supplierName!: string;

  @IsArray()
  lineItems!: Array<{
    rfqItemId: string;
    unitPrice: number;
    leadTimeDays: number;
    note?: string;
  }>;

  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @IsOptional()
  @IsNumber()
  leadTimeDays?: number;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
