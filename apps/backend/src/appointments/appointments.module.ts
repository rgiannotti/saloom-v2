import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { CommunicationsService } from "../communications/communications.service";
import { Client, ClientSchema } from "../clients/schemas/client.schema";
import { User, UserSchema } from "../users/schemas/user.schema";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";
import { Appointment, AppointmentSchema } from "./schemas/appointment.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Client.name, schema: ClientSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, CommunicationsService],
  exports: [AppointmentsService]
})
export class AppointmentsModule {}
