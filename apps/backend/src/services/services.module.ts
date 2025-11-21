import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ServiceCategory, ServiceCategorySchema } from "../service-categories/schemas/service-category.schema";
import { ServicesController } from "./services.controller";
import { ServicesService } from "./services.service";
import { Service, ServiceSchema } from "./schemas/service.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Service.name, schema: ServiceSchema },
      { name: ServiceCategory.name, schema: ServiceCategorySchema }
    ])
  ],
  controllers: [ServicesController],
  providers: [ServicesService]
})
export class ServicesModule {}
