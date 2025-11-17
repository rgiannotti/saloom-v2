import { Type } from "class-transformer";
import { IsMongoId, IsNumber, IsOptional } from "class-validator";

export class AppointmentServiceItemDto {
  @IsMongoId()
  service!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;
}
