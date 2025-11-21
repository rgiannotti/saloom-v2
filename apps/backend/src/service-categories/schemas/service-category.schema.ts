import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ServiceCategoryDocument = ServiceCategory & Document;

@Schema({
  timestamps: true
})
export class ServiceCategory {
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @Prop({ default: "", trim: true })
  description: string;

  @Prop({ default: 0, min: 0 })
  order: number;

  @Prop({ default: true })
  active: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const ServiceCategorySchema = SchemaFactory.createForClass(ServiceCategory);
