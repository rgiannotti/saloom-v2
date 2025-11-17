import { Controller, ForbiddenException, Get, Param } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";

import { ClientsService } from "./clients.service";

@Controller("app/clients")
@Roles(UserRole.PRO, UserRole.OWNER)
export class AppClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get(":id/professionals")
  findProfessionals(@Param("id") id: string, @CurrentUser("client") clientId?: string) {
    if (!clientId || clientId !== id) {
      throw new ForbiddenException("No puedes acceder a este cliente");
    }
    return this.clientsService.findProfessionals(clientId);
  }
}
