import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { VideoAsset } from 'src/entities/video-asset.entity';
import { Repository } from 'typeorm';
import { UploadUrlRequestDto } from './dto/upload-url-request.dto';
import { Project } from 'src/entities/project.entity';
import { ulid } from 'ulid';

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

  async completeUpload() {}
}
