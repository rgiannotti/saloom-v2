import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { Types } from "mongoose";

import { User, UserRole } from "../users/schemas/user.schema";
import { UsersService } from "../users/users.service";

import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AppAudience } from "./enums/app-audience.enum";
import { JwtPayload } from "./interfaces/jwt-payload.interface";

type UserWithId = User & { _id?: Types.ObjectId | string; id?: string };

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    configService: ConfigService
  ) {
    this.accessSecret = configService.get<string>("JWT_ACCESS_SECRET") ?? "saloom_access_secret";
    this.refreshSecret = configService.get<string>("JWT_REFRESH_SECRET") ?? "saloom_refresh_secret";
  }

  async register(registerDto: RegisterDto, audience: AppAudience) {
    const roles = this.rolesForAudience(audience);
    const user = await this.usersService.create({ ...registerDto, roles });
    return this.issueTokens(user, audience);
  }

  async login(loginDto: LoginDto, audience: AppAudience) {
    const userDoc = await this.usersService.findByEmail(loginDto.email, true);
    if (!userDoc?.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const passwordValid = await bcrypt.compare(loginDto.password, userDoc.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const userId = this.extractUserId(userDoc as UserWithId);
    const user = await this.usersService.findOne(userId);
    this.ensureAudiencePermission(user, audience);
    return this.issueTokens(user, audience);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.refreshSecret
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    if (payload.sub !== userId) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const userDoc = await this.usersService.findOne(userId);
    const userWithSecrets = await this.usersService.findByEmail(userDoc.email, true);
    if (!userWithSecrets?.refreshTokenHash) {
      throw new UnauthorizedException("Refresh token missing");
    }
    const isValid = await bcrypt.compare(refreshToken, userWithSecrets.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException("Refresh token invalid");
    }
    this.ensureAudiencePermission(userDoc, payload.aud);
    return this.issueTokens(userDoc, payload.aud);
  }

  async logout(userId: string) {
    await this.usersService.removeRefreshToken(userId);
  }

  private async issueTokens(user: User, audience: AppAudience) {
    const payload: JwtPayload = {
      sub: this.extractUserId(user as UserWithId),
      email: user.email,
      roles: user.roles,
      aud: audience
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.accessSecret,
        expiresIn: "15m"
      }),
      this.jwtService.signAsync(payload, {
        secret: this.refreshSecret,
        expiresIn: "7d"
      })
    ]);

    await this.usersService.setRefreshToken(payload.sub, refreshToken);

    return {
      user,
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  private rolesForAudience(audience: AppAudience): UserRole[] {
    switch (audience) {
      case AppAudience.CLIENT:
        return [UserRole.PRO];
      case AppAudience.BACKOFFICE:
        return [UserRole.ADMIN];
      case AppAudience.USER:
      default:
        return [UserRole.USER];
    }
  }

  private ensureAudiencePermission(user: User, audience: AppAudience) {
    const required = this.rolesForAudience(audience);
    const hasRole = required.some((role) => user.roles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException("Insufficient permissions for this audience");
    }
    if (audience === AppAudience.CLIENT && !user.client) {
      throw new ForbiddenException("Client app requires an assigned client");
    }
  }

  private extractUserId(user: UserWithId): string {
    const idValue = typeof user._id === "string" ? user._id : (user._id?.toString() ?? user.id);
    return idValue as string;
  }
}
