import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

import { Service } from "../../services/schemas/service.schema";
import { User } from "../../users/schemas/user.schema";

export type ClientDocument = Client & Document;

@Schema({ _id: false })
export class Address {
  @Prop({ default: "" })
  full: string;

  @Prop({ default: "" })
  street: string;

  @Prop({ default: "" })
  number: string;

  @Prop({ default: "" })
  comunity: string;

  @Prop({ default: "" })
  province: string;

  @Prop({ default: "" })
  city: string;

  @Prop({ default: "" })
  postal: string;

  @Prop({ default: "" })
  placeId: string;
}

const AddressSchema = SchemaFactory.createForClass(Address);

@Schema({ _id: false })
export class Location {
  @Prop({ default: "Point" })
  type: string;

  @Prop({ type: [Number], default: [0, 0] })
  coordinates: number[];
}

const LocationSchema = SchemaFactory.createForClass(Location);

@Schema({ _id: false })
export class ProfessionalService {
  @Prop({ type: Types.ObjectId, ref: Service.name, required: true })
  service: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 1 })
  slot: number;
}

const ProfessionalServiceSchema = SchemaFactory.createForClass(ProfessionalService);

@Schema({ _id: false })
export class ProfessionalWorkDay {
  @Prop({ required: true })
  day: string; // e.g. monday, tuesday

  @Prop({ required: true })
  start: string; // HH:mm

  @Prop({ required: true })
  end: string; // HH:mm
}

const ProfessionalWorkDaySchema = SchemaFactory.createForClass(ProfessionalWorkDay);

@Schema({ _id: false })
export class ClientProfessional {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  professional: Types.ObjectId;

  @Prop({ type: [ProfessionalServiceSchema], default: [] })
  services: ProfessionalService[];

  @Prop({ type: [ProfessionalWorkDaySchema], default: [] })
  schedule: ProfessionalWorkDay[];
}

const ClientProfessionalSchema = SchemaFactory.createForClass(ClientProfessional);

@Schema({
  timestamps: true
})
export class Client {
  @Prop({ unique: true })
  code: number;

  @Prop({ required: true, unique: true, trim: true })
  rif: string;

  @Prop({ required: true, trim: true })
  denomination: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  person: string;

  @Prop({ default: "", trim: true })
  website: string;

  @Prop({ default: false })
  useGoogleMap: boolean;

  @Prop({ type: AddressSchema, required: true })
  address: Address;

  @Prop({ type: LocationSchema, required: true })
  location: Location;

  @Prop({ default: "", trim: true })
  baddress: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ default: false })
  home: boolean;

  @Prop({ default: false })
  online: boolean;

  @Prop({ default: false })
  onlineHome: boolean;

  @Prop({ default: false })
  blocked: boolean;

  @Prop({ default: true })
  active: boolean;

  @Prop({ type: [String], default: [] })
  payments: string[];

  @Prop({ type: [ClientProfessionalSchema], default: [] })
  professionals: ClientProfessional[];

  createdAt: Date;
  updatedAt: Date;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
