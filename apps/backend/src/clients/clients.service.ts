import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";

import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { Client, ClientDocument } from "./schemas/client.schema";

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name)
    private readonly clientModel: Model<ClientDocument>
  ) {}

  private async nextCode(): Promise<number> {
    const last = await this.clientModel.findOne().sort({ code: -1 }).select("code").lean().exec();
    return (last?.code ?? 0) + 1;
  }

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const code = await this.nextCode();
    const client = await this.clientModel.create({
      code,
      ...createClientDto
    });
    return client.toObject();
  }

  findAll(filter: FilterQuery<ClientDocument> = {}): Promise<Client[]> {
    return this.clientModel.find({ active: true, ...filter }).lean().exec();
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientModel.findById(id).lean().exec();
    if (!client || client.active === false) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }
    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.clientModel
      .findByIdAndUpdate(
        id,
        { $set: updateClientDto },
        {
          new: true,
          runValidators: true
        }
      )
      .lean()
      .exec();
    if (!client || client.active === false) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }
    return client;
  }

  async remove(id: string): Promise<void> {
    const client = await this.clientModel
      .findByIdAndUpdate(id, { $set: { active: false } }, { new: true })
      .exec();
    if (!client) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }
  }

  async findProfessionals(id: string) {
    const client = await this.clientModel
      .findById(id)
      .select("professionals address location active")
      .populate([
        { path: "professionals.professional", select: "name email phone" },
        { path: "professionals.services.service", select: "name" }
      ])
      .lean()
      .exec();

    if (!client || client.active === false) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }

    const professionals = (client.professionals ?? []).map((entry) => {
      const professional = entry.professional as Record<string, any>;
      const services = (entry.services ?? []).map((serviceEntry) => {
        const serviceDoc = serviceEntry.service as Record<string, any>;
        const serviceId =
          typeof serviceDoc === "object"
            ? serviceDoc?._id?.toString() ?? ""
            : serviceEntry.service?.toString?.() ?? "";
        return {
          _id: serviceId,
          name:
            typeof serviceDoc === "object" && serviceDoc?.name
              ? serviceDoc.name
              : "Servicio",
          price: serviceEntry.price,
          slot: serviceEntry.slot ?? 1
        };
      });
      return {
        _id:
          typeof professional === "object" && professional?._id
            ? professional._id.toString()
            : "",
        name:
          typeof professional === "object" && professional?.name
            ? professional.name
            : "Profesional",
        email: typeof professional === "object" ? professional?.email ?? "" : "",
        phone: typeof professional === "object" ? professional?.phone ?? "" : "",
        services,
        schedule: (entry.schedule ?? []).map((workday) => ({
          day: workday?.day ?? "",
          start: workday?.start ?? "",
          end: workday?.end ?? ""
        }))
      };
    });

    return {
      professionals,
      place: {
        address: client.address,
        location: client.location
      }
    };
  }
}
