export type UserRole = "user" | "pro" | "owner" | "admin" | "staff";

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  roles: UserRole[];
  client?: string | null;
}
