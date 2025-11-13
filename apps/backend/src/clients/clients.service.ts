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
}
