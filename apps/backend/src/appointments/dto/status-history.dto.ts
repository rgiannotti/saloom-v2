import { Type } from "class-transformer";
import { IsDate, IsOptional, IsString } from "class-validator";

export class AppointmentStatusHistoryDto {
  @IsString()
  status!: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @IsOptional()
  @IsString()
  comment?: string;
}
