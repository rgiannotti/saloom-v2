import { Injectable, Logger, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { Appointment, AppointmentDocument } from "../appointments/schemas/appointment.schema";
import { Client, ClientDocument } from "../clients/schemas/client.schema";
import { User, UserDocument } from "../users/schemas/user.schema";

type AppointmentAction = "created" | "updated" | "deleted";

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);

  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Client.name) private readonly clientModel: Model<ClientDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>
  ) {}

  async notifyAppointmentChange(appointment: Appointment, action: AppointmentAction) {
    try {
      const clientId =
        typeof appointment.client === "string"
          ? appointment.client
          : (appointment.client as Types.ObjectId)?.toString();
      if (!clientId) {
        return;
      }
      const [client, user] = await Promise.all([
        this.clientModel
          .findById(clientId)
          .select("communicationChannels name denomination phone fiscalAddress address")
          .lean()
          .exec(),
        appointment.user
          ? this.userModel
              .findById(
                typeof appointment.user === "string"
                  ? appointment.user
                  : (appointment.user as Types.ObjectId)
              )
              .select("name email phone")
              .lean()
              .exec()
          : null
      ]);

      if (!client || !client.communicationChannels?.length) {
        return;
      }
      console.log("Notificando", client, user);
      const message = this.buildMessage(appointment, action, client, user ?? undefined);

      if (client.communicationChannels.includes("sms") && user?.phone) {
        await this.sendSms(user.phone, message);
      }
      if (client.communicationChannels.includes("email") && user?.email) {
        await this.sendEmail(user.email, "Actualización de cita", message);
      }
    } catch (err) {
      this.logger.error("Error notificando cambio de cita", err as Error);
    }
  }

  async listSmsMessages(appointmentId: string, clientId: string) {
    const { clientPhone, client } = await this.getAppointmentContext(appointmentId, clientId);
    const twilioClient = this.getTwilioClient();
    if (!twilioClient || !clientPhone) {
      return [];
    }
    const from = process.env.TWILIO_FROM_PHONE;
    if (!from) {
      this.logger.warn("TWILIO_FROM_PHONE no configurado; historial omitido.");
      return [];
    }
    const outgoing = await twilioClient.messages.list({
      to: clientPhone,
      from,
      limit: 50
    });
    const incoming = await twilioClient.messages.list({
      from: clientPhone,
      to: from,
      limit: 50
    });
    const combined = [...outgoing, ...incoming].map((msg: any) => ({
      id: msg.sid,
      body: msg.body,
      direction:
        msg.direction === "outbound-api"
          ? "outgoing"
          : msg.direction?.includes("inbound")
            ? "incoming"
            : msg.direction,
      date: msg.dateSent ?? msg.dateCreated ?? new Date(),
      to: msg.to,
      from: msg.from,
      status: msg.status
    }));
    combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return {
      clientName: client?.name ?? client?.denomination ?? "Cliente",
      phone: clientPhone,
      messages: combined
    };
  }

  async sendSmsMessage(appointmentId: string, clientId: string, body: string) {
    const { clientPhone } = await this.getAppointmentContext(appointmentId, clientId);
    const twilioClient = this.getTwilioClient();
    const from = process.env.TWILIO_FROM_PHONE;
    if (!twilioClient || !from || !clientPhone) {
      this.logger.warn("SMS no enviado: faltan configuraciones o número de cliente.");
      return { sent: false };
    }
    const resp = await twilioClient.messages.create({
      from,
      to: clientPhone,
      body
    });
    return { sent: true, sid: resp.sid };
  }

  async resendConfirmation(appointmentId: string, clientId: string) {
    const { appointment, client, user, clientPhone } = await this.getAppointmentContext(
      appointmentId,
      clientId
    );
    if (!client || !client.communicationChannels?.length) {
      return { sent: false };
    }
    const message = this.buildMessage(appointment, "created", client, user ?? undefined);
    if (client.communicationChannels.includes("sms") && clientPhone) {
      await this.sendSms(clientPhone, message);
    }
    if (client.communicationChannels.includes("email") && user?.email) {
      await this.sendEmail(user.email, "Actualización de cita", message);
    }
    return { sent: true, message };
  }

  async sendReminder(appointmentId: string, clientId: string) {
    const { appointment, client, user, clientPhone } = await this.getAppointmentContext(
      appointmentId,
      clientId
    );
    if (!client || !client.communicationChannels?.length) {
      return { sent: false };
    }
    const clientName = client?.name || client?.denomination || "Cliente";
    const phone = (client as any)?.phone || "contacta al salón";
    const address =
      (client as any)?.fiscalAddress || (client as any)?.address?.full || "dirección no disponible";
    const appointmentDate = appointment.startDate
      ? new Date(appointment.startDate).toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "UTC"
        })
      : "";
    const message = `${clientName}: Don't forget your appointment on ${appointmentDate}. Changes only by phone: ${phone}. Address: ${address}.`;

    if (client.communicationChannels.includes("sms") && clientPhone) {
      await this.sendSms(clientPhone, message);
    }
    if (client.communicationChannels.includes("email") && user?.email) {
      await this.sendEmail(user.email, "Recordatorio de cita", message);
    }
    return { sent: true, message };
  }

  private async getAppointmentContext(appointmentId: string, clientId: string) {
    const appointment = await this.appointmentModel
      .findOne({ _id: appointmentId, active: true })
      .lean()
      .exec();
    if (!appointment) {
      throw new NotFoundException("Cita no encontrada");
    }
    const appointmentClientId =
      typeof appointment.client === "string"
        ? appointment.client
        : (appointment.client as Types.ObjectId).toString();
    if (appointmentClientId !== clientId) {
      throw new ForbiddenException("No puedes acceder a esta cita");
    }
    const client = await this.clientModel
      .findById(clientId)
      .select("name denomination phone address fiscalAddress communicationChannels")
      .lean()
      .exec();
    const user =
      appointment.user &&
      (await this.userModel
        .findById(
          typeof appointment.user === "string"
            ? appointment.user
            : (appointment.user as Types.ObjectId)
        )
        .select("phone email name")
        .lean()
        .exec());
    const clientPhone = user?.phone ?? (client as any)?.phone ?? "";
    return { appointment, client, user, clientPhone };
  }

  private buildMessage(
    appointment: Appointment,
    action: AppointmentAction,
    client: Partial<Client>,
    user?: Partial<User> | null
  ) {
    const clientName = client?.name || client?.denomination || "Cliente";
    const phone = (client as any)?.phone || "contacta al salón";
    const address =
      (client as any)?.fiscalAddress || (client as any)?.address?.full || "dirección no disponible";
    const appointmentDate = appointment.startDate
      ? new Date(appointment.startDate).toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "UTC"
        })
      : "";
    return `${clientName}: Your appointment is confirmed in ${appointmentDate}. Changes only by phone: ${phone}. Address: ${address}.`;
  }

  private async sendSms(to: string, body: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_PHONE;
    if (!accountSid || !authToken || !from) {
      this.logger.warn("Twilio no configurado; SMS omitido.");
      return;
    }
    try {
      console.log("Enviando SMS a", to, "con cuerpo:", body);
      // Prefer Twilio SDK if available
      // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require

      const twilio = require("twilio");
      const client = twilio(accountSid, authToken);
      await client.messages.create({
        from,
        to,
        body
      });
    } catch (err) {
      this.logger.warn("Twilio SDK no disponible, SMS omitido.", err as Error);
    }
  }

  // Placeholder simple email sender; replace with your provider of choice.
  private async sendEmail(to: string, subject: string, body: string) {
    // Implementa tu proveedor real de email aquí.
    this.logger.log(`Email a ${to} - ${subject}: ${body}`);
  }

  private getTwilioClient() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      this.logger.warn("Twilio no configurado.");
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const twilio = require("twilio");
    return twilio(accountSid, authToken);
  }
}
