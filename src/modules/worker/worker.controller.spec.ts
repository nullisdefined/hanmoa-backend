import { Test, TestingModule } from '@nestjs/testing';
import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';
import { DubJobsService } from '../dub-jobs/dub-jobs.service';

describe('WorkerController', () => {
  let controller: WorkerController;

  const mockWorkerService = {
    saveSegments: jest.fn(),
    updateSegments: jest.fn(),
    saveSpeakers: jest.fn(),
    updateJobStep: jest.fn(),
  };

  const mockDubJobsService = {
    findPendingJobs: jest.fn(),
    updateStatus: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkerController],
      providers: [
        {
          provide: WorkerService,
          useValue: mockWorkerService,
        },
        {
          provide: DubJobsService,
          useValue: mockDubJobsService,
        },
      ],
    }).compile();

    controller = module.get<WorkerController>(WorkerController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
