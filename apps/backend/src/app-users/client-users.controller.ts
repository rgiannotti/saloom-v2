import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { FilterQuery, Types } from "mongoose";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserDocument, UserRole } from "../users/schemas/user.schema";
import { UsersService } from "../users/users.service";

import { CreateClientUserDto } from "./dto/create-client-user.dto";
import { UpdateClientUserDto } from "./dto/update-client-user.dto";

@ApiTags("Client – Users")
@ApiBearerAuth("access-token")
@Controller("client/users")
@Roles(UserRole.PRO, UserRole.OWNER)
export class ClientUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: "Listar usuarios del cliente autenticado" })
  @ApiQuery({ name: "search", required: false, description: "Buscar por nombre, email o teléfono" })
  findAll(
    @CurrentUser("client") clientId: string | undefined,
    @Query("search") search?: string
  ) {
    if (!clientId) {
      throw new ForbiddenException("El usuario no está asociado a un cliente");
    }
    const filter: FilterQuery<UserDocument> = {
      $or: [{ client: clientId }, { client: new Types.ObjectId(clientId) }],
      roles: UserRole.USER
    };
    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }
    return this.usersService.findAll(filter, { sort: { createdAt: -1 } });
  }

  @Post()
  @ApiOperation({ summary: "Crear usuario del cliente" })
  create(
    @CurrentUser("client") clientId: string | undefined,
    @Body() dto: CreateClientUserDto
  ) {
    if (!clientId) {
      throw new ForbiddenException("El usuario no está asociado a un cliente");
    }
    return this.usersService.create({
      ...dto,
      roles: [UserRole.USER],
      client: clientId
    });
  }

  @Patch(":userId")
  @ApiOperation({ summary: "Actualizar usuario del cliente" })
  async update(
    @Param("userId") userId: string,
    @CurrentUser("client") clientId: string | undefined,
    @Body() dto: UpdateClientUserDto
  ) {
    if (!clientId) {
      throw new ForbiddenException("El usuario no está asociado a un cliente");
    }
    const user = await this.usersService.findOne(userId);
    if (!user.client || user.client.toString() !== clientId.toString()) {
      throw new ForbiddenException("No puedes modificar este usuario");
    }
    return this.usersService.update(userId, {
      ...dto,
      roles: [UserRole.USER],
      client: clientId
    });
  }

  @Delete(":userId")
  @ApiOperation({ summary: "Eliminar usuario del cliente" })
  async remove(
    @Param("userId") userId: string,
    @CurrentUser("client") clientId: string | undefined
  ) {
    if (!clientId) {
      throw new ForbiddenException("El usuario no está asociado a un cliente");
    }
    const user = await this.usersService.findOne(userId);
    if (!user.client || user.client.toString() !== clientId.toString()) {
      throw new ForbiddenException("No puedes eliminar este usuario");
    }
    await this.usersService.remove(userId);
    return { success: true };
  }
}
