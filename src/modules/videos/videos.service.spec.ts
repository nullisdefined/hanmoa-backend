import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from './videos.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VideoAsset } from 'src/entities/video-asset.entity';
import { Project } from 'src/entities/project.entity';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DubJobsService } from '../dub-jobs/dub-jobs.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

const mockVideoRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const mockProjectRepository = {
  findOne: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      AWS_REGION: 'ap-northeast-2',
      AWS_S3_BUCKET: 'test-bucket',
      AWS_CLOUDFRONT_DOMAIN: 'test.cloudfront.net',
      AWS_SQS_QUEUE_URL: 'https://sqs.ap-northeast-2.amazonaws.com/test-queue',
    };
    return config[key];
  }),
};

const mockDubJobsService = {
  createFromVideoAsset: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// S3 send 함수 mock
const mockS3Send = jest.fn();

// AWS SDK mock
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockS3Send,
  })),
  PutObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  SendMessageCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://test-presigned-url.com'),
}));

describe('VideosService', () => {
  let service: VideosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        {
          provide: getRepositoryToken(VideoAsset),
          useValue: mockVideoRepository,
        },
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DubJobsService,
          useValue: mockDubJobsService,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);

    // 각 테스트 전에 모든 mock 초기화
    jest.clearAllMocks();
    // S3 send 기본값을 성공으로 설정
    mockS3Send.mockResolvedValue({});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUploadUrl', () => {
    const userId = 'user-123';
    const projectId = 'project-123';
    const uploadUrlRequestDto = {
      fileName: 'test-video.mp4',
      contentType: 'video/mp4',
    };

    it('should generate presigned URL successfully', async () => {
      const mockProject = {
        uuid: projectId,
        userId: userId,
      };

      const mockVideoAsset = {
        uuid: 'video-123',
        projectId: projectId,
        s3Key: `videos/${projectId}/video-123.mp4`,
        status: 'uploading',
      };

      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockVideoRepository.delete.mockResolvedValue({ affected: 0 });
      mockVideoRepository.create.mockReturnValue(mockVideoAsset);
      mockVideoRepository.save.mockResolvedValue(mockVideoAsset);

      const result = await service.getUploadUrl(
        userId,
        projectId,
        uploadUrlRequestDto,
      );

      expect(result).toHaveProperty('uploadUrl');
      expect(result).toHaveProperty('videoId');
      expect(result).toHaveProperty('s3Key');
      expect(mockProjectRepository.findOne).toHaveBeenCalledWith({
        where: { uuid: projectId },
      });
      expect(mockVideoRepository.delete).toHaveBeenCalledWith({
        projectId: projectId,
        status: 'uploading',
      });
      expect(mockVideoRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getUploadUrl(userId, projectId, uploadUrlRequestDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the project', async () => {
      const mockProject = {
        uuid: projectId,
        userId: 'different-user',
      };

      mockProjectRepository.findOne.mockResolvedValue(mockProject);

      await expect(
        service.getUploadUrl(userId, projectId, uploadUrlRequestDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('completeUpload', () => {
    const userId = 'user-123';
    const videoId = 'video-123';
    const completeUploadDto = {
      srcLang: 'en' as const,
      dstLang: 'ko' as const,
      durationSec: 120,
    };

    it('should complete upload successfully', async () => {
      const mockVideoAsset = {
        uuid: videoId,
        projectId: 'project-123',
        s3Key: 'videos/project-123/video-123.mp4',
        status: 'uploading',
        project: {
          userId: userId,
        },
      };

      const mockDubJob = {
        uuid: 'dub-job-123',
        projectId: 'project-123',
        videoAssetId: videoId,
      };

      mockVideoRepository.findOne.mockResolvedValue(mockVideoAsset);
      mockVideoRepository.save.mockResolvedValue({
        ...mockVideoAsset,
        status: 'ready',
        srcLang: completeUploadDto.srcLang,
        dstLang: completeUploadDto.dstLang,
        durationSec: completeUploadDto.durationSec,
      });
      mockDubJobsService.createFromVideoAsset.mockResolvedValue(mockDubJob);

      // S3 HeadObjectCommand 성공 mock
      mockS3Send.mockResolvedValue({});

      const result = await service.completeUpload(
        userId,
        videoId,
        completeUploadDto,
      );

      expect(result).toHaveProperty('uuid', videoId);
      expect(result).toHaveProperty('status', 'ready');
      expect(result).toHaveProperty('srcLang', 'en');
      expect(result).toHaveProperty('dstLang', 'ko');
      expect(result).toHaveProperty('cloudfrontUrl');
      expect(mockVideoRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when video not found', async () => {
      mockVideoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.completeUpload(userId, videoId, completeUploadDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the video', async () => {
      const mockVideoAsset = {
        uuid: videoId,
        status: 'uploading',
        project: {
          userId: 'different-user',
        },
      };

      mockVideoRepository.findOne.mockResolvedValue(mockVideoAsset);

      await expect(
        service.completeUpload(userId, videoId, completeUploadDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when video status is not uploading', async () => {
      const mockVideoAsset = {
        uuid: videoId,
        status: 'ready',
        project: {
          userId: userId,
        },
      };

      mockVideoRepository.findOne.mockResolvedValue(mockVideoAsset);

      await expect(
        service.completeUpload(userId, videoId, completeUploadDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
