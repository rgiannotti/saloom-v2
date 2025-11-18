import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";

import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
import { Appointment, AppointmentDocument } from "./schemas/appointment.schema";

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>
  ) {}

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const code = await this.generateNextCode();
    const created = await this.appointmentModel.create({
      ...dto,
      code
    });
    const createdId =
      typeof created._id === "string"
        ? created._id
        : created._id instanceof this.appointmentModel.db.base.Types.ObjectId
          ? created._id.toHexString()
          : created._id?.toString?.();
    return this.findOne(createdId as string);
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
    const updated = await this.appointmentModel
      .findOneAndUpdate(
        { _id: id, active: true },
        { $set: dto },
        { new: true, runValidators: true }
      )
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException(`Appointment with id ${id} not found or inactive`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.appointmentModel
      .findOneAndUpdate(
        { _id: id, active: true },
        { $set: { active: false } },
        { new: true }
      )
      .exec();
    if (!result) {
      throw new NotFoundException(`Appointment with id ${id} not found or inactive`);
    }
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
}
