import { Controller, ForbiddenException, Get } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";

import { DashboardService } from "./dashboard.service";

@Controller("client/dashboard")
@Roles(UserRole.PRO, UserRole.OWNER)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@CurrentUser("client") clientId?: string) {
    if (!clientId) {
      throw new ForbiddenException("El usuario no está asociado a un cliente");
    }
    return this.dashboardService.getClientDashboard(clientId);
  }
}
