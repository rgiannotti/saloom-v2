import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";

import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { ServicesService } from "./services.service";

@ApiTags("Backoffice – Services")
@ApiBearerAuth("access-token")
@Controller("services")
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: "Crear servicio" })
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar servicios" })
  findAll() {
    return this.servicesService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener servicio por ID" })
  findOne(@Param("id") id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar servicio" })
  update(@Param("id") id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar servicio" })
  async remove(@Param("id") id: string) {
    await this.servicesService.remove(id);
    return { success: true };
  }
}
