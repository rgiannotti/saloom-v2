import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf
} from "class-validator";

import { UserRole } from "../schemas/user.schema";

export class CreateUserDto {
  @ApiProperty({ example: "Juan Pérez", minLength: 2 })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: "juan@ejemplo.com" })
  @IsOptional()
  @ValidateIf(
    (o) =>
      o.email !== undefined &&
      o.email !== null &&
      typeof o.email === "string" &&
      o.email.trim().length > 0
  )
  @IsEmail()
  email?: string;

  @ApiProperty({ example: "+58412000000" })
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ enum: UserRole, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @ApiPropertyOptional({ description: "Client ObjectId" })
  @IsOptional()
  @IsMongoId()
  client?: string;
}
