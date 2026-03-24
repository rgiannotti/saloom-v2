import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, IsString, MinLength } from "class-validator";
import { Type } from "class-transformer";

export class CreateServiceCategoryDto {
  @ApiProperty({ example: "Cabello", minLength: 2 })
  @IsString() @MinLength(2) name!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() order?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
}
