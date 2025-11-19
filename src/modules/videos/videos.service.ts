import {
  BadRequestException,
  ForbiddenException,
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

@Injectable()
export class VideosService {
  private s3Client: S3Client;
  private bucketName: string;
  private cloudfrontDomain: string;

  constructor(
    @InjectRepository(VideoAsset)
    private readonly videoRepository: Repository<VideoAsset>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly configService: ConfigService,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
    });
    this.bucketName = this.configService.get('AWS_S3_BUCKET');
    this.cloudfrontDomain = this.configService.get('AWS_CLOUDFRONT_DOMAIN');
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

    // 기존 uploading 상태의 비디오 제거
    await this.videoRepository.delete({
      projectId: project.uuid,
      status: 'uploading',
    });

    const filesExtension = uploadUrlRequestDto.fileName.split('.').pop();
    const videoId = ulid();
    const s3Key = `videos/${projectId}/${videoId}.${filesExtension}`;

    const videoAsset = this.videoRepository.create({
      projectId: project.uuid,
      s3Key,
      status: 'uploading',
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

    videoAsset.srcLang = completeUploadDto.srcLang;
    videoAsset.dstLang = completeUploadDto.dstLang;
    videoAsset.status = 'ready';

    if (completeUploadDto.durationSec) {
      videoAsset.durationSec = completeUploadDto.durationSec;
    }

    await this.videoRepository.save(videoAsset);

    return {
      uuid: videoAsset.uuid,
      status: videoAsset.status,
      srcLang: videoAsset.srcLang,
      dstLang: videoAsset.dstLang,
      s3Key: videoAsset.s3Key,
      cloudfrontUrl: `https://${this.cloudfrontDomain}/${videoAsset.s3Key}`,
    };
  }
}
