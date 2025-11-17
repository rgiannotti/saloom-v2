import { Module } from "@nestjs/common";

import { UsersModule } from "../users/users.module";

import { AppUsersController } from "./app-users.controller";
import { ClientUsersController } from "./client-users.controller";

@Module({
  imports: [UsersModule],
  controllers: [AppUsersController, ClientUsersController]
})
export class AppUsersModule {}
