import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

import { Client } from "../../clients/schemas/client.schema";
import { Service } from "../../services/schemas/service.schema";
import { User } from "../../users/schemas/user.schema";

export type AppointmentDocument = Appointment & Document;

@Schema({ _id: false })
export class AppointmentServiceItem {
  @Prop({ type: Types.ObjectId, ref: Service.name, required: true })
  service: Types.ObjectId;

  @Prop({ type: Number, min: 0 })
  price?: number;
}

const AppointmentServiceItemSchema = SchemaFactory.createForClass(AppointmentServiceItem);

@Schema({ _id: false })
export class AppointmentStatusHistory {
  @Prop({ required: true, trim: true })
  status: string;

  @Prop({ type: Date, required: true, default: Date.now })
  date: Date;

  @Prop({ trim: true })
  comment?: string;
}

const AppointmentStatusHistorySchema = SchemaFactory.createForClass(AppointmentStatusHistory);

@Schema({ _id: false })
export class AppointmentPlaceAddress {
  @Prop({ default: "" })
  full: string;

  @Prop({ default: "" })
  street: string;

  @Prop({ default: "" })
  number: string;

  @Prop({ default: "" })
  province: string;

  @Prop({ default: "" })
  comunity: string;

  @Prop({ default: "" })
  city: string;

  @Prop({ default: "" })
  postal: string;

  @Prop({ default: "" })
  placeId: string;
}

const AppointmentPlaceAddressSchema = SchemaFactory.createForClass(AppointmentPlaceAddress);

@Schema({ _id: false })
export class AppointmentPlaceLocation {
  @Prop({ enum: ["Point"], default: "Point", required: true })
  type: string;

  @Prop({ type: [Number], required: true })
  coordinates: number[];
}

const AppointmentPlaceLocationSchema = SchemaFactory.createForClass(AppointmentPlaceLocation);

@Schema({ _id: false })
export class AppointmentPlace {
  @Prop({ type: AppointmentPlaceAddressSchema, default: () => ({}) })
  address: AppointmentPlaceAddress;

  @Prop({ type: AppointmentPlaceLocationSchema, required: true })
  location: AppointmentPlaceLocation;
}

const AppointmentPlaceSchema = SchemaFactory.createForClass(AppointmentPlace);

@Schema({
  timestamps: true
})
export class Appointment {
  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({ type: String, unique: true })
  code: string;

  @Prop({ type: [AppointmentServiceItemSchema], default: [] })
  services: AppointmentServiceItem[];

  @Prop({ type: Number, required: true, min: 1 })
  slots: number;

  @Prop({ type: Number, required: true, min: 0 })
  slotStart: number;

  @Prop({ type: Number, required: true, min: 0 })
  slotEnd: number;

  @Prop({ required: true })
  status: string;

  @Prop({ type: Number, min: 0 })
  amount?: number;

  @Prop({ default: "", trim: true })
  notes: string;

  @Prop({ type: Boolean, required: true, default: true })
  active: boolean;

  @Prop({ type: Types.ObjectId, ref: Client.name, required: true })
  client: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name })
  professional?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name })
  user?: Types.ObjectId;

  @Prop({ type: [AppointmentStatusHistorySchema], default: [] })
  statuses: AppointmentStatusHistory[];

  @Prop({ type: AppointmentPlaceSchema, required: true })
  place: AppointmentPlace;

  @Prop({ type: String, trim: true })
  type?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

AppointmentSchema.index({ "place.location": "2dsphere" });
