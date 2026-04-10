import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  ArrayMinSize,
  IsObject,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuoteItemDto {
  @IsString()
  description!: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  lengthCm!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  widthCm!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  heightCm!: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  actualWeightKg!: number;
}

export class CreateQuoteDto {
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsObject()
  origin!: {
    country: string;
    city?: string;
    postalCode?: string;
  };

  @IsObject()
  destination!: {
    country: string;
    city?: string;
    postalCode?: string;
    address?: string;
  };

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items!: QuoteItemDto[];

  @IsOptional()
  @IsString()
  note?: string;

  /** 報價有效天數（預設 7 天） */
  @IsOptional()
  @IsInt()
  @Min(1)
  validDays?: number;
}
