import { IsArray, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpsertClientProfessionalServiceDto {
  @IsMongoId()
  serviceId: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  slot: number;
}

export class UpsertClientProfessionalScheduleDto {
  @IsString()
  @IsNotEmpty()
  day: string;

  @IsString()
  @IsNotEmpty()
  start: string; // HH:mm

  @IsString()
  @IsNotEmpty()
  end: string; // HH:mm
}

export class UpsertClientProfessionalDto {
  @IsMongoId()
  @IsOptional()
  professionalId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsArray()
  @IsOptional()
  services?: UpsertClientProfessionalServiceDto[];

  @IsArray()
  @IsOptional()
  schedule?: UpsertClientProfessionalScheduleDto[];
}
