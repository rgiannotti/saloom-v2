import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";

import { ClientsService } from "./clients.service";
import { UpsertClientProfessionalDto } from "./dto/upsert-client-professional.dto";
import { UpdateClientDto } from "./dto/update-client.dto";

@Controller("app/clients")
@Roles(UserRole.PRO, UserRole.OWNER)
export class AppClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get("me")
  getClientInfo(@CurrentUser("client") clientId?: string) {
    if (!clientId) {
      throw new ForbiddenException("No puedes acceder a este cliente");
    }
    return this.clientsService.findOne(clientId);
  }

  @Patch("me")
  updateClient(
    @CurrentUser("client") clientId: string | undefined,
    @Body() payload: UpdateClientDto
  ) {
    if (!clientId) {
      throw new ForbiddenException("No puedes acceder a este cliente");
    }
    return this.clientsService.update(clientId, payload);
  }

  @Get(":id/professionals")
  findProfessionals(@Param("id") id: string, @CurrentUser("client") clientId?: string) {
    if (!clientId || clientId !== id) {
      throw new ForbiddenException("No puedes acceder a este cliente");
    }
    return this.clientsService.findProfessionals(clientId);
  }

  @Post(":id/professionals")
  upsertProfessional(
    @Param("id") id: string,
    @CurrentUser("client") clientId: string,
    @Body() payload: UpsertClientProfessionalDto
  ) {
    if (!clientId || clientId !== id) {
      throw new ForbiddenException("No puedes acceder a este cliente");
    }
    return this.clientsService.upsertProfessional(clientId, payload);
  }

  @Delete(":id/professionals/:professionalId")
  removeProfessional(
    @Param("id") id: string,
    @Param("professionalId") professionalId: string,
    @CurrentUser("client") clientId: string
  ) {
    if (!clientId || clientId !== id) {
      throw new ForbiddenException("No puedes acceder a este cliente");
    }
    return this.clientsService.removeProfessional(clientId, professionalId);
  }
}
