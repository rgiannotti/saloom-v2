import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type SettingsDocument = Settings & Document;

@Schema({ _id: false })
export class FtpSettings {
  @Prop({ default: "", trim: true })
  host: string;

  @Prop({ default: 21 })
  port: number;

  @Prop({ default: "", trim: true })
  username: string;

  @Prop({ default: "", trim: true })
  password: string;

  @Prop({ default: "", trim: true })
  remotePath: string;

  @Prop({ default: true })
  passive: boolean;

  @Prop({ default: false })
  secure: boolean;

  @Prop({ default: "", trim: true })
  publicDomain: string;
}

@Schema({ timestamps: true })
export class Settings {
  @Prop({ type: FtpSettings, default: () => ({}) })
  ftp: FtpSettings;

  createdAt: Date;
  updatedAt: Date;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
