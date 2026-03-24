import { Controller, Get, ParseFloatPipe, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";

import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";
import { ClientsService } from "./clients.service";

@ApiTags("App – Recommendations")
@ApiBearerAuth("access-token")
@Controller("app/recommendations")
@Roles(UserRole.USER)
export class AppRecommendationsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  getRecommended(
    @Query("lat", ParseFloatPipe) lat: number,
    @Query("lng", ParseFloatPipe) lng: number,
    @Query("radiusKm") radiusKm?: string,
    @Query("limit") limit?: string
  ) {
    const radiusValue = Number(radiusKm);
    const limitValue = Number(limit);
    const safeRadius = Number.isFinite(radiusValue) && radiusValue > 0 ? radiusValue : 10;
    const safeLimit =
      Number.isFinite(limitValue) && limitValue > 0 ? Math.min(limitValue, 20) : 10;
    return this.clientsService.findRecommendedNearby(lat, lng, safeRadius, safeLimit);
  }
}
