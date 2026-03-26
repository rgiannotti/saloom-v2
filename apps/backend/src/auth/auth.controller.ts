import { Body, Controller, Param, ParseEnumPipe, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";

import { AuthService } from "./auth.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Public } from "./decorators/public.decorator";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { AppAudience } from "./enums/app-audience.enum";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post(":audience/register")
  @ApiOperation({ summary: "Registrar usuario" })
  @ApiParam({ name: "audience", enum: AppAudience })
  register(
    @Param("audience", new ParseEnumPipe(AppAudience)) audience: AppAudience,
    @Body() dto: RegisterDto
  ) {
    return this.authService.register(dto, audience);
  }

  @Public()
  @Post(":audience/login")
  @ApiOperation({ summary: "Iniciar sesión" })
  @ApiParam({ name: "audience", enum: AppAudience })
  login(
    @Param("audience", new ParseEnumPipe(AppAudience)) audience: AppAudience,
    @Body() dto: LoginDto
  ) {
    console.log("Login attempt for audience:", audience);
    return this.authService.login(dto, audience);
  }

  @Public()
  @Post("refresh")
  @ApiOperation({ summary: "Renovar access token" })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.userId, dto.refreshToken);
  }

  @Post("logout")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Cerrar sesión" })
  async logout(@CurrentUser("sub") userId: string) {
    await this.authService.logout(userId);
    return { success: true };
  }
}
