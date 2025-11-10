import { Body, Controller, Param, ParseEnumPipe, Post } from "@nestjs/common";

import { AuthService } from "./auth.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Public } from "./decorators/public.decorator";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { AppAudience } from "./enums/app-audience.enum";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post(":audience/register")
  register(
    @Param("audience", new ParseEnumPipe(AppAudience)) audience: AppAudience,
    @Body() dto: RegisterDto
  ) {
    return this.authService.register(dto, audience);
  }

  @Public()
  @Post(":audience/login")
  login(
    @Param("audience", new ParseEnumPipe(AppAudience)) audience: AppAudience,
    @Body() dto: LoginDto
  ) {
    return this.authService.login(dto, audience);
  }

  @Public()
  @Post("refresh")
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.userId, dto.refreshToken);
  }

  @Post("logout")
  async logout(@CurrentUser("sub") userId: string) {
    await this.authService.logout(userId);
    return { success: true };
  }
}
