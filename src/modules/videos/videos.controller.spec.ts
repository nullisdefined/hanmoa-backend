import { Test, TestingModule } from '@nestjs/testing';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

const mockVideosService = {
  getUploadUrl: jest.fn(),
  completeUpload: jest.fn(),
};

describe('VideosController', () => {
  let controller: VideosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideosController],
      providers: [
        {
          provide: VideosService,
          useValue: mockVideosService,
        },
      ],
    }).compile();

    controller = module.get<VideosController>(VideosController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUploadUrl', () => {
    const userId = 'user-123';
    const projectId = 'project-123';
    const uploadUrlRequestDto = {
      fileName: 'test-video.mp4',
      contentType: 'video/mp4',
    };

    it('should return upload URL and video info', async () => {
      const expectedResult = {
        uploadUrl: 'https://test-presigned-url.com',
        videoId: 'video-123',
        s3Key: 'videos/project-123/video-123.mp4',
      };

      mockVideosService.getUploadUrl.mockResolvedValue(expectedResult);

      const result = await controller.getUploadUrl(
        userId,
        projectId,
        uploadUrlRequestDto,
      );

      expect(result).toEqual(expectedResult);
      expect(mockVideosService.getUploadUrl).toHaveBeenCalledWith(
        userId,
        projectId,
        uploadUrlRequestDto,
      );
    });

    it('should pass through service errors', async () => {
      mockVideosService.getUploadUrl.mockRejectedValue(
        new Error('Project not found'),
      );

      await expect(
        controller.getUploadUrl(userId, projectId, uploadUrlRequestDto),
      ).rejects.toThrow('Project not found');
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

    it('should complete upload and return video info', async () => {
      const expectedResult = {
        uuid: videoId,
        status: 'ready',
        srcLang: 'en',
        dstLang: 'ko',
        s3Key: 'videos/project-123/video-123.mp4',
        cloudfrontUrl:
          'https://test.cloudfront.net/videos/project-123/video-123.mp4',
      };

      mockVideosService.completeUpload.mockResolvedValue(expectedResult);

      const result = await controller.completeUpload(
        userId,
        videoId,
        completeUploadDto,
      );

      expect(result).toEqual(expectedResult);
      expect(mockVideosService.completeUpload).toHaveBeenCalledWith(
        userId,
        videoId,
        completeUploadDto,
      );
    });

    it('should pass through service errors', async () => {
      mockVideosService.completeUpload.mockRejectedValue(
        new Error('Video not found'),
      );

      await expect(
        controller.completeUpload(userId, videoId, completeUploadDto),
      ).rejects.toThrow('Video not found');
    });
  });
});
