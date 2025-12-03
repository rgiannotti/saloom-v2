import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsIn,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";

class AddressDto {
  @IsString()
  full!: string;

  @IsString()
  street!: string;

  @IsString()
  number!: string;

  @IsString()
  comunity!: string;

  @IsString()
  province!: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  postal?: string;

  @IsString()
  placeId!: string;
}

class LocationDto {
  @IsString()
  type!: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsNumber({}, { each: true })
  coordinates!: number[];
}

class ProfessionalServiceDto {
  @IsMongoId()
  service!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(1)
  slot!: number;
}

class ProfessionalWorkdayDto {
  @IsString()
  day!: string;

  @IsString()
  start!: string;

  @IsString()
  end!: string;
}

class ClientProfessionalDto {
  @IsMongoId()
  professional!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfessionalServiceDto)
  services!: ProfessionalServiceDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfessionalWorkdayDto)
  @IsOptional()
  schedule?: ProfessionalWorkdayDto[];
}

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  rif!: string;

  @IsString()
  @IsNotEmpty()
  denomination!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @IsNotEmpty()
  fiscalAddress!: string;

  @IsString()
  @IsNotEmpty()
  person!: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsBoolean()
  @IsOptional()
  useGoogleMap?: boolean;

  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;

  @IsOptional()
  @IsString()
  baddress?: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsBoolean()
  @IsOptional()
  home?: boolean;

  @IsBoolean()
  @IsOptional()
  online?: boolean;

  @IsBoolean()
  @IsOptional()
  onlineHome?: boolean;

  @IsBoolean()
  @IsOptional()
  blocked?: boolean;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  payments?: string[];

  @IsArray()
  @IsIn(["whatsapp", "sms", "email"], { each: true })
  @IsOptional()
  communicationChannels?: string[];

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  categories?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClientProfessionalDto)
  @IsOptional()
  professionals?: ClientProfessionalDto[];

  @IsOptional()
  @IsString()
  logo?: string;
}
