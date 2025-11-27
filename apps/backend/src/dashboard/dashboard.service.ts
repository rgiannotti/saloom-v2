import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { Appointment, AppointmentDocument } from "../appointments/schemas/appointment.schema";
import { User, UserDocument, UserRole } from "../users/schemas/user.schema";

interface DashboardResponse {
  todayAppointments: number;
  weekRevenue: number;
  availableStaff: number;
  upcomingAppointments: Array<{
    id: string;
    clientName: string;
    serviceName: string;
    time: string;
    status: string;
    price: number;
  }>;
  clients: number;
  monthAppointments: number;
  monthNewClients: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>
  ) {}

  async getClientDashboard(clientId: string): Promise<DashboardResponse> {
    const clientObjectId = new Types.ObjectId(clientId);
    const todayRange = this.getDayRange(new Date());
    const weekRange = this.getWeekRange(new Date());
    const monthRange = this.getMonthRange(new Date());
    const activeStatusFilter = { status: { $nin: ["cancelled", "canceled", "completed"] } };
    const [
      todayAppointments,
      weekRevenue,
      availableStaff,
      upcomingAppointments,
      clients,
      monthAppointments,
      monthNewClients
    ] = await Promise.all([
      this.appointmentModel.countDocuments({
        client: clientObjectId,
        active: true,
        ...activeStatusFilter,
        startDate: { $gte: todayRange.start, $lt: todayRange.end }
      }),
      this.sumWeekRevenue(clientObjectId, weekRange.start, weekRange.end, activeStatusFilter),
      this.userModel.countDocuments({
        client: clientObjectId,
        active: true,
        roles: { $in: [UserRole.PRO] }
      }),
      this.getUpcomingAppointments(
        clientObjectId,
        todayRange.start,
        todayRange.end,
        activeStatusFilter
      ),
      this.userModel.countDocuments({
        client: clientObjectId,
        active: true,
        roles: { $in: [UserRole.USER] }
      }),
      this.appointmentModel.countDocuments({
        client: clientObjectId,
        active: true,
        startDate: { $gte: monthRange.start, $lt: monthRange.end }
      }),
      this.userModel.countDocuments({
        client: clientObjectId,
        active: true,
        roles: { $in: [UserRole.USER] },
        createdAt: { $gte: monthRange.start, $lt: monthRange.end }
      })
    ]);

    return {
      todayAppointments,
      weekRevenue,
      availableStaff,
      upcomingAppointments,
      clients,
      monthAppointments,
      monthNewClients
    };
  }

  private getDayRange(date: Date) {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }

  private getWeekRange(date: Date) {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = start.getUTCDay(); // 0 (Sun) - 6 (Sat)
    const diff = (day + 6) % 7; // convert to Monday as first day
    start.setUTCDate(start.getUTCDate() - diff);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    return { start, end };
  }

  private getMonthRange(date: Date) {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
    return { start, end };
  }

  private async sumWeekRevenue(
    client: Types.ObjectId,
    start: Date,
    end: Date,
    statusFilter: Record<string, unknown>
  ): Promise<number> {
    const result = await this.appointmentModel
      .aggregate<{ total: number }>([
        {
          $match: {
            client,
            active: true,
            ...statusFilter,
            startDate: { $gte: start, $lt: end }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$amount", 0] } }
          }
        }
      ])
      .exec();
    return result?.[0]?.total ?? 0;
  }

  private async getUpcomingAppointments(
    client: Types.ObjectId,
    start: Date,
    end: Date,
    statusFilter: Record<string, unknown>
  ): Promise<
    Array<{
      id: string;
      clientName: string;
      serviceName: string;
      time: string;
      status: string;
      price: number;
    }>
  > {
    const appointments = await this.appointmentModel
      .find({
        client,
        active: true,
        ...statusFilter,
        startDate: { $gte: start, $lt: end }
      })
      .sort({ startDate: 1 })
      .limit(10)
      .populate([
        { path: "user", select: "name" },
        { path: "services.service", select: "name price" }
      ])
      .lean()
      .exec();

    return appointments.map((appointment) => {
      const id =
        typeof appointment._id === "string"
          ? appointment._id
          : (appointment._id?.toString?.() ?? "");
      const user = appointment.user as any;
      const serviceEntry = (appointment.services as any[])?.[0];
      const service = serviceEntry?.service as any;
      const serviceName = service?.name ?? "Servicio";
      const price =
        appointment.amount ??
        serviceEntry?.price ??
        (typeof service === "object" ? (service?.price ?? 0) : 0);

      return {
        id,
        clientName: user?.name ?? "Cliente",
        serviceName,
        time: this.formatTime(appointment.startDate),
        status: appointment.status,
        price
      };
    });
  }

  private formatTime(date: Date) {
    return new Date(date).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }
}
