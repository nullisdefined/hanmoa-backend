import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { VideoAsset } from 'src/entities/video-asset.entity';
import { Repository } from 'typeorm';
import { UploadUrlRequestDto } from './dto/upload-url-request.dto';
import { Project } from 'src/entities/project.entity';
import { ulid } from 'ulid';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { DubJobsService } from '../dub-jobs/dub-jobs.service';
import { DubJob } from 'src/entities/dub-job.entity';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class VideosService {
  private s3Client: S3Client;
  private bucketName: string;
  private cloudfrontDomain: string;
  private sqsClient: SQSClient;
  private sqsQueueUrl: string;

  constructor(
    @InjectRepository(VideoAsset)
    private readonly videoRepository: Repository<VideoAsset>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly configService: ConfigService,
    private readonly dubJobService: DubJobsService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
    });
    this.sqsClient = new SQSClient({
      region: this.configService.get('AWS_REGION'),
    });
    this.bucketName = this.configService.get('AWS_S3_BUCKET');
    this.cloudfrontDomain = this.configService.get('AWS_CLOUDFRONT_DOMAIN');
    this.sqsQueueUrl = this.configService.get('AWS_SQS_DUBJOB_QUEUE_URL');
  }

  async getUploadUrl(
    userId: string,
    projectId: string,
    uploadUrlRequestDto: UploadUrlRequestDto,
  ) {
    const project = await this.projectRepository.findOne({
      where: { uuid: projectId },
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('이 프로젝트에 대한 권한이 없습니다.');
    }

    // 프로젝트에 기존 비디오가 있으면 삭제
    await this.videoRepository.delete({
      projectId: project.uuid,
    });

    const filesExtension = uploadUrlRequestDto.fileName.split('.').pop();
    const videoId = ulid();
    const s3Key = `videos/${projectId}/${videoId}.${filesExtension}`;

    const videoAsset = this.videoRepository.create({
      projectId: project.uuid,
      s3Key,
      status: 'uploading',
      mimeType: uploadUrlRequestDto.contentType,
    });
    await this.videoRepository.save(videoAsset);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ContentType: uploadUrlRequestDto.contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });

    return { uploadUrl, videoId: videoAsset.uuid, s3Key };
  }

  async completeUpload(
    userId: string,
    videoId: string,
    completeUploadDto: CompleteUploadDto,
  ) {
    const videoAsset = await this.videoRepository.findOne({
      where: { uuid: videoId },
      relations: ['project'],
    });

    if (!videoAsset) {
      throw new NotFoundException('비디오를 찾을 수 없습니다.');
    }

    if (videoAsset.project.userId !== userId) {
      throw new ForbiddenException('이 비디오에 대한 권한이 없습니다.');
    }

    if (videoAsset.status !== 'uploading') {
      throw new ForbiddenException(
        '업로드 중인 비디오만 완료 처리를 할 수 있습니다.',
      );
    }

    // S3 파일 존재 여부 확인
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: videoAsset.s3Key,
        }),
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'NotFound') {
        throw new BadRequestException(
          'S3에 업로드된 파일이 존재하지 않습니다.',
        );
      }
      throw new BadRequestException('S3에 업로드된 파일이 존재하지 않습니다.');
    }

    const headResult = await this.s3Client.send(
      new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: videoAsset.s3Key,
      }),
    );

    videoAsset.srcLang = completeUploadDto.srcLang;
    videoAsset.dstLang = completeUploadDto.dstLang;
    videoAsset.status = 'ready';
    videoAsset.fileSize = headResult.ContentLength;

    if (completeUploadDto.durationSec) {
      videoAsset.durationSec = completeUploadDto.durationSec;
    }

    await this.videoRepository.save(videoAsset);

    const dubJob = await this.dubJobService.createFromVideoAsset(videoAsset);

    await this.notifyAIPipeline(dubJob);

    return {
      uuid: videoAsset.uuid,
      status: videoAsset.status,
      srcLang: videoAsset.srcLang,
      dstLang: videoAsset.dstLang,
      s3Key: videoAsset.s3Key,
      cloudfrontUrl: `https://${this.cloudfrontDomain}/${videoAsset.s3Key}`,
      dubJobId: dubJob.uuid,
    };
  }

  async directUpload(
    userId: string,
    file: Express.Multer.File,
    projectId: string,
    srcLang: 'ko' | 'en',
    dstLang: 'ko' | 'en',
    durationSec?: number,
  ) {
    if (!file || !file.buffer || !file.originalname) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    // 프로젝트 권한 확인
    const project = await this.projectRepository.findOne({
      where: { uuid: projectId },
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('이 프로젝트에 대한 권한이 없습니다.');
    }

    // 프로젝트에 기존 비디오가 있으면 모두 삭제 (1:1 관계)
    await this.videoRepository.delete({
      projectId: project.uuid,
    });

    // 파일 정보 추출 (타입 안전성 확보)
    const originalName = file.originalname;
    const mimeType = file.mimetype;
    const fileSize = file.size;
    const fileBuffer = file.buffer;

    const fileExtension = originalName.split('.').pop() || 'mp4';
    const videoId = ulid();
    const s3Key = `videos/${projectId}/${videoId}.${fileExtension}`;

    // VideoAsset 생성
    const videoAsset = this.videoRepository.create({
      projectId: project.uuid,
      s3Key,
      status: 'uploading',
      mimeType,
      fileSize,
      srcLang,
      dstLang,
      durationSec,
    });
    await this.videoRepository.save(videoAsset);

    // S3에 파일 업로드
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
          Body: fileBuffer,
          ContentType: mimeType,
        }),
      );
    } catch (_error) {
      // 업로드 실패 시 VideoAsset 삭제
      await this.videoRepository.delete({ uuid: videoAsset.uuid });
      throw new BadRequestException('S3 업로드에 실패했습니다.');
    }

    // 상태를 ready로 변경
    videoAsset.status = 'ready';
    await this.videoRepository.save(videoAsset);

    // DubJob 자동 생성
    const dubJob = await this.dubJobService.createFromVideoAsset(videoAsset);

    // AI 파이프라인 트리거
    await this.notifyAIPipeline(dubJob);

    return {
      uuid: videoAsset.uuid,
      status: videoAsset.status,
      srcLang: videoAsset.srcLang,
      dstLang: videoAsset.dstLang,
      s3Key: videoAsset.s3Key,
      cloudfrontUrl: `https://${this.cloudfrontDomain}/${videoAsset.s3Key}`,
      dubJobId: dubJob.uuid,
      message: '비디오 업로드 및 DubJob 생성 완료',
    };
  }

  private async notifyAIPipeline(dubJob: DubJob) {
    try {
      const message = {
        dubJobId: dubJob.uuid,
        videoAssetId: dubJob.videoAssetId,
        projectId: dubJob.projectId,
        srcLang: dubJob.srcLang,
        dstLang: dubJob.dstLang,
        videoS3Key: dubJob.videoAsset.s3Key,
        durationSec: dubJob.videoAsset.durationSec,
        status: dubJob.status,
        createdAt: dubJob.createdAt.toISOString(),
      };

      const command = new SendMessageCommand({
        QueueUrl: this.sqsQueueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          dubJobId: {
            DataType: 'String',
            StringValue: dubJob.uuid,
          },
          srcLang: {
            DataType: 'String',
            StringValue: dubJob.srcLang,
          },
          dstLang: {
            DataType: 'String',
            StringValue: dubJob.dstLang,
          },
        },
      });

      const result = await this.sqsClient.send(command);

      this.logger.info(`Sent message to SQS queue: ${result.MessageId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send message to SQS queue: ${errorMessage}`);
    }
  }
}
