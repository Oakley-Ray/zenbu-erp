import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  IsDateString,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ShipmentItemDto {
  @IsUUID()
  orderItemId!: string;

  @IsUUID()
  productId!: string;

  @IsString()
  productName!: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateShipmentDto {
  @IsUUID()
  orderId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ShipmentItemDto)
  items!: ShipmentItemDto[];

  @IsString()
  recipientName!: string;

  @IsString()
  recipientPhone!: string;

  @IsString()
  recipientAddress!: string;

  @IsOptional()
  @IsString()
  carrier?: string;

  @IsOptional()
  @IsString()
  shippingMethod?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @IsOptional()
  @IsDateString()
  estimatedShipDate?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
