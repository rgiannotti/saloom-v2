import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

import { ServiceCategory } from "../../service-categories/schemas/service-category.schema";

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

  @Prop({ type: Types.ObjectId, ref: ServiceCategory.name, default: null })
  category?: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
