import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength, ValidateIf } from "class-validator";

export class CreateClientUserDto {
  @ApiProperty({ example: "María García", minLength: 2 })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: "maria@ejemplo.com" })
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

  @ApiProperty({ example: "+58412000000" })
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
