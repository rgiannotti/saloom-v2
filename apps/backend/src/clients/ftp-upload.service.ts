import { Injectable } from "@nestjs/common";
import * as ftp from "basic-ftp";
import * as fs from "fs";

import { SettingsService } from "../settings/settings.service";

@Injectable()
export class FtpUploadService {
  constructor(private readonly settingsService: SettingsService) {}

  async upload(localFilePath: string, remoteFilename: string, subPath = ""): Promise<string> {
    const settings = await this.settingsService.get();
    const ftpConfig = settings.ftp as any;

    if (!ftpConfig?.host) {
      throw new Error("FTP no configurado. Configura el servidor en Ajustes.");
    }

    const client = new ftp.Client(10000);
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

      const remoteDirBase = (ftpConfig.remotePath ?? "").replace(/\/$/, "");
      const remoteDir = subPath ? `${remoteDirBase}/${subPath}` : remoteDirBase;

      await client.ensureDir(remoteDir);
      await client.uploadFrom(localFilePath, `${remoteDir}/${remoteFilename}`);

      const publicBase = ftpConfig.publicDomain
        ? ftpConfig.publicDomain.replace(/\/$/, "")
        : `https://${ftpConfig.host}`;
      const publicPath = subPath ? `/${subPath}/${remoteFilename}` : `/${remoteFilename}`;
      return `${publicBase}${publicPath}`;
    } finally {
      client.close();
      try {
        fs.unlinkSync(localFilePath);
      } catch {
        // temp file cleanup is best-effort
      }
    }
  }
}
