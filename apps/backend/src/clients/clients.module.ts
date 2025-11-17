import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";
import { Client, ClientSchema } from "./schemas/client.schema";
import { AppClientsController } from "./app-clients.controller";

@Module({
  imports: [MongooseModule.forFeature([{ name: Client.name, schema: ClientSchema }])],
  controllers: [ClientsController, AppClientsController],
  providers: [ClientsService]
})
export class ClientsModule {}
