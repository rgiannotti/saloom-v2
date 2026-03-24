import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsMongoId, IsNumber, IsOptional } from "class-validator";

export class AppointmentServiceItemDto {
  @ApiProperty({ description: "Service ObjectId" })
  @IsMongoId()
  service!: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;
}
