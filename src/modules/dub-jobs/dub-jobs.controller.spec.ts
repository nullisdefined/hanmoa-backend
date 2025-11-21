import { Test, TestingModule } from '@nestjs/testing';
import { DubJobsController } from './dub-jobs.controller';
import { DubJobsService } from './dub-jobs.service';

describe('DubJobsController', () => {
  let controller: DubJobsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DubJobsController],
      providers: [DubJobsService],
    }).compile();

    controller = module.get<DubJobsController>(DubJobsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
