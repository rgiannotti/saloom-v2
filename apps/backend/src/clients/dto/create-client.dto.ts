import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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
  @ApiProperty() @IsString() full!: string;
  @ApiProperty() @IsString() street!: string;
  @ApiProperty() @IsString() number!: string;
  @ApiProperty() @IsString() comunity!: string;
  @ApiProperty() @IsString() province!: string;
  @ApiProperty() @IsString() city!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postal?: string;
  @ApiProperty() @IsString() placeId!: string;
}

class LocationDto {
  @ApiProperty({ example: "Point" }) @IsString() type!: string;
  @ApiProperty({ type: [Number], example: [-66.9036, 10.4806] })
  @IsArray() @ArrayMinSize(2) @IsNumber({}, { each: true }) coordinates!: number[];
}

class ProfessionalServiceDto {
  @ApiProperty() @IsMongoId() service!: string;
  @ApiProperty({ minimum: 0 }) @IsNumber() @Min(0) price!: number;
  @ApiProperty({ minimum: 1 }) @IsNumber() @Min(1) slot!: number;
}

class ProfessionalWorkdayDto {
  @ApiProperty({ example: "monday" }) @IsString() day!: string;
  @ApiProperty({ example: "09:00" }) @IsString() start!: string;
  @ApiProperty({ example: "18:00" }) @IsString() end!: string;
}

class ClientProfessionalDto {
  @ApiProperty() @IsMongoId() professional!: string;

  @ApiProperty({ type: [ProfessionalServiceDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => ProfessionalServiceDto)
  services!: ProfessionalServiceDto[];

  @ApiPropertyOptional({ type: [ProfessionalWorkdayDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => ProfessionalWorkdayDto) @IsOptional()
  schedule?: ProfessionalWorkdayDto[];
}

export class CreateClientDto {
  @ApiProperty() @IsString() @IsNotEmpty() rif!: string;
  @ApiProperty() @IsString() @IsNotEmpty() denomination!: string;
  @ApiProperty() @IsString() @IsNotEmpty() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiProperty() @IsString() @IsNotEmpty() fiscalAddress!: string;
  @ApiProperty() @IsString() @IsNotEmpty() person!: string;
  @ApiPropertyOptional() @IsString() @IsOptional() website?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() useGoogleMap?: boolean;

  @ApiProperty({ type: AddressDto })
  @ValidateNested() @Type(() => AddressDto) address!: AddressDto;

  @ApiProperty({ type: LocationDto })
  @ValidateNested() @Type(() => LocationDto) location!: LocationDto;

  @ApiPropertyOptional() @IsOptional() @IsString() baddress?: string;
  @ApiProperty({ example: "contacto@empresa.com" }) @IsEmail() email!: string;
  @ApiProperty({ example: "+58212000000" }) @IsString() phone!: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() home?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() online?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() onlineHome?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() blocked?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() active?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsArray() @IsString({ each: true }) @IsOptional() payments?: string[];

  @ApiPropertyOptional({ enum: ["whatsapp", "sms", "email"], isArray: true })
  @IsArray() @IsIn(["whatsapp", "sms", "email"], { each: true }) @IsOptional()
  communicationChannels?: string[];

  @ApiPropertyOptional({ type: [String], description: "ServiceCategory ObjectIds" })
  @IsArray() @IsMongoId({ each: true }) @IsOptional() categories?: string[];

  @ApiPropertyOptional({ type: [ClientProfessionalDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => ClientProfessionalDto) @IsOptional()
  professionals?: ClientProfessionalDto[];

  @ApiPropertyOptional() @IsOptional() @IsString() logo?: string;
}
