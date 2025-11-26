import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { Segment, SegmentStatus } from '../../entities/segment.entity';
import { DubJob, DubJobStatus } from '../../entities/dub-job.entity';
import { Speaker } from '../../entities/speaker.entity';
import { JobStep, StepType, StepStatus } from '../../entities/job-step.entity';
import { SaveSegmentsDto } from './dto/save-segments.dto';
import { UpdateSegmentsDto } from './dto/update-segments.dto';
import { SaveSpeakersDto } from './dto/save-speakers.dto';
import { UpdateJobStepDto } from './dto/update-job-step.dto';

describe('WorkerService', () => {
  let service: WorkerService;
  let segmentRepository: Repository<Segment>;
  let dubJobRepository: Repository<DubJob>;
  let speakerRepository: Repository<Speaker>;
  let jobStepRepository: Repository<JobStep>;

  const mockDubJob: Partial<DubJob> = {
    uuid: 'dub-job-uuid',
    projectId: 'project-uuid',
    status: DubJobStatus.PROCESSING,
  };

  const mockSegmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockDubJobRepository = {
    findOne: jest.fn(),
  };

  const mockSpeakerRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJobStepRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkerService,
        {
          provide: getRepositoryToken(Segment),
          useValue: mockSegmentRepository,
        },
        {
          provide: getRepositoryToken(DubJob),
          useValue: mockDubJobRepository,
        },
        {
          provide: getRepositoryToken(Speaker),
          useValue: mockSpeakerRepository,
        },
        {
          provide: getRepositoryToken(JobStep),
          useValue: mockJobStepRepository,
        },
      ],
    }).compile();

    service = module.get<WorkerService>(WorkerService);
    segmentRepository = module.get<Repository<Segment>>(
      getRepositoryToken(Segment),
    );
    dubJobRepository = module.get<Repository<DubJob>>(
      getRepositoryToken(DubJob),
    );
    speakerRepository = module.get<Repository<Speaker>>(
      getRepositoryToken(Speaker),
    );
    jobStepRepository = module.get<Repository<JobStep>>(
      getRepositoryToken(JobStep),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveSegments', () => {
    it('should save segments successfully', async () => {
      const dto: SaveSegmentsDto = {
        segments: [
          {
            segmentIndex: 0,
            startMs: 0,
            endMs: 5000,
            videoSegmentS3Key: 's3://bucket/segment-0.mp4',
            audioSegmentS3Key: 's3://bucket/segment-0.mp3',
          },
          {
            segmentIndex: 1,
            startMs: 5000,
            endMs: 10000,
            videoSegmentS3Key: 's3://bucket/segment-1.mp4',
            audioSegmentS3Key: 's3://bucket/segment-1.mp3',
          },
        ],
      };

      const mockSegments = dto.segments.map((seg) => ({
        uuid: `segment-${seg.segmentIndex}`,
        dubJobId: 'dub-job-uuid',
        ...seg,
        status: SegmentStatus.PENDING,
        srcText: '',
      }));

      mockDubJobRepository.findOne.mockResolvedValue(mockDubJob);
      mockSegmentRepository.create.mockImplementation((data) => data);
      mockSegmentRepository.save.mockResolvedValue(mockSegments);

      const result = await service.saveSegments('dub-job-uuid', dto);

      expect(dubJobRepository.findOne).toHaveBeenCalledWith({
        where: { uuid: 'dub-job-uuid' },
      });
      expect(segmentRepository.create).toHaveBeenCalledTimes(2);
      expect(segmentRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockSegments);
    });

    it('should throw NotFoundException when DubJob does not exist', async () => {
      mockDubJobRepository.findOne.mockResolvedValue(null);

      const dto: SaveSegmentsDto = { segments: [] };

      await expect(
        service.saveSegments('non-existent-uuid', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create segments with correct initial status', async () => {
      const dto: SaveSegmentsDto = {
        segments: [
          {
            segmentIndex: 0,
            startMs: 0,
            endMs: 5000,
            videoSegmentS3Key: 's3://bucket/segment-0.mp4',
            audioSegmentS3Key: 's3://bucket/segment-0.mp3',
          },
        ],
      };

      mockDubJobRepository.findOne.mockResolvedValue(mockDubJob);
      mockSegmentRepository.create.mockImplementation((data) => data);
      mockSegmentRepository.save.mockResolvedValue([]);

      await service.saveSegments('dub-job-uuid', dto);

      expect(segmentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SegmentStatus.PENDING,
          srcText: '',
        }),
      );
    });
  });

  describe('updateSegments', () => {
    it('should update segments successfully', async () => {
      const dto: UpdateSegmentsDto = {
        segments: [
          {
            segmentId: 'segment-1',
            srcText: 'Original text',
            mtText: 'Translated text',
            status: SegmentStatus.TRANSLATED,
            speakerId: 'speaker-1',
          },
          {
            segmentId: 'segment-2',
            audioUrl: 'https://example.com/audio-2.mp3',
            status: SegmentStatus.DUBBED,
          },
        ],
      };

      const existingSegments = [
        {
          uuid: 'segment-1',
          dubJobId: 'dub-job-uuid',
          srcText: '',
          mtText: '',
          status: SegmentStatus.PENDING,
        },
        {
          uuid: 'segment-2',
          dubJobId: 'dub-job-uuid',
          srcText: 'Text',
          status: SegmentStatus.TRANSLATED,
        },
      ];

      mockDubJobRepository.findOne.mockResolvedValue(mockDubJob);
      mockSegmentRepository.find.mockResolvedValue(existingSegments);
      mockSegmentRepository.save.mockResolvedValue(existingSegments);

      await service.updateSegments('dub-job-uuid', dto);

      expect(dubJobRepository.findOne).toHaveBeenCalled();
      expect(segmentRepository.find).toHaveBeenCalledWith({
        where: {
          uuid: In(['segment-1', 'segment-2']),
          dubJobId: 'dub-job-uuid',
        },
      });
      expect(segmentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when DubJob does not exist', async () => {
      mockDubJobRepository.findOne.mockResolvedValue(null);

      const dto: UpdateSegmentsDto = { segments: [] };

      await expect(
        service.updateSegments('non-existent-uuid', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when segments are not found', async () => {
      const dto: UpdateSegmentsDto = {
        segments: [
          { segmentId: 'segment-1', srcText: 'Text' },
          { segmentId: 'segment-2', srcText: 'Text' },
        ],
      };

      mockDubJobRepository.findOne.mockResolvedValue(mockDubJob);
      mockSegmentRepository.find.mockResolvedValue([{ uuid: 'segment-1' }]); // Only one found

      await expect(service.updateSegments('dub-job-uuid', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should only update provided fields', async () => {
      const dto: UpdateSegmentsDto = {
        segments: [{ segmentId: 'segment-1', mtText: 'New translation' }],
      };

      const existingSegment = {
        uuid: 'segment-1',
        dubJobId: 'dub-job-uuid',
        srcText: 'Original',
        mtText: 'Old translation',
        status: SegmentStatus.PENDING,
      };

      mockDubJobRepository.findOne.mockResolvedValue(mockDubJob);
      mockSegmentRepository.find.mockResolvedValue([existingSegment]);
      mockSegmentRepository.save.mockImplementation((segments) =>
        Promise.resolve(segments),
      );

      await service.updateSegments('dub-job-uuid', dto);

      expect(mockSegmentRepository.save).toHaveBeenCalledWith([
        expect.objectContaining({
          srcText: 'Original', // Should not change
          mtText: 'New translation', // Should update
        }),
      ]);
    });
  });

  describe('saveSpeakers', () => {
    it('should save speakers successfully', async () => {
      const dto: SaveSpeakersDto = {
        speakers: [
          {
            speakerLabel: 'speaker-1',
            clonedVoiceId: 'voice-id-1',
            metadata: { gender: 'male' },
          },
          {
            speakerLabel: 'speaker-2',
            clonedVoiceId: 'voice-id-2',
            metadata: { gender: 'female' },
          },
        ],
      };

      const mockSpeakers = dto.speakers.map((spk, idx) => ({
        uuid: `speaker-uuid-${idx}`,
        dubJobId: 'dub-job-uuid',
        ...spk,
      }));

      mockDubJobRepository.findOne.mockResolvedValue(mockDubJob);
      mockSpeakerRepository.create.mockImplementation((data) => data);
      mockSpeakerRepository.save.mockResolvedValue(mockSpeakers);

      const result = await service.saveSpeakers('dub-job-uuid', dto);

      expect(dubJobRepository.findOne).toHaveBeenCalled();
      expect(speakerRepository.create).toHaveBeenCalledTimes(2);
      expect(speakerRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockSpeakers);
    });

    it('should throw NotFoundException when DubJob does not exist', async () => {
      mockDubJobRepository.findOne.mockResolvedValue(null);

      const dto: SaveSpeakersDto = { speakers: [] };

      await expect(
        service.saveSpeakers('non-existent-uuid', dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateJobStep', () => {
    it('should update existing job step', async () => {
      const existingStep = {
        uuid: 'step-uuid',
        dubJobId: 'dub-job-uuid',
        type: StepType.STT,
        status: StepStatus.IN_PROGRESS,
        stepOrder: 1,
        startedAt: new Date(),
      };

      const dto: UpdateJobStepDto = {
        status: StepStatus.COMPLETED,
        result: { transcripts: ['text'] },
      };

      mockDubJobRepository.findOne.mockResolvedValue(mockDubJob);
      mockJobStepRepository.findOne.mockResolvedValue(existingStep);
      mockJobStepRepository.save.mockResolvedValue({ ...existingStep, ...dto });

      const result = await service.updateJobStep(
        'dub-job-uuid',
        StepType.STT,
        dto,
      );

      expect(jobStepRepository.findOne).toHaveBeenCalledWith({
        where: {
          dubJobId: 'dub-job-uuid',
          type: StepType.STT,
        },
      });
      expect(result.status).toBe(StepStatus.COMPLETED);
    });

    it('should create new job step when it does not exist', async () => {
      const dto: UpdateJobStepDto = {
        status: StepStatus.IN_PROGRESS,
      };

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: 2 }),
      };

      mockDubJobRepository.findOne.mockResolvedValue(mockDubJob);
      mockJobStepRepository.findOne.mockResolvedValue(null);
      mockJobStepRepository.createQueryBuilder.mockReturnValue(queryBuilder);
      mockJobStepRepository.create.mockImplementation((data) => data);
      mockJobStepRepository.save.mockResolvedValue({
        uuid: 'new-step-uuid',
        dubJobId: 'dub-job-uuid',
        type: StepType.TRANSLATION,
        status: StepStatus.IN_PROGRESS,
        stepOrder: 3,
      });

      const result = await service.updateJobStep(
        'dub-job-uuid',
        StepType.TRANSLATION,
        dto,
      );

      expect(jobStepRepository.create).toHaveBeenCalled();
      expect(result.stepOrder).toBe(3);
    });

    it('should set startedAt when status changes to IN_PROGRESS', async () => {
      const existingStep = {
        uuid: 'step-uuid',
        dubJobId: 'dub-job-uuid',
        type: StepType.STT,
        status: StepStatus.PENDING,
        stepOrder: 1,
        startedAt: null,
      };

      const dto: UpdateJobStepDto = {
        status: StepStatus.IN_PROGRESS,
      };

      mockDubJobRepository.findOne.mockResolvedValue(mockDubJob);
      mockJobStepRepository.findOne.mockResolvedValue(existingStep);
      mockJobStepRepository.save.mockImplementation((step) =>
        Promise.resolve(step),
      );

      await service.updateJobStep('dub-job-uuid', StepType.STT, dto);

      expect(mockJobStepRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          startedAt: expect.any(Date),
        }),
      );
    });

    it('should set completedAt when status changes to COMPLETED', async () => {
      const existingStep = {
        uuid: 'step-uuid',
        dubJobId: 'dub-job-uuid',
        type: StepType.STT,
        status: StepStatus.IN_PROGRESS,
        stepOrder: 1,
        completedAt: null,
      };

      const dto: UpdateJobStepDto = {
        status: StepStatus.COMPLETED,
      };

      mockDubJobRepository.findOne.mockResolvedValue(mockDubJob);
      mockJobStepRepository.findOne.mockResolvedValue(existingStep);
      mockJobStepRepository.save.mockImplementation((step) =>
        Promise.resolve(step),
      );

      await service.updateJobStep('dub-job-uuid', StepType.STT, dto);

      expect(mockJobStepRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          completedAt: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException when DubJob does not exist', async () => {
      mockDubJobRepository.findOne.mockResolvedValue(null);

      const dto: UpdateJobStepDto = { status: StepStatus.COMPLETED };

      await expect(
        service.updateJobStep('non-existent-uuid', StepType.STT, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle error message updates', async () => {
      const existingStep = {
        uuid: 'step-uuid',
        dubJobId: 'dub-job-uuid',
        type: StepType.STT,
        status: StepStatus.IN_PROGRESS,
        stepOrder: 1,
      };

      const dto: UpdateJobStepDto = {
        status: StepStatus.FAILED,
        errorMessage: 'STT processing failed',
      };

      mockDubJobRepository.findOne.mockResolvedValue(mockDubJob);
      mockJobStepRepository.findOne.mockResolvedValue(existingStep);
      mockJobStepRepository.save.mockImplementation((step) =>
        Promise.resolve(step),
      );

      await service.updateJobStep('dub-job-uuid', StepType.STT, dto);

      expect(mockJobStepRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: StepStatus.FAILED,
          errorMessage: 'STT processing failed',
        }),
      );
    });
  });
});
