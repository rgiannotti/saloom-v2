import { Body, Controller, ForbiddenException, Get, Param, Post } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";
import { CommunicationsService } from "./communications.service";
import { SendMessageDto } from "./dto/send-message.dto";

@Controller("communications/appointments/:appointmentId/messages")
@Roles(UserRole.PRO, UserRole.OWNER, UserRole.ADMIN, UserRole.STAFF)
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Get()
  async listMessages(
    @Param("appointmentId") appointmentId: string,
    @CurrentUser("client") clientId?: string
  ) {
    if (!clientId) {
      throw new ForbiddenException("No puedes acceder a este cliente");
    }
    return this.communicationsService.listSmsMessages(appointmentId, clientId);
  }

  @Post()
  async sendMessage(
    @Param("appointmentId") appointmentId: string,
    @CurrentUser("client") clientId: string | undefined,
    @Body() payload: SendMessageDto
  ) {
    if (!clientId) {
      throw new ForbiddenException("No puedes acceder a este cliente");
    }
    return this.communicationsService.sendSmsMessage(appointmentId, clientId, payload.body);
  }

  @Post("confirm")
  async resendConfirmation(
    @Param("appointmentId") appointmentId: string,
    @CurrentUser("client") clientId: string | undefined
  ) {
    if (!clientId) {
      throw new ForbiddenException("No puedes acceder a este cliente");
    }
    return this.communicationsService.resendConfirmation(appointmentId, clientId);
  }

  @Post("reminder")
  async sendReminder(
    @Param("appointmentId") appointmentId: string,
    @CurrentUser("client") clientId: string | undefined
  ) {
    if (!clientId) {
      throw new ForbiddenException("No puedes acceder a este cliente");
    }
    return this.communicationsService.sendReminder(appointmentId, clientId);
  }
}
