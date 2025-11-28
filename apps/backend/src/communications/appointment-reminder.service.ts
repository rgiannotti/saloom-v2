import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { Appointment, AppointmentDocument } from "../appointments/schemas/appointment.schema";
import { CommunicationsService } from "./communications.service";

@Injectable()
export class AppointmentReminderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppointmentReminderService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
    private readonly communicationsService: CommunicationsService
  ) {}

  onModuleInit() {
    // Ejecuta inmediatamente y luego cada minuto.
    this.run();
    this.timer = setInterval(() => this.run(), 60 * 1000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async run() {
    try {
      const now = new Date();
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      const candidates = await this.appointmentModel
        .find({
          active: true,
          status: { $in: ["scheduled", "confirmed"] },
          startDate: { $gt: now, $lte: nextHour },
          $or: [{ reminderSent: { $ne: true } }, { reminderSent: { $exists: false } }]
        })
        .select("_id client startDate reminderSent")
        .lean()
        .exec();

      for (const appt of candidates) {
        const clientId =
          typeof appt.client === "string"
            ? appt.client
            : (appt.client as Types.ObjectId)?.toString();
        if (!clientId) {
          continue;
        }
        await this.communicationsService.sendReminder(appt._id.toString(), clientId);
        await this.appointmentModel
          .updateOne({ _id: appt._id }, { $set: { reminderSent: true } })
          .exec();
      }
    } catch (err) {
      this.logger.error("Error ejecutando recordatorios de citas", err as Error);
    }
  }
}
