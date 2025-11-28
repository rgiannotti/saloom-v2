import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { Appointment, AppointmentSchema } from "../appointments/schemas/appointment.schema";
import { Client, ClientSchema } from "../clients/schemas/client.schema";
import { User, UserSchema } from "../users/schemas/user.schema";
import { CommunicationsController } from "./communications.controller";
import { AppointmentReminderService } from "./appointment-reminder.service";
import { CommunicationsService } from "./communications.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Client.name, schema: ClientSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  controllers: [CommunicationsController],
  providers: [CommunicationsService, AppointmentReminderService],
  exports: [CommunicationsService]
})
export class CommunicationsModule {}
