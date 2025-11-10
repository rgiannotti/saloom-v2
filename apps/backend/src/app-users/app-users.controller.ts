import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post
} from "@nestjs/common";

import { Roles } from "../auth/decorators/roles.decorator";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { UpdateUserDto } from "../users/dto/update-user.dto";
import { User, UserRole } from "../users/schemas/user.schema";
import { UsersService } from "../users/users.service";

const APP_ROLES = [UserRole.USER, UserRole.PRO, UserRole.OWNER];

@Controller("app/users")
export class AppUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll() {
    return this.usersService.findAll({ roles: { $in: APP_ROLES } });
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async findOne(@Param("id") id: string) {
    const user = await this.usersService.findOne(id);
    this.ensureAppUser(user);
    return user;
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create({
      ...dto,
      roles: this.resolveRoles(dto.roles)
    });
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    const payload: UpdateUserDto = { ...dto };
    if (dto.roles) {
      payload.roles = this.resolveRoles(dto.roles);
    }
    const updated = await this.usersService.update(id, payload);
    this.ensureAppUser(updated);
    return updated;
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async remove(@Param("id") id: string) {
    const user = await this.usersService.findOne(id);
    this.ensureAppUser(user);
    await this.usersService.remove(id);
    return { success: true };
  }

  private resolveRoles(input?: UserRole[]) {
    const roles = (input ?? [UserRole.USER]).filter((role) => APP_ROLES.includes(role));
    return roles.length ? roles : [UserRole.USER];
  }

  private ensureAppUser(user: User) {
    const allowed = user.roles?.some((role) => APP_ROLES.includes(role));
    if (!allowed) {
      throw new NotFoundException("App user not found");
    }
  }
}
