export type ProfessionalServiceOption = {
  _id: string;
  name: string;
  price?: number;
  slot?: number;
};

export type ProfessionalSchedule = {
  day: string;
  start: string;
  end: string;
};

export type ProfessionalOption = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  services: ProfessionalServiceOption[];
  schedule?: ProfessionalSchedule[];
};

export type ClientPlace = {
  address?: {
    full?: string;
    street?: string;
    number?: string;
    province?: string;
    comunity?: string;
    city?: string;
    postal?: string;
    placeId?: string;
  };
  location: {
    type: "Point";
    coordinates: number[];
  };
};

export type CustomerOption = {
  _id: string;
  name: string;
  email: string;
  phone: string;
};
