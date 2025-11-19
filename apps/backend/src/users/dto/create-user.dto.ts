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
  @IsString()
  @MinLength(2)
  name!: string;

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

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @IsOptional()
  @IsMongoId()
  client?: string;
}
