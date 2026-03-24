import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsMongoId, IsNumber, IsOptional, IsString, MinLength } from "class-validator";
import { Type } from "class-transformer";

export class CreateServiceDto {
  @ApiProperty({ example: "Corte de cabello", minLength: 2 })
  @IsString() @MinLength(2) name!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() order?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() home?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;

  @ApiPropertyOptional({ description: "ServiceCategory ObjectId" })
  @IsOptional() @IsMongoId() categoryId?: string;
}
