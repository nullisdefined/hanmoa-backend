import { Test, TestingModule } from '@nestjs/testing';
import { DubJobsService } from './dub-jobs.service';

describe('DubJobsService', () => {
  let service: DubJobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DubJobsService],
    }).compile();

    service = module.get<DubJobsService>(DubJobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
