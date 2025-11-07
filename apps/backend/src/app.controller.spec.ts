import { Test, TestingModule } from "@nestjs/testing";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  let controller: AppController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService]
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it("returns a healthy status", () => {
    const result = controller.getHealth();
    expect(result.status).toBe("ok");
    expect(result.timestamp).toBeDefined();
  });
});
