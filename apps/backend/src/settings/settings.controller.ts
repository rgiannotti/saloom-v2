import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";
import { UpdateFtpSettingsDto, UpdateSettingsDto } from "./dto/update-settings.dto";
import { SettingsService } from "./settings.service";

@ApiTags("Backoffice – Settings")
@ApiBearerAuth("access-token")
@Controller("settings")
@Roles(UserRole.ADMIN)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: "Obtener configuración del sistema" })
  get() {
    return this.settingsService.get();
  }

  @Post("ftp/test")
  @ApiOperation({ summary: "Verificar conectividad FTP con las credenciales proporcionadas" })
  testFtp(@Body() dto: UpdateFtpSettingsDto) {
    return this.settingsService.testFtp(dto);
  }

  @Patch()
  @ApiOperation({ summary: "Actualizar configuración del sistema" })
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
