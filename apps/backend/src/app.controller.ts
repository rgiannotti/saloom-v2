import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { AppService } from "./app.service";
import { Public } from "./auth/decorators/public.decorator";

@ApiTags("Health")
@Controller("health")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Health check" })
  getHealth() {
    return this.appService.healthCheck();
  }
}
