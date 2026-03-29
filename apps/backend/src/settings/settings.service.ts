import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as ftp from "basic-ftp";
import { Model } from "mongoose";

import { UpdateFtpSettingsDto, UpdateSettingsDto } from "./dto/update-settings.dto";
import { Settings, SettingsDocument } from "./schemas/settings.schema";

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Settings.name)
    private readonly settingsModel: Model<SettingsDocument>
  ) {}

  async get(): Promise<Settings> {
    const settings = await this.settingsModel.findOne().lean().exec();
    if (settings) return settings;
    return this.settingsModel.create({});
  }

  async testFtp(ftpConfig: UpdateFtpSettingsDto): Promise<{ ok: boolean; message: string }> {
    const client = new ftp.Client(5000);
    client.ftp.verbose = false;
    try {
      await client.access({
        host: ftpConfig.host,
        port: ftpConfig.port ?? 21,
        user: ftpConfig.username,
        password: ftpConfig.password,
        secure: ftpConfig.secure ?? false,
        secureOptions: { rejectUnauthorized: false }
      });
      return { ok: true, message: "Conexión FTP exitosa" };
    } catch (err) {
      return { ok: false, message: (err as Error).message ?? "Error al conectar" };
    } finally {
      client.close();
    }
  }

  async update(dto: UpdateSettingsDto): Promise<Settings> {
    const update: Record<string, unknown> = {};
    if (dto.ftp) {
      for (const [key, value] of Object.entries(dto.ftp)) {
        if (value !== undefined) {
          update[`ftp.${key}`] = value;
        }
      }
    }
    const settings = await this.settingsModel
      .findOneAndUpdate({}, { $set: update }, { new: true, upsert: true, runValidators: true })
      .lean()
      .exec();
    return settings!;
  }
}
