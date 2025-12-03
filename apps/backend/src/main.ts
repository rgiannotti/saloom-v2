import "reflect-metadata";

import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";

import { AppModule } from "./app.module";

const logger = new Logger("Bootstrap");

export async function bootstrap(port = Number(process.env.PORT ?? 3000)) {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), "uploads"), {
    prefix: "/uploads"
  });
  app.enableCors({
    origin: true,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  await app.listen(port);
  logger.log(`Backend (NestJS) listo en http://localhost:${port}`);
  return app;
}

if (require.main === module) {
  bootstrap();
}
