import { Module } from "@nestjs/common";

import { UsersModule } from "../users/users.module";

import { AppUsersController } from "./app-users.controller";

@Module({
  imports: [UsersModule],
  controllers: [AppUsersController]
})
export class AppUsersModule {}
