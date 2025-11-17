import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class CreateClientUserDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
