import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { SupplierStatus, InspectionType } from '@layerframe/shared-types';

export class CreateSupplierDto {
  @IsString()
  @MaxLength(50)
  supplierCode!: string;

  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsEnum(SupplierStatus)
  status?: SupplierStatus;

  @IsOptional()
  @IsEnum(InspectionType)
  defaultInspectionType?: InspectionType;

  @IsOptional()
  @IsString()
  note?: string;
}
