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
  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @Type(() => Date)
  @IsDate()
  endDate!: Date;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AppointmentServiceItemDto)
  services!: AppointmentServiceItemDto[];

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  slots!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  slotStart!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  slotEnd!: number;

  @IsString()
  status!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsMongoId()
  client!: string;

  @IsOptional()
  @IsMongoId()
  professional?: string;

  @IsOptional()
  @IsMongoId()
  user?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AppointmentStatusHistoryDto)
  statuses?: AppointmentStatusHistoryDto[];

  @ValidateNested()
  @Type(() => AppointmentPlaceDto)
  place!: AppointmentPlaceDto;

  @IsOptional()
  @IsString()
  type?: string;
}
