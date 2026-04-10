import {
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsString,
  IsEnum,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReturnReason } from '@layerframe/shared-types';

export class CreateReturnItemDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsString()
  productName!: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  @Min(1)
  returnQty!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsEnum(ReturnReason)
  reason!: ReturnReason;

  @IsOptional()
  @IsArray()
  photos?: string[];

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateReturnDto {
  @IsUUID()
  purchaseOrderId!: string;

  @IsUUID()
  goodsReceiptId!: string;

  @IsUUID()
  supplierId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateReturnItemDto)
  items!: CreateReturnItemDto[];

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateClaimDto {
  @IsUUID()
  supplierId!: string;

  @IsOptional()
  @IsUUID()
  purchaseReturnId?: string;

  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @IsString()
  claimType!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  amountCalculation?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
