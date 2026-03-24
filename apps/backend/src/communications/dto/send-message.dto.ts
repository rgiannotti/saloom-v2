import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class SendMessageDto {
  @ApiProperty({ example: "Tu cita ha sido confirmada para mañana a las 10:00 AM." })
  @IsString()
  @IsNotEmpty()
  body!: string;
}
