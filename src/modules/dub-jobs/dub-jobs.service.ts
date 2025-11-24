import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DubJob, DubJobStatus } from 'src/entities/dub-job.entity';
import { VideoAsset } from 'src/entities/video-asset.entity';
import { SegmentStatus } from 'src/entities/segment.entity';
import { StepStatus } from 'src/entities/job-step.entity';
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
        'segments.speaker',
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

  async findOneWithAuth(userId: string, jobId: string): Promise<DubJob> {
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

    if (dubJob.project.userId !== userId) {
      throw new ForbiddenException(`해당 DubJob에 대한 접근 권한이 없습니다.`);
    }

    return dubJob;
  }

  // DubJob 상태 조회 (프론트엔드 폴링)
  async getJobStatus(userId: string, jobId: string) {
    const dubJob = await this.dubJobRepository.findOne({
      where: { uuid: jobId },
      relations: ['project', 'segments', 'steps'],
    });

    if (!dubJob) {
      throw new NotFoundException(`해당 DubJob을 찾을 수 없습니다.`);
    }

    if (dubJob.project.userId !== userId) {
      throw new ForbiddenException(`해당 DubJob에 대한 접근 권한이 없습니다.`);
    }

    // 진행률 계산
    const totalSegments = dubJob.segments.length;
    const completedSegments = dubJob.segments.filter(
      (seg) =>
        seg.status === SegmentStatus.DUBBED ||
        seg.status === SegmentStatus.APPROVED,
    ).length;
    const progress =
      totalSegments > 0 ? (completedSegments / totalSegments) * 100 : 0;

    // 현재 진행 중인 스텝
    const currentStep = dubJob.steps
      .filter((step) => step.status === StepStatus.IN_PROGRESS)
      .sort((a, b) => a.stepOrder - b.stepOrder)[0];

    return {
      jobId: dubJob.uuid,
      status: dubJob.status,
      progress: Math.round(progress),
      totalSegments,
      completedSegments,
      currentStep: currentStep
        ? {
            type: currentStep.type,
            status: currentStep.status,
            stepOrder: currentStep.stepOrder,
          }
        : null,
    };
  }
}
