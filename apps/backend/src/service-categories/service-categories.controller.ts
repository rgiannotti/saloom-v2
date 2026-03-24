import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";
import { CreateServiceCategoryDto } from "./dto/create-service-category.dto";
import { UpdateServiceCategoryDto } from "./dto/update-service-category.dto";
import { ServiceCategoriesService } from "./service-categories.service";

@ApiTags("Backoffice – Service Categories")
@ApiBearerAuth("access-token")
@Controller("service-categories")
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class ServiceCategoriesController {
  constructor(private readonly categoriesService: ServiceCategoriesService) {}

  @Post()
  @ApiOperation({ summary: "Crear categoría de servicio" })
  create(@Body() dto: CreateServiceCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar categorías de servicio" })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener categoría por ID" })
  findOne(@Param("id") id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar categoría" })
  update(@Param("id") id: string, @Body() dto: UpdateServiceCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar categoría" })
  async remove(@Param("id") id: string) {
    await this.categoriesService.remove(id);
    return { success: true };
  }
}
