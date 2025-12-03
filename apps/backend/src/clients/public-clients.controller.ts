import { Controller, Get, Param } from "@nestjs/common";

import { Public } from "../auth/decorators/public.decorator";
import { ClientsService } from "./clients.service";

@Controller("public/clients")
export class PublicClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get("logo/:slug")
  @Public()
  async getLogoBySlug(@Param("slug") slug: string) {
    // findBySlug está definido en el servicio; si el tipado no lo expone, forzamos el acceso
    const client = await (this.clientsService as any).findBySlug(slug);
    return { logo: client.logo ?? "" };
  }
}
