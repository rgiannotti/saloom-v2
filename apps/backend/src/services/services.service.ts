import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";

import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { Service, ServiceDocument } from "./schemas/service.schema";

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>
  ) {}

  create(createServiceDto: CreateServiceDto): Promise<Service> {
    const { categoryId, ...rest } = createServiceDto;
    return this.serviceModel.create({
      active: true,
      ...rest,
      category: categoryId ? new Types.ObjectId(categoryId) : null
    });
  }

  findAll(filter: FilterQuery<ServiceDocument> = {}): Promise<Service[]> {
    return this.serviceModel
      .find({ ...filter, active: true })
      .populate("category")
      .sort({ order: 1, createdAt: -1 })
      .lean()
      .exec();
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceModel.findById(id).populate("category").lean().exec();
    if (!service) {
      throw new NotFoundException(`Service with id ${id} not found`);
    }
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const { categoryId, ...rest } = updateServiceDto;
    const updatePayload: Record<string, unknown> = { ...rest };
    if (categoryId !== undefined) {
      updatePayload.category = categoryId ? new Types.ObjectId(categoryId) : null;
    }
    const service = await this.serviceModel
      .findByIdAndUpdate(
        id,
        {
          $set: updatePayload
        },
        { new: true, runValidators: true }
      )
      .populate("category")
      .lean()
      .exec();
    if (!service) {
      throw new NotFoundException(`Service with id ${id} not found`);
    }
    return service;
  }

  async remove(id: string): Promise<void> {
    const result = await this.serviceModel
      .findByIdAndUpdate(id, { $set: { active: false } }, { new: true })
      .lean()
      .exec();
    if (!result) {
      throw new NotFoundException(`Service with id ${id} not found`);
    }
  }
}
