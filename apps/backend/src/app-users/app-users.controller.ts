import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query
} from "@nestjs/common";
import { FilterQuery, Types } from "mongoose";

import { Roles } from "../auth/decorators/roles.decorator";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { UpdateUserDto } from "../users/dto/update-user.dto";
import { User, UserDocument, UserRole } from "../users/schemas/user.schema";
import { UsersService } from "../users/users.service";

const APP_ALLOWED_ROLES = [UserRole.USER, UserRole.PRO];

@Controller("app/users")
export class AppUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll(@Query("clientId") clientId?: string, @Query("roles") roles?: string | string[]) {
    const requestedRoles = this.getRolesFromQuery(roles);
    const filter: FilterQuery<UserDocument> = { roles: { $in: requestedRoles } };
    if (clientId && Types.ObjectId.isValid(clientId)) {
      filter.$or = [{ client: null }, { client: clientId }];
    }
    return this.usersService.findAll(filter);
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
      roles: this.filterAllowedRoles(dto.roles)
    });
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    const payload: UpdateUserDto = { ...dto };
    if (dto.roles) {
      payload.roles = this.filterAllowedRoles(dto.roles);
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

  private getRolesFromQuery(input?: string | string[]) {
    const values = this.normalizeRolesInput(input);
    return this.filterAllowedRoles(values);
  }

  private normalizeRolesInput(input?: string | string[] | (UserRole | string)[]) {
    if (!input) {
      return [];
    }
    if (Array.isArray(input)) {
      return input;
    }
    return input
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  private filterAllowedRoles(input?: (UserRole | string)[]) {
    const normalized = this.normalizeRolesInput(input);
    const roles = normalized
      .map((role) => role.toString().toLowerCase() as UserRole)
      .filter((role) => APP_ALLOWED_ROLES.includes(role));
    return roles.length ? roles : [UserRole.USER];
  }

  private ensureAppUser(user: User) {
    const allowed = user.roles?.some((role) => APP_ALLOWED_ROLES.includes(role));
    if (!allowed) {
      throw new NotFoundException("App user not found");
    }
  }
}
