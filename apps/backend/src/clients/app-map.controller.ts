import { Controller, Get, ParseFloatPipe, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";
import { ClientsService } from "./clients.service";

@ApiTags("App – Map")
@ApiBearerAuth("access-token")
@Controller("app/map")
@Roles(UserRole.USER)
export class AppMapController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get("clients")
  @ApiOperation({ summary: "Tiendas visibles en el área del mapa" })
  getClientsInBounds(
    @Query("minLat", ParseFloatPipe) minLat: number,
    @Query("maxLat", ParseFloatPipe) maxLat: number,
    @Query("minLng", ParseFloatPipe) minLng: number,
    @Query("maxLng", ParseFloatPipe) maxLng: number
  ) {
    return this.clientsService.findInBounds(minLat, maxLat, minLng, maxLng);
  }
}
