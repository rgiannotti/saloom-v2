import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";

import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";
import { CreateServiceCategoryDto } from "./dto/create-service-category.dto";
import { UpdateServiceCategoryDto } from "./dto/update-service-category.dto";
import { ServiceCategoriesService } from "./service-categories.service";

@Controller("service-categories")
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class ServiceCategoriesController {
  constructor(private readonly categoriesService: ServiceCategoriesService) {}

  @Post()
  create(@Body() dto: CreateServiceCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateServiceCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.categoriesService.remove(id);
    return { success: true };
  }
}
