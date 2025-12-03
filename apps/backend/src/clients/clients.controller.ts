import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import * as fs from "fs";

import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";

import { ClientsService } from "./clients.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";

@Controller("backoffice/clients")
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Get()
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.clientsService.remove(id);
    return { success: true };
  }

  @Post(":id/logo")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (_req: any, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
          const uploadPath = join(process.cwd(), "uploads", "logos");
          fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          const safeSlug = typeof req.params?.id === "string" ? req.params.id : "logo";
          cb(null, `${safeSlug}${extname(file.originalname)}`);
        }
      })
    })
  )
  async uploadLogo(@Param("id") id: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      return { success: false, message: "No file uploaded" };
    }
    const clientData = await this.clientsService.findOne(id);
    const slugBase = (clientData.slug || id || "logo")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-");
    const ext = extname(file.originalname) || extname(file.filename);
    const filename = `${slugBase}${ext}`;
    const uploadDir = join(process.cwd(), "uploads", "logos");
    const currentPath = join(uploadDir, file.filename);
    const targetPath = join(uploadDir, filename);
    try {
      if (currentPath !== targetPath) {
        fs.renameSync(currentPath, targetPath);
      }
    } catch {
      // fallback: keep current filename if rename fails
    }
    const publicPath = `/uploads/logos/${filename}`;
    const client = await this.clientsService.updateLogo(id, publicPath);
    return { success: true, logo: client.logo };
  }
}
