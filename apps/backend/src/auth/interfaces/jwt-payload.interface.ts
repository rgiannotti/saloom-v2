import { UserRole } from "../../users/schemas/user.schema";
import { AppAudience } from "../enums/app-audience.enum";

export interface JwtPayload {
  sub: string;
  email: string;
  roles: UserRole[];
  aud: AppAudience;
  client?: string | null;
}
