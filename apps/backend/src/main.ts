import "reflect-metadata";

import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Saloom API")
    .setDescription(
      "API REST para la plataforma Saloom. Soporta tres audiencias: **user** (usuarios finales), **client** (profesionales/dueños) y **backoffice** (administradores y staff)."
    )
    .setVersion("1.0.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "access-token")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: { persistAuthorization: true }
  });

  await app.listen(port);
  logger.log(`Backend (NestJS) listo en http://localhost:${port}`);
  logger.log(`Swagger UI disponible en http://localhost:${port}/api/docs`);
  return app;
}

if (require.main === module) {
  bootstrap();
}
