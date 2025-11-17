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
  @IsOptional()
  @IsString()
  full?: string;

  @IsOptional()
  @IsString()
  placeId?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  comunity?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postal?: string;
}

class AppointmentPlaceLocationDto {
  @IsEnum(["Point"])
  type: "Point" = "Point";

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @Type(() => Number)
  @IsNumber({}, { each: true })
  coordinates!: number[];
}

export class AppointmentPlaceDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => AppointmentPlaceAddressDto)
  address?: AppointmentPlaceAddressDto;

  @ValidateNested()
  @Type(() => AppointmentPlaceLocationDto)
  location!: AppointmentPlaceLocationDto;
}
