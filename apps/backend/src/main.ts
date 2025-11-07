import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

const logger = new Logger("Bootstrap");

export async function bootstrap(port = Number(process.env.PORT ?? 3000)) {
  const app = await NestFactory.create(AppModule);
  await app.listen(port);
  logger.log(`Backend (NestJS) listo en http://localhost:${port}`);
  return app;
}

if (require.main === module) {
  bootstrap();
}
