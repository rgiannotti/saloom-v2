import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import * as fs from "fs";

import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";

import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/schemas/user.schema";

import { ClientsService } from "./clients.service";
import { FtpUploadService } from "./ftp-upload.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";

@ApiTags("Backoffice – Clients")
@ApiBearerAuth("access-token")
@Controller("backoffice/clients")
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly ftpUploadService: FtpUploadService
  ) {}

  @Post()
  @ApiOperation({ summary: "Crear cliente" })
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar clientes" })
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener cliente por ID" })
  findOne(@Param("id") id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar cliente" })
  update(@Param("id") id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar cliente" })
  async remove(@Param("id") id: string) {
    await this.clientsService.remove(id);
    return { success: true };
  }

  @Post(":id/logo")
  @ApiOperation({ summary: "Subir logo del cliente" })
  @ApiConsumes("multipart/form-data")
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

  @Post(":id/cover")
  @ApiOperation({ summary: "Subir imagen de portada del cliente vía FTP" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (_req: any, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
          const tmp = join(process.cwd(), "uploads", "tmp");
          fs.mkdirSync(tmp, { recursive: true });
          cb(null, tmp);
        },
        filename: (_req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          cb(null, `cover-${Date.now()}${extname(file.originalname)}`);
        }
      })
    })
  )
  async uploadCover(@Param("id") id: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) return { success: false, message: "No file uploaded" };
    const clientData = await this.clientsService.findOne(id);
    const subPath = `clients/${clientData.slug || id}`;
    const url = await this.ftpUploadService.upload(file.path, file.filename, subPath);
    const client = await this.clientsService.updateCoverImage(id, url);
    return { success: true, coverImage: client.coverImage };
  }

  @Post(":id/gallery")
  @ApiOperation({ summary: "Agregar imagen a la galería del cliente vía FTP" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (_req: any, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
          const tmp = join(process.cwd(), "uploads", "tmp");
          fs.mkdirSync(tmp, { recursive: true });
          cb(null, tmp);
        },
        filename: (_req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          cb(null, `gallery-${Date.now()}${extname(file.originalname)}`);
        }
      })
    })
  )
  async addGalleryImage(@Param("id") id: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) return { success: false, message: "No file uploaded" };
    const clientData = await this.clientsService.findOne(id);
    const subPath = `clients/${clientData.slug || id}`;
    const url = await this.ftpUploadService.upload(file.path, file.filename, subPath);
    const client = await this.clientsService.addGalleryImage(id, url);
    return { success: true, gallery: client.gallery };
  }

  @Delete(":id/gallery/:index")
  @ApiOperation({ summary: "Eliminar imagen de la galería del cliente" })
  async removeGalleryImage(
    @Param("id") id: string,
    @Param("index", ParseIntPipe) index: number
  ) {
    const client = await this.clientsService.removeGalleryImage(id, index);
    return { success: true, gallery: client.gallery };
  }
}
