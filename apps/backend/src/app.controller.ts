import { Controller, Get } from "@nestjs/common";

import { AppService } from "./app.service";
import { Public } from "./auth/decorators/public.decorator";

@Controller("health")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHealth() {
    return this.appService.healthCheck();
  }
}
