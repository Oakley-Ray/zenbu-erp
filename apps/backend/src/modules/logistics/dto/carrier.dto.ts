import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  IsInt,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { CarrierZone, PricingModel } from '../carrier.entity';

export class CreateCarrierDto {
  @IsString()
  @MaxLength(50)
  code!: string;

  @IsString()
  @MaxLength(100)
  name!: string;

  @IsArray()
  @IsEnum(CarrierZone, { each: true })
  zones!: CarrierZone[];

  @IsEnum(PricingModel)
  pricingModel!: PricingModel;

  rates!: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(1)
  volumetricDivisor?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minimumCharge?: number;

  @IsOptional()
  estimatedDays?: Record<string, { min: number; max: number }>;
}

export class UpdateCarrierDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(CarrierZone, { each: true })
  zones?: CarrierZone[];

  @IsOptional()
  @IsEnum(PricingModel)
  pricingModel?: PricingModel;

  @IsOptional()
  rates?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(1)
  volumetricDivisor?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minimumCharge?: number;

  @IsOptional()
  estimatedDays?: Record<string, { min: number; max: number }>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
