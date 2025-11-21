import { IsBoolean, IsNumber, IsOptional, IsString, MinLength } from "class-validator";
import { Type } from "class-transformer";

export class CreateServiceCategoryDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
