import { Controller, ForbiddenException, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";

import { DashboardService } from "./dashboard.service";

@ApiTags("Client – Dashboard")
@ApiBearerAuth("access-token")
@Controller("client/dashboard")
@Roles(UserRole.PRO, UserRole.OWNER)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: "Obtener resumen del dashboard del cliente" })
  getDashboard(@CurrentUser("client") clientId?: string) {
    if (!clientId) {
      throw new ForbiddenException("El usuario no está asociado a un cliente");
    }
    return this.dashboardService.getClientDashboard(clientId);
  }
}
