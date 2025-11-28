import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";

import { CommunicationsService } from "../communications/communications.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
import { Appointment, AppointmentDocument } from "./schemas/appointment.schema";

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
    private readonly communicationsService: CommunicationsService
  ) {}

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const payload = this.normalizeAppointmentPayload(dto);
    const code = await this.generateNextCode();
    const created = await this.appointmentModel.create({
      ...payload,
      code
    });
    const createdId =
      typeof created._id === "string"
        ? created._id
        : created._id instanceof this.appointmentModel.db.base.Types.ObjectId
          ? created._id.toHexString()
          : created._id?.toString?.();
    const appointment = await this.findOne(createdId as string);
    await this.communicationsService.notifyAppointmentChange(appointment, "created");
    return appointment;
  }

  findAll(filter: FilterQuery<AppointmentDocument> = {}): Promise<Appointment[]> {
    return this.appointmentModel
      .find({
        ...filter,
        active: true
      })
      .populate([
        { path: "user", select: "name phone" },
        { path: "services.service", select: "name price slot" },
        { path: "professional", select: "name" }
      ])
      .lean()
      .exec()
      .then((appointments) =>
        appointments.map((appointment: any) => {
          const serviceNames =
            appointment.services?.map((item: any) => item?.service?.name).filter(Boolean) ?? [];
          const servicePrices =
            appointment.services?.map((item: any) => item?.price ?? item?.service?.price).filter(
              (v: any) => v !== undefined
            ) ?? [];
          const serviceSlots =
            appointment.services?.map((item: any) => item?.service?.slot).filter(Boolean) ?? [];
          const clientName = appointment.user?.name ?? undefined;
          const clientPhone = appointment.user?.phone ?? undefined;
          const professionalName = appointment.professional?.name ?? undefined;
          return {
            ...appointment,
            serviceNames,
            servicePrices,
            serviceSlots,
            clientName,
            clientPhone,
            professionalName
          };
        })
      );
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentModel
      .findOne({
        _id: id,
        active: true
      })
      .populate([
        { path: "user", select: "name phone" },
        { path: "services.service", select: "name price slot" },
        { path: "professional", select: "name" }
      ])
      .lean()
      .exec();
    if (!appointment) {
      throw new NotFoundException(`Appointment with id ${id} not found or inactive`);
    }
    const serviceNames =
      (appointment.services as any[])?.map((item) => item?.service?.name).filter(Boolean) ?? [];
    const servicePrices =
      (appointment.services as any[])?.map((item) => item?.price ?? item?.service?.price) ?? [];
    const serviceSlots =
      (appointment.services as any[])?.map((item) => item?.service?.slot).filter(Boolean) ?? [];
    const clientName = (appointment as any).user?.name ?? undefined;
    const clientPhone = (appointment as any).user?.phone ?? undefined;
    const professionalName = (appointment as any).professional?.name ?? undefined;
    return {
      ...(appointment as any),
      serviceNames,
      servicePrices,
      serviceSlots,
      clientName,
      clientPhone,
      professionalName
    } as Appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const payload = this.normalizeAppointmentPayload(dto);
    const updated = await this.appointmentModel
      .findOneAndUpdate(
        { _id: id, active: true },
        { $set: payload },
        { new: true, runValidators: true }
      )
      .exec();
    if (!updated || updated.active === false) {
      throw new NotFoundException(`Appointment with id ${id} not found or inactive`);
    }
    const appointmentId =
      typeof updated._id === "string"
        ? updated._id
        : updated._id?.toString?.() ?? id;
    const appointment = await this.findOne(appointmentId);
    await this.communicationsService.notifyAppointmentChange(appointment, "updated");
    return appointment;
  }

  async remove(id: string): Promise<void> {
    const appointment = await this.appointmentModel
      .findOne({ _id: id, active: true })
      .lean()
      .exec();
    if (!appointment) {
      throw new NotFoundException(`Appointment with id ${id} not found or inactive`);
    }
    await this.appointmentModel
      .findOneAndUpdate(
        { _id: id, active: true },
        { $set: { active: false } },
        { new: true }
      )
      .exec();
    await this.communicationsService.notifyAppointmentChange(appointment as any, "deleted");
  }

  private async generateNextCode(): Promise<string> {
    const last = await this.appointmentModel
      .findOne({}, { code: 1 })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    const numeric = last?.code ? parseInt(last.code, 10) || 0 : 0;
    const next = numeric + 1;
    return next.toString().padStart(6, "0");
  }

  private normalizeObjectId(value?: string | Types.ObjectId | null) {
    if (!value) {
      return value;
    }
    return value instanceof Types.ObjectId ? value : new Types.ObjectId(value);
  }

  private normalizeAppointmentPayload(dto: CreateAppointmentDto | UpdateAppointmentDto) {
    return {
      ...dto,
      client: this.normalizeObjectId(dto.client),
      professional: this.normalizeObjectId(dto.professional),
      user: this.normalizeObjectId(dto.user),
      services: (dto.services as any[])?.map((item) => ({
        ...item,
        service: this.normalizeObjectId(item.service)
      }))
    };
  }
}
