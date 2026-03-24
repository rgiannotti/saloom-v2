import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested
} from "class-validator";

class AppointmentPlaceAddressDto {
  @ApiPropertyOptional() @IsOptional() @IsString() full?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() placeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() street?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() number?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() province?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() comunity?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postal?: string;
}

class AppointmentPlaceLocationDto {
  @ApiProperty({ enum: ["Point"], default: "Point" })
  @IsEnum(["Point"])
  type: "Point" = "Point";

  @ApiProperty({ type: [Number], example: [-66.9036, 10.4806] })
  @IsArray() @ArrayMinSize(2) @ArrayMaxSize(2) @Type(() => Number) @IsNumber({}, { each: true })
  coordinates!: number[];
}

export class AppointmentPlaceDto {
  @ApiPropertyOptional({ type: AppointmentPlaceAddressDto })
  @IsOptional() @ValidateNested() @Type(() => AppointmentPlaceAddressDto)
  address?: AppointmentPlaceAddressDto;

  @ApiProperty({ type: AppointmentPlaceLocationDto })
  @ValidateNested() @Type(() => AppointmentPlaceLocationDto)
  location!: AppointmentPlaceLocationDto;
}
