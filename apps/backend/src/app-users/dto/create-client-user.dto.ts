import { IsEmail, IsOptional, IsString, MinLength, ValidateIf } from "class-validator";

export class CreateClientUserDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  @ValidateIf(
    (o) =>
      o.email !== undefined &&
      o.email !== null &&
      typeof o.email === "string" &&
      o.email.trim().length > 0
  )
  @IsOptional()
  email?: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
