import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DubJobsService } from './dub-jobs.service';
import { DubJob, DubJobStatus } from '../../entities/dub-job.entity';
import { VideoAsset } from '../../entities/video-asset.entity';
import { SegmentStatus } from '../../entities/segment.entity';
import { StepStatus } from '../../entities/job-step.entity';

describe('DubJobsService', () => {
  let service: DubJobsService;
  let dubJobRepository: Repository<DubJob>;

  const mockVideoAsset: Partial<VideoAsset> = {
    uuid: 'video-asset-uuid',
    projectId: 'project-uuid',
    s3Key: 's3://bucket/video.mp4',
    srcLang: 'ko',
    dstLang: 'en',
    durationSec: 120,
  };

  const mockDubJob: Partial<DubJob> = {
    uuid: 'dub-job-uuid',
    projectId: 'project-uuid',
    videoAssetId: 'video-asset-uuid',
    srcLang: 'ko',
    dstLang: 'en',
    status: DubJobStatus.PENDING,
    totalDurationMs: 120000,
    project: { userId: 'user-uuid-123' } as any,
    segments: [],
    steps: [],
  };

  const mockDubJobRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DubJobsService,
        {
          provide: getRepositoryToken(DubJob),
          useValue: mockDubJobRepository,
        },
      ],
    }).compile();

    service = module.get<DubJobsService>(DubJobsService);
    dubJobRepository = module.get<Repository<DubJob>>(
      getRepositoryToken(DubJob),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFromVideoAsset', () => {
    it('should create a dub job from video asset', async () => {
      const createdJob = { ...mockDubJob, uuid: 'new-job-uuid' };
      mockDubJobRepository.create.mockReturnValue(createdJob);
      mockDubJobRepository.save.mockResolvedValue(createdJob);
      mockDubJobRepository.findOne.mockResolvedValue({
        ...createdJob,
        videoAsset: mockVideoAsset,
      });

      const result = await service.createFromVideoAsset(
        mockVideoAsset as VideoAsset,
      );

      expect(dubJobRepository.create).toHaveBeenCalledWith({
        projectId: mockVideoAsset.projectId,
        videoAssetId: mockVideoAsset.uuid,
        srcLang: mockVideoAsset.srcLang,
        dstLang: mockVideoAsset.dstLang,
        status: DubJobStatus.PENDING,
        totalDurationMs: mockVideoAsset.durationSec * 1000,
        metadata: {
          createdFrom: 'video-upload',
          videoS3Key: mockVideoAsset.s3Key,
        },
      });
      expect(dubJobRepository.save).toHaveBeenCalled();
      expect(result.videoAsset).toBeDefined();
    });

    it('should handle video asset without duration', async () => {
      const videoAssetNoDuration = { ...mockVideoAsset, durationSec: null };
      const createdJob = { ...mockDubJob, totalDurationMs: null };

      mockDubJobRepository.create.mockReturnValue(createdJob);
      mockDubJobRepository.save.mockResolvedValue(createdJob);
      mockDubJobRepository.findOne.mockResolvedValue(createdJob);

      await service.createFromVideoAsset(videoAssetNoDuration as VideoAsset);

      expect(dubJobRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totalDurationMs: null,
        }),
      );
    });

    it('should include relations when fetching created job', async () => {
      mockDubJobRepository.create.mockReturnValue(mockDubJob);
      mockDubJobRepository.save.mockResolvedValue(mockDubJob);
      mockDubJobRepository.findOne.mockResolvedValue(mockDubJob);

      await service.createFromVideoAsset(mockVideoAsset as VideoAsset);

      expect(dubJobRepository.findOne).toHaveBeenCalledWith({
        where: { uuid: mockDubJob.uuid },
        relations: ['videoAsset'],
      });
    });
  });

  describe('findPendingJobs', () => {
    it('should return pending jobs with default limit', async () => {
      const pendingJobs = [mockDubJob, { ...mockDubJob, uuid: 'job-2' }];
      mockDubJobRepository.find.mockResolvedValue(pendingJobs);

      const result = await service.findPendingJobs();

      expect(dubJobRepository.find).toHaveBeenCalledWith({
        where: { status: DubJobStatus.PENDING },
        relations: ['videoAsset', 'project'],
        order: { createdAt: 'ASC' },
        take: 10,
      });
      expect(result).toEqual(pendingJobs);
    });

    it('should return pending jobs with custom limit', async () => {
      mockDubJobRepository.find.mockResolvedValue([mockDubJob]);

      await service.findPendingJobs(5);

      expect(dubJobRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });

    it('should return empty array when no pending jobs exist', async () => {
      mockDubJobRepository.find.mockResolvedValue([]);

      const result = await service.findPendingJobs();

      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update job status successfully', async () => {
      const updatedJob = { ...mockDubJob, status: DubJobStatus.PROCESSING };
      mockDubJobRepository.findOne.mockResolvedValue(mockDubJob);
      mockDubJobRepository.save.mockResolvedValue(updatedJob);

      const result = await service.updateStatus(
        'dub-job-uuid',
        DubJobStatus.PROCESSING,
      );

      expect(dubJobRepository.findOne).toHaveBeenCalledWith({
        where: { uuid: 'dub-job-uuid' },
      });
      expect(result.status).toBe(DubJobStatus.PROCESSING);
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockDubJobRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('non-existent-uuid', DubJobStatus.COMPLETED),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update to COMPLETED status', async () => {
      const completedJob = { ...mockDubJob, status: DubJobStatus.COMPLETED };
      mockDubJobRepository.findOne.mockResolvedValue(mockDubJob);
      mockDubJobRepository.save.mockResolvedValue(completedJob);

      const result = await service.updateStatus(
        'dub-job-uuid',
        DubJobStatus.COMPLETED,
      );

      expect(result.status).toBe(DubJobStatus.COMPLETED);
    });

    it('should update to FAILED status', async () => {
      const failedJob = { ...mockDubJob, status: DubJobStatus.FAILED };
      mockDubJobRepository.findOne.mockResolvedValue(mockDubJob);
      mockDubJobRepository.save.mockResolvedValue(failedJob);

      const result = await service.updateStatus(
        'dub-job-uuid',
        DubJobStatus.FAILED,
      );

      expect(result.status).toBe(DubJobStatus.FAILED);
    });
  });

  describe('findOne', () => {
    it('should return job with all relations', async () => {
      const jobWithRelations = {
        ...mockDubJob,
        segments: [{ uuid: 'segment-1' }],
        speakers: [{ uuid: 'speaker-1' }],
        outputs: [{ uuid: 'output-1' }],
        steps: [{ uuid: 'step-1' }],
      };
      mockDubJobRepository.findOne.mockResolvedValue(jobWithRelations);

      const result = await service.findOne('dub-job-uuid');

      expect(dubJobRepository.findOne).toHaveBeenCalledWith({
        where: { uuid: 'dub-job-uuid' },
        relations: [
          'videoAsset',
          'project',
          'segments',
          'segments.speaker',
          'speakers',
          'outputs',
          'steps',
        ],
      });
      expect(result).toEqual(jobWithRelations);
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockDubJobRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOneWithAuth', () => {
    it('should return job for authorized user', async () => {
      mockDubJobRepository.findOne.mockResolvedValue(mockDubJob);

      const result = await service.findOneWithAuth(
        'user-uuid-123',
        'dub-job-uuid',
      );

      expect(result).toEqual(mockDubJob);
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockDubJobRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOneWithAuth('user-uuid-123', 'non-existent-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized user', async () => {
      mockDubJobRepository.findOne.mockResolvedValue(mockDubJob);

      await expect(
        service.findOneWithAuth('different-user-uuid', 'dub-job-uuid'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getJobStatus', () => {
    it('should return job status with progress calculation', async () => {
      const jobWithSegments = {
        ...mockDubJob,
        segments: [
          { status: SegmentStatus.DUBBED },
          { status: SegmentStatus.APPROVED },
          { status: SegmentStatus.PENDING },
          { status: SegmentStatus.TRANSLATED },
        ],
        steps: [
          { type: 'STT', status: StepStatus.COMPLETED, stepOrder: 1 },
          { type: 'TRANSLATION', status: StepStatus.IN_PROGRESS, stepOrder: 2 },
        ],
      };
      mockDubJobRepository.findOne.mockResolvedValue(jobWithSegments);

      const result = await service.getJobStatus(
        'user-uuid-123',
        'dub-job-uuid',
      );

      expect(result.progress).toBe(50); // 2 out of 4 completed
      expect(result.totalSegments).toBe(4);
      expect(result.completedSegments).toBe(2);
      expect(result.currentStep).toEqual({
        type: 'TRANSLATION',
        status: StepStatus.IN_PROGRESS,
        stepOrder: 2,
      });
    });

    it('should return 0 progress when no segments exist', async () => {
      const jobWithoutSegments = { ...mockDubJob, segments: [], steps: [] };
      mockDubJobRepository.findOne.mockResolvedValue(jobWithoutSegments);

      const result = await service.getJobStatus(
        'user-uuid-123',
        'dub-job-uuid',
      );

      expect(result.progress).toBe(0);
      expect(result.totalSegments).toBe(0);
      expect(result.completedSegments).toBe(0);
    });

    it('should return null currentStep when no steps are in progress', async () => {
      const jobWithCompletedSteps = {
        ...mockDubJob,
        segments: [],
        steps: [{ type: 'STT', status: StepStatus.COMPLETED, stepOrder: 1 }],
      };
      mockDubJobRepository.findOne.mockResolvedValue(jobWithCompletedSteps);

      const result = await service.getJobStatus(
        'user-uuid-123',
        'dub-job-uuid',
      );

      expect(result.currentStep).toBeNull();
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockDubJobRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getJobStatus('user-uuid-123', 'non-existent-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized user', async () => {
      mockDubJobRepository.findOne.mockResolvedValue(mockDubJob);

      await expect(
        service.getJobStatus('different-user-uuid', 'dub-job-uuid'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
