import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type UserDocument = User & Document;

export enum UserRole {
  USER = "user",
  PRO = "pro",
  OWNER = "owner",
  ADMIN = "admin",
  STAFF = "staff"
}

@Schema({
  timestamps: true
})
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: false, select: false })
  passwordHash?: string;

  @Prop({ type: [String], enum: UserRole, default: [UserRole.USER] })
  roles: UserRole[];

  @Prop({ type: String, select: false, default: null })
  refreshTokenHash?: string | null;

  @Prop({ type: Types.ObjectId, ref: "Client", default: null })
  client?: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
