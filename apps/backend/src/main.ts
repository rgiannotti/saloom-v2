import "reflect-metadata";

import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

const logger = new Logger("Bootstrap");

export async function bootstrap(port = Number(process.env.PORT ?? 3000)) {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ["http://localhost:5173"],
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
