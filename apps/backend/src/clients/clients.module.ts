import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";
import { Client, ClientSchema } from "./schemas/client.schema";
import { AppCategoriesController } from "./app-categories.controller";
import { AppClientsController } from "./app-clients.controller";
import { AppRecommendationsController } from "./app-recommendations.controller";
import { User, UserSchema } from "../users/schemas/user.schema";
import { Service, ServiceSchema } from "../services/schemas/service.schema";
import { PublicClientsController } from "./public-clients.controller";
import { ServiceCategoriesModule } from "../service-categories/service-categories.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: User.name, schema: UserSchema },
      { name: Service.name, schema: ServiceSchema }
    ]),
    ServiceCategoriesModule
  ],
  controllers: [
    ClientsController,
    AppCategoriesController,
    AppClientsController,
    AppRecommendationsController,
    PublicClientsController
  ],
  providers: [ClientsService]
})
export class ClientsModule {}
