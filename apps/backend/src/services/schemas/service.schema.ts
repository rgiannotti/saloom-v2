import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ServiceDocument = Service & Document;

@Schema({
  timestamps: true
})
export class Service {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: "", trim: true })
  notes: string;

  @Prop({ default: 0, min: 0 })
  order: number;

  @Prop({ default: false })
  home: boolean;

  @Prop({ default: true })
  active: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
