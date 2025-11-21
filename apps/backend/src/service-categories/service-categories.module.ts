import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ServiceCategoriesController } from "./service-categories.controller";
import { ServiceCategoriesService } from "./service-categories.service";
import { ServiceCategory, ServiceCategorySchema } from "./schemas/service-category.schema";

@Module({
  imports: [MongooseModule.forFeature([{ name: ServiceCategory.name, schema: ServiceCategorySchema }])],
  controllers: [ServiceCategoriesController],
  providers: [ServiceCategoriesService],
  exports: [ServiceCategoriesService]
})
export class ServiceCategoriesModule {}
