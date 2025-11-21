import { IsBoolean, IsMongoId, IsNumber, IsOptional, IsString, MinLength } from "class-validator";
import { Type } from "class-transformer";

export class CreateServiceDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  home?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsMongoId()
  categoryId?: string;
}
