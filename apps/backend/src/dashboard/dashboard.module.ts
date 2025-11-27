import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AppointmentsModule } from "../appointments/appointments.module";
import { Appointment, AppointmentSchema } from "../appointments/schemas/appointment.schema";
import { User, UserSchema } from "../users/schemas/user.schema";

import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [
    AppointmentsModule,
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService]
})
export class DashboardModule {}
