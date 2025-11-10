import { SetMetadata } from "@nestjs/common";

import { UserRole } from "../../users/schemas/user.schema";
import { ROLES_KEY } from "../constants";

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
