import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";

import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";

import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { ServicesService } from "./services.service";

@Controller("services")
  @Roles(UserRole.ADMIN, UserRole.STAFF)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.servicesService.remove(id);
    return { success: true };
  }
}
