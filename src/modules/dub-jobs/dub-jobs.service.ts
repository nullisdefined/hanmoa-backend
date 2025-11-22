import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DubJob, DubJobStatus } from 'src/entities/dub-job.entity';
import { VideoAsset } from 'src/entities/video-asset.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DubJobsService {
  constructor(
    @InjectRepository(DubJob)
    private readonly dubJobRepository: Repository<DubJob>,
  ) {}

  async createFromVideoAsset(videoAsset: VideoAsset): Promise<DubJob> {
    const dubJob = this.dubJobRepository.create({
      projectId: videoAsset.projectId,
      videoAssetId: videoAsset.uuid,
      srcLang: videoAsset.srcLang,
      dstLang: videoAsset.dstLang,
      status: DubJobStatus.PENDING,
      totalDurationMs: videoAsset.durationSec
        ? videoAsset.durationSec * 1000
        : null,
      metadata: {
        createdFrom: 'video-upload',
        videoS3Key: videoAsset.s3Key,
      },
    });
    const savedDubJob = await this.dubJobRepository.save(dubJob);

    return this.dubJobRepository.findOne({
      where: { uuid: savedDubJob.uuid },
      relations: ['videoAsset'],
    });
  }

  async findPendingJobs(limit: number = 10): Promise<DubJob[]> {
    return await this.dubJobRepository.find({
      where: { status: DubJobStatus.PENDING },
      relations: ['videoAsset', 'project'],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async updateStatus(jobId: string, status: DubJobStatus): Promise<DubJob> {
    const dubJob = await this.dubJobRepository.findOne({
      where: { uuid: jobId },
    });

    if (!dubJob) {
      throw new NotFoundException(`해당 DubJob을 찾을 수 없습니다.`);
    }

    dubJob.status = status;
    return this.dubJobRepository.save(dubJob);
  }

  async findOne(jobId: string): Promise<DubJob> {
    const dubJob = await this.dubJobRepository.findOne({
      where: { uuid: jobId },
      relations: [
        'videoAsset',
        'project',
        'segments',
        'speakers',
        'outputs',
        'steps',
      ],
    });

    if (!dubJob) {
      throw new NotFoundException(`해당 DubJob을 찾을 수 없습니다.`);
    }

    return dubJob;
  }
}
