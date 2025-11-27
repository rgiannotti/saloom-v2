import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query
} from "@nestjs/common";
import { FilterQuery, Types } from "mongoose";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { UpdateUserDto } from "../users/dto/update-user.dto";
import { User, UserDocument, UserRole } from "../users/schemas/user.schema";
import { UsersService } from "../users/users.service";

const APP_ALLOWED_ROLES = [UserRole.USER, UserRole.PRO, UserRole.STAFF];

@Controller("app/users")
export class AppUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query("clientId") clientId?: string, @Query("roles") roles?: string | string[]) {
    const requestedRoles = this.getRolesFromQuery(roles);
    const filter: FilterQuery<UserDocument> = { roles: { $in: requestedRoles } };
    if (clientId) {
      if (Types.ObjectId.isValid(clientId)) {
        filter.$or = [{ client: new Types.ObjectId(clientId) }, { client: clientId }];
      } else {
        filter.client = clientId;
      }
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
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.PRO, UserRole.OWNER)
  create(@CurrentUser("client") clientId: string | undefined, @Body() dto: CreateUserDto) {
    this.ensureClientMatch(clientId, dto.client);
    return this.usersService.create({
      ...dto,
      client: clientId ?? dto.client,
      roles: this.filterAllowedRoles(dto.roles, [UserRole.PRO])
    });
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.PRO, UserRole.OWNER)
  async update(
    @Param("id") id: string,
    @CurrentUser("client") clientId: string | undefined,
    @Body() dto: UpdateUserDto
  ) {
    const existing = await this.usersService.findOne(id);
    if (!this.isSameClient(clientId, existing.client)) {
      throw new ForbiddenException("No puedes modificar este usuario");
    }
    const payload: UpdateUserDto = { ...dto };
    if (dto.roles) {
      payload.roles = this.filterAllowedRoles(dto.roles, [UserRole.PRO]);
    }
    payload.client =
      typeof existing.client === "string"
        ? existing.client
        : (existing.client?.toString?.() ?? undefined);
    const updated = await this.usersService.update(id, payload);
    this.ensureAppUser(updated);
    return updated;
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.PRO, UserRole.OWNER)
  async remove(@Param("id") id: string, @CurrentUser("client") clientId: string | undefined) {
    const user = await this.usersService.findOne(id);
    if (!this.isSameClient(clientId, user.client)) {
      throw new ForbiddenException("No puedes eliminar este usuario");
    }
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

  private filterAllowedRoles(
    input?: (UserRole | string)[],
    allowed: UserRole[] = APP_ALLOWED_ROLES
  ) {
    const normalized = this.normalizeRolesInput(input);
    const roles = normalized
      .map((role) => role.toString().toLowerCase() as UserRole)
      .filter((role) => allowed.includes(role));
    return roles.length ? roles : [allowed[0] ?? UserRole.USER];
  }

  private ensureAppUser(user: User) {
    const allowed = user.roles?.some((role) => APP_ALLOWED_ROLES.includes(role));
    if (!allowed) {
      throw new NotFoundException("App user not found");
    }
  }

  private ensureClientMatch(currentClientId?: string, payloadClientId?: string) {
    if (!currentClientId) {
      return;
    }
    if (payloadClientId && payloadClientId !== currentClientId) {
      throw new ForbiddenException("No puedes gestionar usuarios de otro cliente");
    }
  }

  private isSameClient(currentClientId?: string, userClient?: Types.ObjectId | string | null) {
    if (!currentClientId) return false;
    if (!userClient) return false;
    const userClientId =
      typeof userClient === "string" ? userClient : (userClient as Types.ObjectId).toString();
    return userClientId === currentClientId;
  }
}
