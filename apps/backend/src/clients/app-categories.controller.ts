import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";
import { ServiceCategoriesService } from "../service-categories/service-categories.service";

@ApiTags("App – Categories")
@ApiBearerAuth("access-token")
@Controller("app/categories")
@Roles(UserRole.USER)
export class AppCategoriesController {
  constructor(private readonly categoriesService: ServiceCategoriesService) {}

  @Get()
  @ApiOperation({ summary: "Listar categorías activas de servicios" })
  findAll() {
    return this.categoriesService.findAll();
  }
}
