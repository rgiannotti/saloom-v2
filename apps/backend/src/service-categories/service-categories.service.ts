import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";

import { CreateServiceCategoryDto } from "./dto/create-service-category.dto";
import { UpdateServiceCategoryDto } from "./dto/update-service-category.dto";
import { ServiceCategory, ServiceCategoryDocument } from "./schemas/service-category.schema";

@Injectable()
export class ServiceCategoriesService {
  constructor(
    @InjectModel(ServiceCategory.name)
    private readonly categoryModel: Model<ServiceCategoryDocument>
  ) {}

  create(createDto: CreateServiceCategoryDto): Promise<ServiceCategory> {
    return this.categoryModel.create({
      active: true,
      ...createDto
    });
  }

  findAll(filter: FilterQuery<ServiceCategoryDocument> = {}): Promise<ServiceCategory[]> {
    return this.categoryModel
      .find({ active: true, ...filter })
      .sort({ order: 1, name: 1 })
      .lean()
      .exec();
  }

  async findOne(id: string): Promise<ServiceCategory> {
    const category = await this.categoryModel.findById(id).lean().exec();
    if (!category) {
      throw new NotFoundException(`Service category with id ${id} not found`);
    }
    return category;
  }

  async update(id: string, updateDto: UpdateServiceCategoryDto): Promise<ServiceCategory> {
    const category = await this.categoryModel
      .findByIdAndUpdate(id, { $set: updateDto }, { new: true, runValidators: true })
      .lean()
      .exec();
    if (!category) {
      throw new NotFoundException(`Service category with id ${id} not found`);
    }
    return category;
  }

  async remove(id: string): Promise<void> {
    const result = await this.categoryModel
      .findByIdAndUpdate(id, { $set: { active: false } }, { new: true })
      .exec();
    if (!result) {
      throw new NotFoundException(`Service category with id ${id} not found`);
    }
  }
}
