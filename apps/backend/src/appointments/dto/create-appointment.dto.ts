import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from "class-validator";

import { AppointmentPlaceDto } from "./place.dto";
import { AppointmentServiceItemDto } from "./service-item.dto";
import { AppointmentStatusHistoryDto } from "./status-history.dto";

export class CreateAppointmentDto {
  @ApiProperty() @Type(() => Date) @IsDate() startDate!: Date;
  @ApiProperty() @Type(() => Date) @IsDate() endDate!: Date;

  @ApiProperty({ type: [AppointmentServiceItemDto] })
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => AppointmentServiceItemDto)
  services!: AppointmentServiceItemDto[];

  @ApiProperty({ minimum: 1 }) @Type(() => Number) @IsNumber() @Min(1) slots!: number;
  @ApiProperty({ minimum: 0 }) @Type(() => Number) @IsNumber() @Min(0) slotStart!: number;
  @ApiProperty({ minimum: 0 }) @Type(() => Number) @IsNumber() @Min(0) slotEnd!: number;
  @ApiProperty({ example: "pending" }) @IsString() status!: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() amount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;

  @ApiProperty({ description: "Client ObjectId" }) @IsMongoId() client!: string;
  @ApiPropertyOptional({ description: "Professional ObjectId" }) @IsOptional() @IsMongoId() professional?: string;
  @ApiPropertyOptional({ description: "User ObjectId" }) @IsOptional() @IsMongoId() user?: string;

  @ApiPropertyOptional({ type: [AppointmentStatusHistoryDto] })
  @IsOptional() @ValidateNested({ each: true }) @Type(() => AppointmentStatusHistoryDto)
  statuses?: AppointmentStatusHistoryDto[];

  @ApiProperty({ type: AppointmentPlaceDto })
  @ValidateNested() @Type(() => AppointmentPlaceDto) place!: AppointmentPlaceDto;

  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
}
