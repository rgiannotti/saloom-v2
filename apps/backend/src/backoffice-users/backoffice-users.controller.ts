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
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { Roles } from "../auth/decorators/roles.decorator";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { ResetPasswordDto } from "../users/dto/reset-password.dto";
import { UpdateUserDto } from "../users/dto/update-user.dto";
import { User, UserRole } from "../users/schemas/user.schema";
import { UsersService } from "../users/users.service";

const BACKOFFICE_ROLES = [UserRole.ADMIN];

@ApiTags("Backoffice – Users")
@ApiBearerAuth("access-token")
@Controller("backoffice/users")
export class BackofficeUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: "Listar usuarios del backoffice" })
  findAll() {
    return this.usersService.findAll({ roles: { $in: BACKOFFICE_ROLES } });
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: "Obtener usuario por ID" })
  async findOne(@Param("id") id: string) {
    const user = await this.usersService.findOne(id);
    this.ensureBackofficeUser(user);
    return user;
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Crear usuario" })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create({
      ...dto,
      roles: this.resolveRoles(dto.roles)
    });
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Actualizar usuario" })
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    const payload: UpdateUserDto = { ...dto };
    if (dto.roles) {
      payload.roles = this.resolveRoles(dto.roles);
    }
    const updated = await this.usersService.update(id, payload);
    this.ensureBackofficeUser(updated);
    return updated;
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Eliminar usuario" })
  async remove(@Param("id") id: string) {
    const user = await this.usersService.findOne(id);
    this.ensureBackofficeUser(user);
    await this.usersService.remove(id);
    return { success: true };
  }

  @Post(":id/reset-password")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Resetear contraseña" })
  async resetPassword(@Param("id") id: string, @Body() dto: ResetPasswordDto) {
    const user = await this.usersService.findOne(id);
    this.ensureBackofficeUser(user);
    await this.usersService.update(id, { password: dto.password });
    return { success: true };
  }

  private resolveRoles(input?: UserRole[]) {
    const roles = (input ?? [UserRole.STAFF]).filter((role) => BACKOFFICE_ROLES.includes(role));
    return roles.length ? roles : [UserRole.STAFF];
  }

  private ensureBackofficeUser(user: User) {
    const allowed = user.roles?.some((role) => BACKOFFICE_ROLES.includes(role));
    if (!allowed) {
      throw new NotFoundException("Backoffice user not found");
    }
  }
}
