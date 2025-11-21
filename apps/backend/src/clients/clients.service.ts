import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";

import { CreateClientDto } from "./dto/create-client.dto";
import { UpsertClientProfessionalDto } from "./dto/upsert-client-professional.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { Client, ClientDocument } from "./schemas/client.schema";
import { User, UserDocument, UserRole } from "../users/schemas/user.schema";
import { Service, ServiceDocument } from "../services/schemas/service.schema";

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name)
    private readonly clientModel: Model<ClientDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>
  ) {}

  private mapProfessionals(professionals: any[] = []) {
    return professionals.map((entry) => ({
      professional: new Types.ObjectId(entry.professional),
      services: (entry.services ?? []).map((service: any) => ({
        service: new Types.ObjectId(service.service),
        price: service.price,
        slot: service.slot
      })),
      schedule: (entry.schedule ?? []).map((workday: any) => ({
        day: workday.day,
        start: workday.start,
        end: workday.end
      }))
    }));
  }

  private async nextCode(): Promise<number> {
    const last = await this.clientModel.findOne().sort({ code: -1 }).select("code").lean().exec();
    return (last?.code ?? 0) + 1;
  }

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const code = await this.nextCode();
    const { professionals, categories, ...rest } = createClientDto as any;
    const client = await this.clientModel.create({
      code,
      ...rest,
      categories: (categories ?? []).map((id: string) => new Types.ObjectId(id)),
      professionals: this.mapProfessionals(professionals ?? [])
    });
    return client.toObject();
  }

  findAll(filter: FilterQuery<ClientDocument> = {}): Promise<Client[]> {
    return this.clientModel
      .find({ active: true, ...filter })
      .populate("categories")
      .lean()
      .exec();
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientModel.findById(id).populate("categories").lean().exec();
    if (!client || client.active === false) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }
    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const payload: Record<string, unknown> = { ...updateClientDto };
    if (Object.prototype.hasOwnProperty.call(updateClientDto, "categories")) {
      payload.categories = (updateClientDto.categories ?? []).map((catId) =>
        new Types.ObjectId(catId)
      );
    }
    const client = await this.clientModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...payload,
            ...(updateClientDto as any).professionals
              ? { professionals: this.mapProfessionals((updateClientDto as any).professionals) }
              : {}
          }
        },
        {
          new: true,
          runValidators: true
        }
      )
      .populate("categories")
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
      .select("professionals address location active categories")
      .populate([
        { path: "professionals.professional", select: "name email phone" },
        { path: "professionals.services.service", select: "name" },
        { path: "categories", select: "name" }
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
            ? (serviceDoc?._id?.toString() ?? "")
            : (serviceEntry.service?.toString?.() ?? "");
        return {
          _id: serviceId,
          name: typeof serviceDoc === "object" && serviceDoc?.name ? serviceDoc.name : "Servicio",
          price: serviceEntry.price,
          slot: serviceEntry.slot ?? 1
        };
      });
      return {
        _id:
          typeof professional === "object" && professional?._id ? professional._id.toString() : "",
        name:
          typeof professional === "object" && professional?.name
            ? professional.name
            : "Profesional",
        email: typeof professional === "object" ? (professional?.email ?? "") : "",
        phone: typeof professional === "object" ? (professional?.phone ?? "") : "",
        services,
        schedule: (entry.schedule ?? []).map((workday) => ({
          day: workday?.day ?? "",
          start: workday?.start ?? "",
          end: workday?.end ?? ""
        }))
      };
    });

    const categoryOptions = ((client.categories ?? []) as any[])
      .map((categoryEntry) => {
        if (!categoryEntry) {
          return null;
        }
        if (categoryEntry instanceof Types.ObjectId) {
          return { _id: categoryEntry.toHexString(), name: "Categoría" };
        }
        if (typeof categoryEntry === "string") {
          return { _id: categoryEntry, name: "Categoría" };
        }
        if (typeof categoryEntry === "object") {
          const idValue =
            categoryEntry._id instanceof Types.ObjectId
              ? categoryEntry._id.toHexString()
              : categoryEntry._id?.toString?.() ?? "";
          if (!idValue) {
            return null;
          }
          return {
            _id: idValue,
            name: categoryEntry.name ?? "Categoría"
          };
        }
        return null;
      })
      .filter((item): item is { _id: string; name: string } => Boolean(item && item._id));

    const categoryObjectIds = categoryOptions.map((category) => new Types.ObjectId(category._id));

    const serviceFilter: FilterQuery<ServiceDocument> = { active: true };
    if (categoryObjectIds.length) {
      serviceFilter.category = { $in: categoryObjectIds };
    }

    const serviceCatalogDocs = await this.serviceModel
      .find(serviceFilter)
      .select("name category")
      .populate("category", "name")
      .sort({ order: 1, createdAt: -1 })
      .lean()
      .exec();

    const serviceCatalog = serviceCatalogDocs.map((service) => {
      const categoryValue = service.category as any;
      let categoryId: string | null = null;
      let categoryName: string | null = null;
      if (categoryValue) {
        if (categoryValue instanceof Types.ObjectId) {
          categoryId = categoryValue.toHexString();
        } else if (typeof categoryValue === "string") {
          categoryId = categoryValue;
        } else if (typeof categoryValue === "object") {
          categoryId =
            categoryValue._id instanceof Types.ObjectId
              ? categoryValue._id.toHexString()
              : categoryValue._id?.toString?.() ?? null;
          categoryName = categoryValue.name ?? null;
        }
      }
      return {
        _id: service._id.toString(),
        name: service.name,
        categoryId,
        categoryName
      };
    });

    return {
      professionals,
      place: {
        address: client.address,
        location: client.location
      },
      clientCategories: categoryOptions,
      serviceCatalog
    };
  }

  async upsertProfessional(clientId: string, payload: UpsertClientProfessionalDto) {
    const client = await this.clientModel.findById(clientId).exec();
    if (!client || client.active === false) {
      throw new NotFoundException(`Client with id ${clientId} not found`);
    }

    const { professionalId, services = [], schedule = [], name, email, phone } = payload;

    let proObjectId: Types.ObjectId;
    if (professionalId) {
      proObjectId = new Types.ObjectId(professionalId);
    } else {
      const created = await this.userModel.create({
        name: name ?? "",
        email: email ?? "",
        phone: phone ?? "",
        roles: [UserRole.PRO],
        client: client._id
      });
      proObjectId = created._id as Types.ObjectId;
    }

    const mappedServices = services.map((service) => ({
      service: new Types.ObjectId(service.serviceId),
      price: service.price,
      slot: service.slot
    }));

    const mappedSchedule = schedule
      .filter((entry) => entry?.day && entry?.start && entry?.end)
      .map((entry) => ({
        day: entry.day,
        start: entry.start,
        end: entry.end
      }));

    const existingIndex = (client.professionals ?? []).findIndex((p) =>
      p.professional?.equals ? p.professional.equals(proObjectId) : false
    );

    // Persist general info on User document
    if (name || email || phone) {
      await this.userModel.findByIdAndUpdate(
        proObjectId,
        {
          ...(name ? { name } : {}),
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {})
        },
        { new: true }
      );
    }

    if (existingIndex >= 0) {
      client.professionals[existingIndex].services = mappedServices;
      client.professionals[existingIndex].schedule = mappedSchedule;
    } else {
      client.professionals.push({
        professional: proObjectId,
        services: mappedServices,
        schedule: mappedSchedule
      } as any);
    }

    await client.save();

    return this.findProfessionals(clientId);
  }

  async removeProfessional(clientId: string, professionalId: string) {
    const client = await this.clientModel.findById(clientId).exec();
    if (!client || client.active === false) {
      throw new NotFoundException(`Client with id ${clientId} not found`);
    }
    const proObjectId = new Types.ObjectId(professionalId);
    client.professionals = (client.professionals ?? []).filter((p) =>
      p.professional?.equals ? !p.professional.equals(proObjectId) : true
    );
    await client.save();
    return this.findProfessionals(clientId);
  }
}
