import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";

import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";

import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";

@Controller("appointments")
@Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.PRO)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    console.log("Creating appointment with data:", dto);
    return this.appointmentsService.create(dto);
  }

  @Get()
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.appointmentsService.remove(id);
    return { success: true };
  }
}
