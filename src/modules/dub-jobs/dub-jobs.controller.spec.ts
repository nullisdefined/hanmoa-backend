import { Test, TestingModule } from '@nestjs/testing';
import { DubJobsController } from './dub-jobs.controller';
import { DubJobsService } from './dub-jobs.service';

describe('DubJobsController', () => {
  let controller: DubJobsController;

  const mockDubJobsService = {
    findOne: jest.fn(),
    findOneWithAuth: jest.fn(),
    getJobStatus: jest.fn(),
    findPendingJobs: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DubJobsController],
      providers: [
        {
          provide: DubJobsService,
          useValue: mockDubJobsService,
        },
      ],
    }).compile();

    controller = module.get<DubJobsController>(DubJobsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
