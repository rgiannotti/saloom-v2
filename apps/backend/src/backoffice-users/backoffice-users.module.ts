import { Module } from "@nestjs/common";

import { UsersModule } from "../users/users.module";

import { BackofficeUsersController } from "./backoffice-users.controller";

@Module({
  imports: [UsersModule],
  controllers: [BackofficeUsersController]
})
export class BackofficeUsersModule {}
