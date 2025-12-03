declare module "multer" {
  export interface DiskStorageOptions {
    destination?: (
      req: any,
      file: Express.Multer.File,
      callback: (error: Error | null, destination: string) => void
    ) => void;
    filename?: (
      req: any,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void
    ) => void;
  }

  export function diskStorage(options: DiskStorageOptions): any;
}

declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    }
  }
}
