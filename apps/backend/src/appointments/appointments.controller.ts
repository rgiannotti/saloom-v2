import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";

import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";

@ApiTags("Backoffice – Appointments")
@ApiBearerAuth("access-token")
@Controller("appointments")
@Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.PRO)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: "Crear turno" })
  create(@Body() dto: CreateAppointmentDto) {
    console.log("Creating appointment with data:", dto);
    return this.appointmentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar turnos" })
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener turno por ID" })
  findOne(@Param("id") id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar turno" })
  update(@Param("id") id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar turno" })
  async remove(@Param("id") id: string) {
    await this.appointmentsService.remove(id);
    return { success: true };
  }
}
