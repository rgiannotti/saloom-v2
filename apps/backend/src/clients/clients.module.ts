import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";
import { Client, ClientSchema } from "./schemas/client.schema";
import { AppClientsController } from "./app-clients.controller";
import { User, UserSchema } from "../users/schemas/user.schema";
import { Service, ServiceSchema } from "../services/schemas/service.schema";
import { PublicClientsController } from "./public-clients.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: User.name, schema: UserSchema },
      { name: Service.name, schema: ServiceSchema }
    ])
  ],
  controllers: [ClientsController, AppClientsController, PublicClientsController],
  providers: [ClientsService]
})
export class ClientsModule {}
