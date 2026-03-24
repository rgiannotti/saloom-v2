import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpsertClientProfessionalServiceDto {
  @ApiProperty() @IsMongoId() serviceId!: string;
  @ApiProperty({ minimum: 0 }) @IsNumber() @Min(0) price!: number;
  @ApiProperty({ minimum: 1 }) @IsNumber() @Min(1) slot!: number;
}

export class UpsertClientProfessionalScheduleDto {
  @ApiProperty({ example: "monday" }) @IsString() @IsNotEmpty() day!: string;
  @ApiProperty({ example: "09:00" }) @IsString() @IsNotEmpty() start!: string;
  @ApiProperty({ example: "18:00" }) @IsString() @IsNotEmpty() end!: string;
}

export class UpsertClientProfessionalDto {
  @ApiPropertyOptional() @IsMongoId() @IsOptional() professionalId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() name?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() email?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() phone?: string;

  @ApiPropertyOptional({ type: [UpsertClientProfessionalServiceDto] })
  @IsArray() @IsOptional() services?: UpsertClientProfessionalServiceDto[];

  @ApiPropertyOptional({ type: [UpsertClientProfessionalScheduleDto] })
  @IsArray() @IsOptional() schedule?: UpsertClientProfessionalScheduleDto[];
}
